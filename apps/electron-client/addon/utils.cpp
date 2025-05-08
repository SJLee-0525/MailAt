#include "utils.hpp" // 함수 선언 포함

// Napi::Array를 std::vector<std::string>으로 변환하는 헬퍼 함수의 정의
std::vector<std::string> NapiArrayToStringVector(const Napi::Array& arr) {
    Napi::Env env = arr.Env(); // Env 가져오기
    std::vector<std::string> vec;
    vec.reserve(arr.Length());
    for (uint32_t i = 0; i < arr.Length(); ++i) {
        Napi::Value val = arr.Get(i);
        if (val.IsString()) {
            vec.push_back(val.As<Napi::String>().Utf8Value());
        } else {
             // 오류 발생 시 JavaScript 예외를 던짐
             Napi::TypeError::New(env, "Array elements must be strings").ThrowAsJavaScriptException();
             // 예외가 발생했으므로 빈 벡터를 반환하거나,
             // 호출 측에서 env.IsExceptionPending()을 확인하도록 함
             return {};
        }
    }
    return vec;
}