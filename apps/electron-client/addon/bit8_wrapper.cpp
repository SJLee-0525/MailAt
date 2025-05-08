#include "bit8_wrapper.hpp"
#include "utils.hpp" // 추가: 헬퍼 함수 선언 포함
#include <vector>
#include <string>

using namespace Napi;

// Helper function -> 이 함수의 정의(구현)를 제거합니다.
/*
std::vector<std::string> NapiArrayToStringVector(const Napi::Array& arr) {
    ... 함수의 기존 구현 내용 ...
}
*/

Napi::Object Bit8Wrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Bit8Wrapper", {
        InstanceMethod("encode", &Bit8Wrapper::Encode),
        InstanceMethod("decode", &Bit8Wrapper::Decode)
    });

    exports.Set("Bit8Wrapper", func);
    return exports;
}

Bit8Wrapper::Bit8Wrapper(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<Bit8Wrapper>(info),
      // Default line policies, same as Base64Wrapper for consistency
      // Or get them from JS constructor arguments if needed:
      // info[0].As<Napi::Number>().Uint32Value(), info[1].As<Napi::Number>().Uint32Value()
      codec_(76, 76)
{
     // Add argument validation if line policies are passed from JS
     // if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
     //    Napi::TypeError::New(info.Env(), "Expected (line1_policy: number, lines_policy: number)").ThrowAsJavaScriptException();
     // }
}

Napi::Value Bit8Wrapper::Encode(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
         Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        std::string input = info[0].As<Napi::String>();
        std::vector<std::string> encoded_lines = codec_.encode(input);

        Napi::Array result = Napi::Array::New(env, encoded_lines.size());
        for (size_t i = 0; i < encoded_lines.size(); ++i) {
            result[i] = Napi::String::New(env, encoded_lines[i]);
        }
        return result;
    } catch (const mailio::codec_error& e) {
         Napi::Error::New(env, "Encoding error: " + std::string(e.what())).ThrowAsJavaScriptException();
         return env.Null();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value Bit8Wrapper::Decode(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsArray()) {
        Napi::TypeError::New(env, "Array expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        Napi::Array input_array = info[0].As<Napi::Array>();
        // utils.hpp에 선언된 함수를 사용
        std::vector<std::string> encoded_lines = NapiArrayToStringVector(input_array);

        // Check if conversion failed (e.g., non-string element found)
        if (env.IsExceptionPending()) {
            return env.Null(); // Exception already thrown by helper
        }

        std::string decoded_string = codec_.decode(encoded_lines);
        return Napi::String::New(env, decoded_string);
    } catch (const mailio::codec_error& e) {
         Napi::Error::New(env, "Decoding error: " + std::string(e.what())).ThrowAsJavaScriptException();
         return env.Null();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}