cmake_minimum_required(VERSION 3.16.3)
cmake_policy(SET CMP0167 NEW)

project(mailio VERSION 0.25.0)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if(NOT DEFINED LIB_SUFFIX)
  set(LIB_SUFFIX "" CACHE STRING "Suffix for installed library path. Ex. 64 for lib64")
endif()

if(NOT BIN_INSTALL_DIR)
  if(CMAKE_INSTALL_BINDIR)
    set(BIN_INSTALL_DIR ${CMAKE_INSTALL_BINDIR})
  else()
    set(BIN_INSTALL_DIR "${CMAKE_INSTALL_PREFIX}/bin")
  endif()
endif()

if(NOT LIB_INSTALL_DIR)
  if(CMAKE_INSTALL_LIBDIR)
    set(LIB_INSTALL_DIR ${CMAKE_INSTALL_LIBDIR})
  else()
    set(LIB_INSTALL_DIR "${CMAKE_INSTALL_PREFIX}/lib${LIB_SUFFIX}")
  endif()
endif()

if(NOT INCLUDE_INSTALL_DIR)
  if(CMAKE_INSTALL_INCLUDEDIR)
    set(INCLUDE_INSTALL_DIR ${CMAKE_INSTALL_INCLUDEDIR})
  else()
    set(INCLUDE_INSTALL_DIR "${CMAKE_INSTALL_PREFIX}/include")
  endif()
endif()

if(NOT SHARE_INSTALL_DIR)
  if(CMAKE_INSTALL_DATADIR)
    set(SHARE_INSTALL_DIR "${CMAKE_INSTALL_DATADIR}")
  else()
    set(SHARE_INSTALL_DIR "${CMAKE_INSTALL_PREFIX}/share")
  endif()
endif()

option(MAILIO_BUILD_DOCUMENTATION "Turn on to build doxygen based documentation." ON)
option(MAILIO_BUILD_EXAMPLES "Turn on to build examples." ON)
option(MAILIO_BUILD_TESTS "Turn on to build the tests." ON)
option(MAILIO_DYN_LINK_TESTS "Turn on to dynamically link the tests." OFF)
option(BUILD_SHARED_LIBS "Turn on to build mailio as a shared library." ON)

include(CMakeDependentOption)
cmake_dependent_option(MAILIO_BUILD_LATEX_DOCUMENTATION "Build latex docs" ON "MAILIO_BUILD_DOCUMENTATION" ON)

if(WIN32)
    set(Boost_USE_STATIC_LIBS ON)
endif()

# 🔧 Boost::asio 포함
find_package(Boost REQUIRED COMPONENTS system date_time regex asio)
find_package(OpenSSL)
set(CMAKE_THREAD_PREFER_PTHREAD)
set(THREADS_PREFER_PTHREAD_FLAG)
find_package(Threads)

set(project_sources
    ${PROJECT_SOURCE_DIR}/src/base64.cpp
    ${PROJECT_SOURCE_DIR}/src/binary.cpp
    ${PROJECT_SOURCE_DIR}/src/bit7.cpp
    ${PROJECT_SOURCE_DIR}/src/bit8.cpp
    ${PROJECT_SOURCE_DIR}/src/codec.cpp
    ${PROJECT_SOURCE_DIR}/src/dialog.cpp
    ${PROJECT_SOURCE_DIR}/src/imap.cpp
    ${PROJECT_SOURCE_DIR}/src/mailboxes.cpp
    ${PROJECT_SOURCE_DIR}/src/message.cpp
    ${PROJECT_SOURCE_DIR}/src/mime.cpp
    ${PROJECT_SOURCE_DIR}/src/percent.cpp
    ${PROJECT_SOURCE_DIR}/src/pop3.cpp
    ${PROJECT_SOURCE_DIR}/src/quoted_printable.cpp
    ${PROJECT_SOURCE_DIR}/src/q_codec.cpp
    ${PROJECT_SOURCE_DIR}/src/smtp.cpp
)

set(project_headers
    ${PROJECT_SOURCE_DIR}/include/mailio/base64.hpp
    ${PROJECT_SOURCE_DIR}/include/mailio/binary.hpp
    ${PROJECT_SOURCE_DIR}/include/mailio/bit7.hpp
    ${PROJECT_SOURCE_DIR}/include/mailio/bit8.hpp
    ${PROJECT_SOURCE_DIR}/include/mailio/codec.hpp
    ${PROJECT_SOURCE_DIR}/include/mailio/dialog.hpp
    ${PROJECT_SOURCE_DIR}/include/mailio/imap.hpp
    ${PROJECT_SOURCE_DIR}/include/mailio/mailboxes.hpp
    ${PROJECT_SOURCE_DIR}/include/mailio/message.hpp
    ${PROJECT_SOURCE_DIR}/include/mailio/mime.hpp
    ${PROJECT_SOURCE_DIR}/include/mailio/percent.hpp
    ${PROJECT_SOURCE_DIR}/include/mailio/pop3.hpp
    ${PROJECT_SOURCE_DIR}/include/mailio/quoted_printable.hpp
    ${PROJECT_SOURCE_DIR}/include/mailio/q_codec.hpp
    ${PROJECT_SOURCE_DIR}/include/mailio/smtp.hpp
)

if(${MAILIO_BUILD_DOCUMENTATION})
    find_package(Doxygen COMPONENTS doxygen OPTIONAL_COMPONENTS dot)
    if(DOXYGEN_FOUND)
        set(DOXYGEN_OUTPUT_DIRECTORY ${PROJECT_BINARY_DIR}/docs/mailio)
        set(DOXYGEN_GENERATE_LATEX ${MAILIO_BUILD_LATEX_DOCUMENTATION})
        set(DOXYGEN_OUTPUT_PATH ${DOCOUTDIR})

        doxygen_add_docs(docs ${PROJECT_SOURCE_DIR}/include ALL WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR})
        install(DIRECTORY ${DOXYGEN_OUTPUT_DIRECTORY} DESTINATION docs)
    else()
        message(STATUS "doxygen was not found, documentation will not be built")
    endif()
endif()

add_library(${PROJECT_NAME} ${project_sources} ${project_headers})

# pkg-config support
set(prefix "${CMAKE_INSTALL_PREFIX}")
set(exec_prefix "\${prefix}")

if(IS_ABSOLUTE "${LIB_INSTALL_DIR}")
  set(libdir "${LIB_INSTALL_DIR}")
else()
  set(libdir "\${exec_prefix}/${LIB_INSTALL_DIR}")
endif()

if(IS_ABSOLUTE "${INCLUDE_INSTALL_DIR}")
  set(includedir "${INCLUDE_INSTALL_DIR}/${PROJECT_NAME}")
else()
  set(includedir "\${prefix}/${INCLUDE_INSTALL_DIR}/${PROJECT_NAME}")
endif()

configure_file(mailio.pc.in ${CMAKE_BINARY_DIR}/mailio.pc IMMEDIATE @ONLY)
install(FILES ${CMAKE_BINARY_DIR}/mailio.pc DESTINATION ${LIB_INSTALL_DIR}/pkgconfig)

configure_file(${PROJECT_SOURCE_DIR}/include/version.hpp.in version.hpp)
install(FILES ${CMAKE_BINARY_DIR}/version.hpp DESTINATION ${INCLUDE_INSTALL_DIR}/${PROJECT_NAME})

include(GenerateExportHeader)
generate_export_header(${PROJECT_NAME} EXPORT_FILE_NAME export.hpp)

target_include_directories(${PROJECT_NAME}
    PUBLIC
        "$<BUILD_INTERFACE:${PROJECT_SOURCE_DIR}/include;${CMAKE_CURRENT_BINARY_DIR}>"
        "$<INSTALL_INTERFACE:include>"
)

install(FILES ${CMAKE_CURRENT_BINARY_DIR}/export.hpp DESTINATION "${INCLUDE_INSTALL_DIR}/${PROJECT_NAME}")

# 🔧 Boost::asio 포함 (명시적 링크)
if(Boost_FOUND)
    target_include_directories(${PROJECT_NAME} PUBLIC ${Boost_INCLUDE_DIRS})
    target_link_libraries(${PROJECT_NAME}
        Boost::system
        Boost::date_time
        Boost::regex
        Boost::asio
    )
endif()

if(OPENSSL_FOUND)
    target_include_directories(${PROJECT_NAME} PUBLIC ${OPENSSL_INCLUDE_DIR})
    target_link_libraries(${PROJECT_NAME} ${OPENSSL_LIBRARIES})
endif()

if(MSVC)
    target_compile_options(${PROJECT_NAME} PRIVATE /W2 /WX)
else()
    target_compile_options(${PROJECT_NAME} PRIVATE -Wall -Wextra -Wpedantic)
endif()

install(DIRECTORY include/mailio DESTINATION ${INCLUDE_INSTALL_DIR})

install(TARGETS ${PROJECT_NAME}
    EXPORT ${PROJECT_NAME}Config
    LIBRARY DESTINATION ${LIB_INSTALL_DIR}
    ARCHIVE DESTINATION ${LIB_INSTALL_DIR}
    RUNTIME DESTINATION ${BIN_INSTALL_DIR}
)

export(TARGETS ${PROJECT_NAME} FILE ${PROJECT_NAME}Config.cmake)
install(EXPORT ${PROJECT_NAME}Config DESTINATION share/${PROJECT_NAME}/cmake)
