{
  "targets": [
    {
      "target_name": "read-pdf2llm",
      "sources": [ "src/read-pdf2llm.cpp" ],
      "include_dirs": [
        "<!(pwd)/pdfium/include",
        "/usr/include/tesseract",
        "/usr/include/leptonica",
        "<!(node -p \"require('node-addon-api').include\")",
        "<!(node -p \"require('node-addon-api').include_dir\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "library_dirs": [
        "pdfium/lib"
      ],
      "libraries": [
        "-lpdfium",
        "-ltesseract",
        "-llept"
      ],
      "defines": [ "NAPI_CPP_EXCEPTIONS" ],
      "cflags_cc!": [ "-fno-exceptions", "-std=c++17" ]
    }
  ]
}
