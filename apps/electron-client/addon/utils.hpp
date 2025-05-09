#pragma once

#include <napi.h>
#include <vector>
#include <string>

// Napi::Array를 std::vector<std::string>으로 변환하는 헬퍼 함수의 선언
std::vector<std::string> NapiArrayToStringVector(const Napi::Array& arr);