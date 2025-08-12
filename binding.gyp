{
  "targets": [
    {
      "target_name": "read-pdf2llm",
      "sources": ["src/read-pdf2llm.cpp"],
      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include_dir || require('node-addon-api').include\")",
        "<!(node -p \"(process.env.PDFIUM_DIR || 'pdfium') + '/include'\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "library_dirs": [
        "<!(node -p \"(process.env.PDFIUM_DIR || 'pdfium') + '/lib'\")"
      ],
      "libraries": [
        "-lpdfium",
        "<!@(pkg-config --libs tesseract)",
        "<!@(pkg-config --libs lept)"
      ],
      "cflags_cc": [
        "-std=c++17",
        "-fexceptions",
        "<!@(pkg-config --cflags tesseract lept)"
      ],
      "ldflags": [
        "-Wl,-rpath,'$$ORIGIN'"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS=0"
      ]
    }
  ]
}
