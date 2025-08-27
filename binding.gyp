{
  "targets": [
    {
      "target_name": "read-pdf2llm",
      "sources": ["addon/read-pdf2llm.cpp"],
      "include_dirs": [
        "/opt/pdfium/include",
        "/usr/include/tesseract",
        "/usr/include/leptonica",
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "library_dirs": [
        "/opt/pdfium/lib"
      ],
      "libraries": [
        "-lpdfium",
        "-ltesseract",
        "-llept"
      ],
      "defines": ["NAPI_CPP_EXCEPTIONS"],
      "cflags_cc": ["-std=c++17", "-fexceptions"],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LANGUAGE_STANDARD": "c++17"
      },
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1,
          "AdditionalOptions": ["/std:c++17"]
        }
      }
    }
  ]
}
