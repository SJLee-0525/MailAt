{
  "targets": [
    {
      "target_name": "mailio_addon",
      "sources": [
        "base64_wrapper.cpp",
        "imap_wrapper.cpp"
      ],
      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include\")",
        "../mailio/include",
        "C:/vcpkg/installed/x64-windows/include"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": [ "NAPI_CPP_EXCEPTIONS", "MAILIO_EXPORT=" ]
      "cflags_cc!": [ "-fno-exceptions" ],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1,
          "AdditionalOptions": [ "/std:c++17" ]
        },
        "VCLinkerTool": {
          "AdditionalLibraryDirectories": [
            "C:/vcpkg/installed/x64-windows/lib"
          ]
        }
      },
      "libraries": [
        "mailio.lib",
        "boost_regex-vc143-mt-x64-1_83.lib",
        "boost_system-vc143-mt-x64-1_83.lib",
        "libssl.lib",
        "libcrypto.lib",
        "ws2_32.lib"
      ]
    }
  ]
}
