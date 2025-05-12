cmake_minimum_required(VERSION 3.16)
project(mailio_addon)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# --------------------------------------------------
# Node.js 및 addon-api 경로 (수동 설정)
set(NODE_VERSION "29.4.6")
set(NODE_ADDON_API_DIR "${CMAKE_SOURCE_DIR}/../node_modules/node-addon-api")
set(NODE_INCLUDE_DIR "$ENV{LOCALAPPDATA}/node-gyp/Cache/${NODE_VERSION}/include/node")
set(NODE_LIB_PATH "$ENV{LOCALAPPDATA}/node-gyp/Cache/${NODE_VERSION}/x64/node.lib")

# mailio 경로
set(MAILIO_SRC_DIR "${CMAKE_SOURCE_DIR}/../mailio/src")
set(MAILIO_INCLUDE_DIR "${CMAKE_SOURCE_DIR}/../mailio/include")

# vcpkg 경로
list(APPEND CMAKE_PREFIX_PATH "C:/vcpkg/installed/x64-windows")

# Boost & OpenSSL
find_package(Boost REQUIRED COMPONENTS regex system)
find_package(OpenSSL REQUIRED)
# --------------------------------------------------

# 라이브러리 생성 (먼저 정의)
add_library(mailio_addon MODULE
    addon.cpp
    utils.cpp
    base64_wrapper.cpp
    imap_wrapper.cpp
    bit8_wrapper.cpp
    bit7_wrapper.cpp
    smtp_wrapper.cpp
    ${MAILIO_SRC_DIR}/base64.cpp
    ${MAILIO_SRC_DIR}/binary.cpp
    ${MAILIO_SRC_DIR}/bit7.cpp
    ${MAILIO_SRC_DIR}/bit8.cpp
    ${MAILIO_SRC_DIR}/codec.cpp
    ${MAILIO_SRC_DIR}/dialog.cpp
    ${MAILIO_SRC_DIR}/imap.cpp
    ${MAILIO_SRC_DIR}/mailboxes.cpp
    ${MAILIO_SRC_DIR}/message.cpp
    ${MAILIO_SRC_DIR}/mime.cpp
    ${MAILIO_SRC_DIR}/percent.cpp
    ${MAILIO_SRC_DIR}/pop3.cpp
    ${MAILIO_SRC_DIR}/q_codec.cpp
    ${MAILIO_SRC_DIR}/quoted_printable.cpp
    ${MAILIO_SRC_DIR}/smtp.cpp
)

# .node 확장자 지정
set_target_properties(mailio_addon PROPERTIES
    PREFIX ""
    SUFFIX ".node"
)

# include 경로
target_include_directories(mailio_addon PRIVATE
    ${MAILIO_INCLUDE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${NODE_ADDON_API_DIR}
    ${NODE_INCLUDE_DIR}
    ${Boost_INCLUDE_DIRS}
    ${OPENSSL_INCLUDE_DIR}
)

# 컴파일 정의
target_compile_definitions(mailio_addon PRIVATE
    MAILIO_EXPORTS
    _WIN32_WINNT=0x0601
    NAPI_CPP_EXCEPTIONS
)

# 링크 라이브러리
target_link_libraries(mailio_addon PRIVATE
    ${NODE_LIB_PATH}
    Boost::regex
    Boost::system
    OpenSSL::SSL
    OpenSSL::Crypto
    ws2_32
)

# Windows 전용
if(WIN32)
    target_compile_options(mailio_addon PRIVATE /EHsc)
endif()
