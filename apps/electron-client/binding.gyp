{
  "targets": [
    {
      "target_name": "mailio_addon",
      "sources": [
        "addon/addon.cpp",
        "addon/smtp_wrapper.cpp",
        "addon/imap_wrapper.cpp",
        "addon/bit7_wrapper.cpp",
        "addon/bit8_wrapper.cpp",
        "addon/base64_wrapper.cpp",
        "addon/utils.cpp",
        "mailio/src/base64.cpp",
        "mailio/src/binary.cpp",
        "mailio/src/bit7.cpp",
        "mailio/src/bit8.cpp",
        "mailio/src/codec.cpp",
        "mailio/src/dialog.cpp",
        "mailio/src/imap.cpp",
        "mailio/src/mailboxes.cpp",
        "mailio/src/message.cpp",
        "mailio/src/mime.cpp",
        "mailio/src/percent.cpp",
        "mailio/src/pop3.cpp",
        "mailio/src/q_codec.cpp",
        "mailio/src/quoted_printable.cpp",
        "mailio/src/smtp.cpp"
      ],
      "include_dirs": [
        "../../node_modules/node-addon-api",
        "mailio/include",
        "C:/boost_1_88_0",
        "C:/vcpkg/installed/x64-windows-static/include",
        "<(module_root_dir)"
      ],
      "defines": [
        "NAPI_CPP_EXCEPTIONS",
        "MAILIO_STATIC_LIB=1",
        "BOOST_ALL_NO_LIB",
        "_WIN32_WINNT=0x0601",
        "OPENSSL_USE_STATIC_LIBS"
      ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1,
          "AdditionalOptions": [ "/std:c++17" ]
        },
        "VCLinkerTool": {
          "AdditionalLibraryDirectories": [
            "C:/boost_1_88_0/stage/lib",
            "C:/vcpkg/installed/x64-windows-static/lib"
          ]
        }
      },
      "libraries": [
        "libboost_regex-vc143-mt-s-x64-1_88.lib",
        "libboost_system-vc143-mt-s-x64-1_88.lib",
        "libssl.lib",
        "libcrypto.lib",
        "ws2_32.lib",
        "Crypt32.lib"
      ]
    }
  ]
}