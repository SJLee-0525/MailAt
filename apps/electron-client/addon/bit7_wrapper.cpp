#include "bit7_wrapper.hpp"
#include "utils.hpp" // 추가: 헬퍼 함수 선언 포함
#include <vector>
#include <string>
#include <stdexcept> // 예외 처리

using namespace Napi;

// Helper function (다른 래퍼와 공유 가능) -> 이 함수의 정의(구현)를 제거합니다.
/*
std::vector<std::string> NapiArrayToStringVector(const Napi::Array& arr) {
    ... 함수의 기존 구현 내용 ...
}
*/

// Bit7Wrapper 클래스를 JavaScript에 노출하는 초기화 함수
Napi::Object Bit7Wrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Bit7Wrapper", {
        InstanceMethod("encode", &Bit7Wrapper::Encode),
        InstanceMethod("decode", &Bit7Wrapper::Decode)
    });

    exports.Set("Bit7Wrapper", func);
    return exports;
}

// Bit7Wrapper의 C++ 생성자
Bit7Wrapper::Bit7Wrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Bit7Wrapper>(info) {
    Napi::Env env = info.Env();

    // JavaScript 생성자 인자 유효성 검사 (line1_policy, lines_policy)
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Bit7Wrapper constructor requires (line1_policy: number, lines_policy: number)").ThrowAsJavaScriptException();
        return;
    }

    size_t line1_policy = info[0].As<Napi::Number>().Int64Value(); // size_t 사용
    size_t lines_policy = info[1].As<Napi::Number>().Int64Value(); // size_t 사용

    try {
        // mailio::bit7 코덱 인스턴스 생성
        codec_ = std::make_unique<mailio::bit7>(line1_policy, lines_policy);
    } catch (const std::exception& e) {
        // 생성 중 오류 발생 시 JavaScript 예외 발생
        Napi::Error::New(env, "Failed to create Bit7 codec: " + std::string(e.what())).ThrowAsJavaScriptException();
    }
}

// 7bit 인코딩 처리
Napi::Value Bit7Wrapper::Encode(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
         Napi::TypeError::New(env, "String expected for encoding").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!codec_) { // 코덱 인스턴스가 유효한지 확인
        Napi::Error::New(env, "Bit7 codec is not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        std::string input = info[0].As<Napi::String>().Utf8Value();
        std::vector<std::string> encoded_lines = codec_->encode(input);

        Napi::Array result = Napi::Array::New(env, encoded_lines.size());
        for (size_t i = 0; i < encoded_lines.size(); ++i) {
            result[i] = Napi::String::New(env, encoded_lines[i]);
        }
        return result;
    } catch (const mailio::codec_error& e) {
         Napi::Error::New(env, "7bit Encoding error: " + std::string(e.what())).ThrowAsJavaScriptException();
         return env.Null();
    } catch (const std::exception& e) {
        Napi::Error::New(env, "Encoding error: " + std::string(e.what())).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// 7bit 디코딩 처리
Napi::Value Bit7Wrapper::Decode(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsArray()) {
        Napi::TypeError::New(env, "Array expected for decoding").ThrowAsJavaScriptException();
        return env.Null();
    }

     if (!codec_) { // 코덱 인스턴스가 유효한지 확인
        Napi::Error::New(env, "Bit7 codec is not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        Napi::Array input_array = info[0].As<Napi::Array>();
        // utils.hpp에 선언된 함수를 사용
        std::vector<std::string> encoded_lines = NapiArrayToStringVector(input_array);

        // NapiArrayToStringVector에서 오류 발생 시 예외가 이미 던져짐
        if (env.IsExceptionPending()) {
            return env.Null();
        }

        std::string decoded_string = codec_->decode(encoded_lines);
        return Napi::String::New(env, decoded_string);
    } catch (const mailio::codec_error& e) {
         Napi::Error::New(env, "7bit Decoding error: " + std::string(e.what())).ThrowAsJavaScriptException();
         return env.Null();
    } catch (const std::exception& e) {
        Napi::Error::New(env, "Decoding error: " + std::string(e.what())).ThrowAsJavaScriptException();
        return env.Null();
    }
}