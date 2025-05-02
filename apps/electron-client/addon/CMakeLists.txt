cmake_minimum_required(VERSION 3.16)
project(mailio_addon)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(NODE_ADDON_API_DIR "C:/mailat/electron/node_modules/node-addon-api")
set(NODE_INCLUDE_DIR "C:/Users/SSAFY/AppData/Local/node-gyp/Cache/22.15.0/include/node")
set(MAILIO_INCLUDE_DIR "C:/mailat/electron/mailio/include")
set(NODE_LIB_PATH "C:/Users/SSAFY/AppData/Local/node-gyp/Cache/22.15.0/x64/node.lib")

find_path(NODE_ADDON_API_INCLUDE_DIR node_api.h PATHS "${CMAKE_JS_INC}" "$ENV{NODE_PATH}/include")

# mailio base64 source
set(MAILIO_INCLUDE_DIR "C:/mailat/electron/mailio/include")
set(MAILIO_SOURCE_FILE "C:/mailat/electron/mailio/src/base64.cpp")

add_library(mailio_addon MODULE
    addon.cpp
    base64_wrapper.cpp
    C:/mailat/electron/mailio/src/base64.cpp
    C:/mailat/electron/mailio/src/codec.cpp
)

# .node 확장자 및 prefix 제거
set_target_properties(mailio_addon PROPERTIES
    PREFIX ""
    SUFFIX ".node"
)

# include 디렉토리 설정
target_include_directories(mailio_addon PRIVATE
    ${MAILIO_INCLUDE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${NODE_ADDON_API_DIR}
    ${NODE_INCLUDE_DIR}
)

# Boost (vcpkg 설치 기준, 필요 시 따로 설정)
find_package(Boost REQUIRED COMPONENTS algorithm)
target_include_directories(mailio_addon PRIVATE ${Boost_INCLUDE_DIRS})
target_link_libraries(mailio_addon PRIVATE
    ${NODE_LIB_PATH}
    ${Boost_LIBRARIES}
)