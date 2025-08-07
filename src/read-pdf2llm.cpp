#include <napi.h>
#include "fpdfview.h"
#include "fpdf_text.h"
#include <tesseract/baseapi.h>
#include <leptonica/allheaders.h>
#include <sstream>
#include <vector>
#include <iostream>
#include <set>
#include <filesystem>
#include <map>

using namespace Napi;
namespace fs = std::filesystem;

// Use stdlib for UTF16 to UTF8 conversion if available
std::string Utf16ToUtf8(const std::u16string& u16) {
#if __cplusplus >= 201703L
  std::wstring_convert<std::codecvt_utf8_utf16<char16_t>, char16_t> convert;
  return convert.to_bytes(u16);
#else
  // Fallback: naive
  std::string result;
  for (char16_t c : u16) {
    if (c <= 0x7F) result.push_back(static_cast<char>(c));
    else if (c <= 0x7FF) {
      result.push_back(0xC0 | ((c >> 6) & 0x1F));
      result.push_back(0x80 | (c & 0x3F));
    } else {
      result.push_back(0xE0 | ((c >> 12) & 0x0F));
      result.push_back(0x80 | ((c >> 6) & 0x3F));
      result.push_back(0x80 | (c & 0x3F));
    }
  }
  return result;
#endif
}

// Macro de logging para depuração
#ifdef DEBUG
#define LOG(msg) std::cerr << "[DEBUG] " << msg << std::endl;
#else
#define LOG(msg)
#endif

// RAII para garantir destruição de recursos FPDF_PAGE
struct ScopedPage {
  FPDF_PAGE page;
  ScopedPage(FPDF_PAGE p) : page(p) {}
  ~ScopedPage() { if (page) FPDF_ClosePage(page); }
};

// RAII para bitmap
struct ScopedBitmap {
  FPDF_BITMAP bmp;
  ScopedBitmap(FPDF_BITMAP b) : bmp(b) {}
  ~ScopedBitmap() { if (bmp) FPDFBitmap_Destroy(bmp); }
};

// RAII para Pix
struct ScopedPix {
  Pix* pix;
  ScopedPix(Pix* p) : pix(p) {}
  ~ScopedPix() { if (pix) pixDestroy(&pix); }
};

// Função para sanitizar path: permite apenas arquivos locais .pdf
bool IsValidPdfPath(const std::string& path) {
  try {
    if (path.empty() || path.size() > 1024) return false;
    if (path.find('\0') != std::string::npos) return false;
    fs::path p(path);
    if (!fs::exists(p) || !fs::is_regular_file(p)) return false;
    if (p.extension() != ".pdf" && p.extension() != ".PDF") return false;
    // Opcional: bloqueia caminhos relativos perigosos
    if (path.find("..") != std::string::npos) return false;
    return true;
  } catch (...) {
    return false;
  }
}

// Pequeno cache para textos extraídos por OCR para imagens idênticas (hash simplista)
struct OcrCache {
  std::map<size_t, std::string> cache;
  std::hash<std::string> hasher;

  std::string get(const std::vector<uint8_t>& buffer) {
    size_t h = hasher(std::string(buffer.begin(), buffer.end()));
    auto it = cache.find(h);
    return (it != cache.end()) ? it->second : "";
  }
  void set(const std::vector<uint8_t>& buffer, const std::string& text) {
    size_t h = hasher(std::string(buffer.begin(), buffer.end()));
    cache[h] = text;
    // Opcional: limpe cache se ficar muito grande
    if (cache.size() > 128) cache.clear();
  }
};

class PdfReaderWorker : public AsyncWorker {
public:
  PdfReaderWorker(Function& emitFn, std::string path, std::string tessLang)
    : AsyncWorker(Function::New(emitFn.Env(), [](const CallbackInfo&) {})),
      pdfPath(std::move(path)), ocrLang(std::move(tessLang)) {
    tsfn = ThreadSafeFunction::New(
      emitFn.Env(),
      emitFn,
      "PdfEmit",
      0,
      1
    );
  }

  ~PdfReaderWorker() {
    tsfn.Release();
  }

  void Execute() override {
    if (!IsValidPdfPath(pdfPath)) {
      error = "Caminho PDF inválido ou arquivo não encontrado";
      return;
    }

    FPDF_DOCUMENT doc = FPDF_LoadDocument(pdfPath.c_str(), nullptr);
    if (!doc) {
      error = "Erro ao abrir PDF";
      return;
    }

    int pageCount = FPDF_GetPageCount(doc);
    if (pageCount <= 0) {
      FPDF_CloseDocument(doc);
      error = "PDF vazio";
      return;
    }

    OcrCache ocrCache;
    bool tessReady = false;
    std::unique_ptr<tesseract::TessBaseAPI> tess;

    for (int i = 0; i < pageCount; ++i) {
      std::ostringstream text;
      FPDF_PAGE page = FPDF_LoadPage(doc, i);
      ScopedPage sp(page);
      if (!page) continue;

      // Primeiro tenta extrair texto nativo
      FPDF_TEXTPAGE tp = FPDFText_LoadPage(page);
      std::u16string u16;
      for (int j = 0, len = FPDFText_CountChars(tp); j < len; ++j)
        u16.push_back(FPDFText_GetUnicode(tp, j));
      FPDFText_ClosePage(tp);

      if (!u16.empty()) {
        text << Utf16ToUtf8(u16);
      } else {
        // Renderiza a página para imagem, faz OCR
        int dpi = 150;
        double width = FPDF_GetPageWidth(page);
        double height = FPDF_GetPageHeight(page);
        int w = static_cast<int>(width * dpi / 72);
        int h = static_cast<int>(height * dpi / 72);
        int stride = w * 4;

        std::vector<uint8_t> buffer(h * stride, 0);
        FPDF_BITMAP bmp = FPDFBitmap_CreateEx(w, h, FPDFBitmap_BGRA, buffer.data(), stride);
        ScopedBitmap sbmp(bmp);
        if (!bmp) {
          error = "Erro ao criar bitmap PDF";
          return;
        }
        FPDF_RenderPageBitmap(bmp, page, 0, 0, w, h, 0, FPDF_ANNOT);

        Pix* pix = pixCreate(w, h, 32);
        ScopedPix spix(pix);
        if (!pix) {
          error = "Erro ao criar imagem Pix para OCR";
          return;
        }
        l_uint32* pixData = pixGetData(pix);
        int pixWpl = pixGetWpl(pix);
        if (pixWpl * 4 < w) {
          error = "pixGetWpl() retornou largura inválida";
          return;
        }
        for (int y = 0; y < h; ++y) {
          memcpy(pixData + y * pixWpl, buffer.data() + y * stride, w * 4);
        }

        // Verifica se já extraímos texto para essa imagem (cache)
        std::string cached = ocrCache.get(buffer);
        if (!cached.empty()) {
          text << "[OCR]\n" << cached;
        } else {
          if (!tessReady) {
            tess = std::make_unique<tesseract::TessBaseAPI>();
            if (tess->Init(nullptr, ocrLang.c_str()) != 0) {
              error = "Falha ao inicializar OCR Tesseract";
              return;
            }
            tessReady = true;
          }
          tess->SetImage(pix);
          char* ocrText = tess->GetUTF8Text();
          if (ocrText && strlen(ocrText) > 3) {
            text << "[OCR]\n" << ocrText;
            ocrCache.set(buffer, ocrText);
            delete[] ocrText;
          }
        }
      }

      // Emite evento para a página
      std::string pageText = text.str();
      tsfn.BlockingCall([i, pageText](Napi::Env env, Napi::Function emit) {
        try {
          Object payload = Object::New(env);
          payload.Set("page", Number::New(env, i + 1));
          payload.Set("text", String::New(env, pageText));
          emit.Call({ String::New(env, "page"), payload });
        } catch (const std::exception& ex) {
          std::cerr << "❌ Exceção na ThreadSafeFunction: " << ex.what() << std::endl;
        }
      });

      // Emite progresso a cada 5 páginas ou ao final
      if ((i + 1) % 5 == 0 || i + 1 == pageCount) {
        tsfn.BlockingCall([i, pageCount](Napi::Env env, Napi::Function emit) {
          try {
            double percent = ((i + 1) * 100.0) / pageCount;
            Object prog = Object::New(env);
            prog.Set("current", i + 1);
            prog.Set("total", pageCount);
            prog.Set("percent", percent);
            emit.Call({ String::New(env, "progress"), prog });
          } catch (const std::exception& ex) {
            std::cerr << "❌ Exceção na ThreadSafeFunction: " << ex.what() << std::endl;
          }
        });
      }
    }

    FPDF_CloseDocument(doc);
  }

  void OnOK() override {
    if (!error.empty()) {
      tsfn.BlockingCall([=](Napi::Env env, Napi::Function emit) {
        try {
          emit.Call({ String::New(env, "error"), String::New(env, error) });
        } catch (const std::exception& ex) {
          std::cerr << "❌ Exceção na ThreadSafeFunction: " << ex.what() << std::endl;
        }
      });
    }
    tsfn.BlockingCall([](Napi::Env env, Napi::Function emit) {
      try {
        emit.Call({ String::New(env, "end") });
      } catch (const std::exception& ex) {
        std::cerr << "❌ Exceção na ThreadSafeFunction: " << ex.what() << std::endl;
      }
    });
  }

  void OnError(const Error& e) override {
    tsfn.BlockingCall([=](Napi::Env env, Napi::Function emit) {
      try {
        emit.Call({ String::New(env, "error"), String::New(env, e.Message()) });
      } catch (const std::exception& ex) {
        std::cerr << "❌ Exceção na ThreadSafeFunction: " << ex.what() << std::endl;
      }
    });
  }

private:
  std::string pdfPath;
  std::string ocrLang;
  std::string error;
  ThreadSafeFunction tsfn;
};

Value StartReading(const CallbackInfo& info) {
  if (!info[0].IsFunction() || !info[1].IsString())
    throw Error::New(info.Env(), "Esperado: (emitFunction, caminhoPDF [, langOCR])");

  Function emit = info[0].As<Function>();
  std::string path = info[1].As<String>();
  std::string lang = "por";
  if (info.Length() > 2 && info[2].IsString()) {
    lang = info[2].As<String>();
    // Opcional: sanitize lang string (máx 8 chars, sem espaços, apenas letras)
    if (lang.length() > 8 || lang.find_first_not_of("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") != std::string::npos)
      lang = "por";
  }

  (new PdfReaderWorker(emit, path, lang))->Queue();
  return info.Env().Undefined();
}

Object InitAll(Env env, Object exports) {
  FPDF_InitLibrary();
  exports.Set("startReading", Function::New(env, StartReading));
  return exports;
}

NODE_API_MODULE(addon, InitAll)
