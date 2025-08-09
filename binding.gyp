{
  "targets": [
    {
      "target_name": "read-pdf2llm",
      "sources": [ "src/read-pdf2llm.cpp" ],

      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include\")",
        // PDFium: passado pelo CI via PDFIUM_DIR=/path/para/pdfium
        "<!(node -p \"(process.env.PDFIUM_DIR || 'pdfium') + '/include'\")"
      ],

      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],

      // Onde estão as .so do PDFium
      "library_dirs": [
        "<!(node -p \"(process.env.PDFIUM_DIR || 'pdfium') + '/lib'\")"
      ],

      // Linka PDFium e deixa Tesseract/Leptonica pelo pkg-config
      "libraries": [
        "-lpdfium",
        "<!@(pkg-config --libs tesseract)",
        "<!@(pkg-config --libs lept)"
      ],

      // Flags de compilação (c++17 + exceptions) e includes do pkg-config
      "cflags_cc": [
        "-std=c++17",
        "-fexceptions",
        "<!@(pkg-config --cflags tesseract lept)"
      ],

      // RPATH no link para procurar .so ao lado do .node
      "ldflags": [
        "-Wl,-rpath,'$$ORIGIN'"
      ],

      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS=0"
      ]
    }
  ]
}
