{
  "targets": [
    {
      "target_name": "read-pdf2llm",
      "sources": [ "src/read-pdf2llm.cpp" ],

      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include\")",
        "<!(node -p \"require('node-addon-api').include_dir\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],

      "defines": [ "NAPI_CPP_EXCEPTIONS" ],
      "cflags_cc": [ "-std=c++17", "-fexceptions" ],

      "conditions": [
        [ "OS=='linux'", {
          "include_dirs": [
            "<(module_root_dir)/vendor/linux-<(target_arch)/include",
            "<(module_root_dir)/vendor/linux-<(target_arch)/pdfium/include"
          ],
          "library_dirs": [
            "<(module_root_dir)/vendor/linux-<(target_arch)/lib",
            "<(module_root_dir)/vendor/linux-<(target_arch)/pdfium/lib"
          ],
          "libraries": [ "-lpdfium", "-ltesseract", "-llept" ],
          "ldflags": [ "-Wl,-rpath,'$ORIGIN'" ],
          "copies": [
            {
              "destination": "<(PRODUCT_DIR)",
              "files": [
                "<!@(bash -lc \"ls vendor/linux-<(target_arch)/bin/* 2>/dev/null || true\")"
              ]
            }
          ]
        }],

        [ "OS=='mac'", {
          "xcode_settings": {
            "MACOSX_DEPLOYMENT_TARGET": "11.0",
            "CLANG_CXX_LANGUAGE_STANDARD": "c++17",
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "OTHER_LDFLAGS": [ "-Wl,-rpath,@loader_path" ]
          },
          "include_dirs": [
            "<(module_root_dir)/vendor/darwin-<(target_arch)/include",
            "<(module_root_dir)/vendor/darwin-<(target_arch)/pdfium/include"
          ],
          "library_dirs": [
            "<(module_root_dir)/vendor/darwin-<(target_arch)/lib",
            "<(module_root_dir)/vendor/darwin-<(target_arch)/pdfium/lib"
          ],
          "libraries": [ "pdfium", "tesseract", "lept" ],
          "copies": [
            {
              "destination": "<(PRODUCT_DIR)",
              "files": [
                "<!@(bash -lc \"ls vendor/darwin-<(target_arch)/bin/* 2>/dev/null || true\")"
              ]
            }
          ]
        }],

        [ "OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "AdditionalOptions": [ "/std:c++17" ]
            }
          },
          "include_dirs": [
            "<(module_root_dir)/vendor/win32-<(target_arch)/include",
            "<(module_root_dir)/vendor/win32-<(target_arch)/pdfium/include"
          ],
          "library_dirs": [
            "<(module_root_dir)/vendor/win32-<(target_arch)/lib",
            "<(module_root_dir)/vendor/win32-<(target_arch)/pdfium/lib"
          ],
          "libraries": [ "pdfium.lib", "tesseract.lib", "leptonica.lib" ],
          "copies": [
            {
              "destination": "<(PRODUCT_DIR)",
              "files": [
                "<!(cmd /c for %i in (vendor\\win32-<(target_arch)\\bin\\*.dll) do @echo %i)"
              ]
            }
          ]
        }]
      ]
    }
  ]
}
