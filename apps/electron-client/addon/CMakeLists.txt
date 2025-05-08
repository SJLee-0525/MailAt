cmake_minimum_required(VERSION 3.16)
project(mailio_addon)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ------------------ 사용자 정의 경로 ------------------
# Node.js 및 node-addon-api 경로
# 실제 사용하는 Node 버전으로 업데이트 (로그에서는 29.4.6으로 보임)
set(NODE_VERSION "29.4.6")
set(NODE_ADDON_API_DIR "${CMAKE_SOURCE_DIR}/../node_modules/node-addon-api")
set(NODE_INCLUDE_DIR "$ENV{LOCALAPPDATA}/node-gyp/Cache/${NODE_VERSION}/include/node")
set(NODE_LIB_PATH "$ENV{LOCALAPPDATA}/node-gyp/Cache/${NODE_VERSION}/x64/node.lib")

# Mailio 라이브러리 위치
set(MAILIO_SRC_DIR "${CMAKE_SOURCE_DIR}/../mailio/src")
set(MAILIO_INCLUDE_DIR "${CMAKE_SOURCE_DIR}/../mailio/include")
# ------------------------------------------------------

# vcpkg 경로 추가 (vcpkg를 사용하는 경우)
list(APPEND CMAKE_PREFIX_PATH "C:/vcpkg/installed/x64-windows")

# Boost 설정 (system과 regex 컴포넌트 필요)
find_package(Boost REQUIRED COMPONENTS system regex)
# Boost를 찾지 못하면 수동 경로 설정 시도
if(NOT Boost_FOUND)
    set(BOOST_ROOT "C:/vcpkg/installed/x64-windows")
    find_package(Boost REQUIRED)
endif()

# OpenSSL 찾기 (mailio에서 필요)
find_package(OpenSSL)

# 라이브러리 생성
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

# .node 확장자 및 접두어 제거
set_target_properties(mailio_addon PROPERTIES
    PREFIX ""
    SUFFIX ".node"
)

# include 디렉토리 등록
target_include_directories(mailio_addon PRIVATE
    ${MAILIO_INCLUDE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${NODE_ADDON_API_DIR}
    ${NODE_INCLUDE_DIR}
    ${Boost_INCLUDE_DIRS}
    ${OPENSSL_INCLUDE_DIR}
)

# 컴파일 정의 추가
target_compile_definitions(mailio_addon PRIVATE
    MAILIO_EXPORTS
    _WIN32_WINNT=0x0601
    NAPI_CPP_EXCEPTIONS
)

# 링크 라이브러리 등록
target_link_libraries(mailio_addon PRIVATE
    ${NODE_LIB_PATH}
    ${Boost_LIBRARIES}
    ${OPENSSL_LIBRARIES}
    ws2_32  # Windows 소켓 라이브러리
)

# Windows 전용 옵션
if(WIN32)
    # 예외 처리 활성화
    target_compile_options(mailio_addon PRIVATE /EHsc)
endif()