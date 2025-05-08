#include "base64_wrapper.hpp"
#include <vector>
#include <string>

using namespace Napi;

Napi::Object Base64Wrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Base64Wrapper", {
        InstanceMethod("encode", &Base64Wrapper::Encode),
        InstanceMethod("decode", &Base64Wrapper::Decode)
    });

    exports.Set("Base64Wrapper", func);
    return exports;
}

Base64Wrapper::Base64Wrapper(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<Base64Wrapper>(info), codec_(76, 76)
{
}

Napi::Value Base64Wrapper::Encode(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString())
        return env.Null();

    std::string input = info[0].As<Napi::String>();
    std::vector<std::string> encoded_lines = codec_.encode(input);

    Napi::Array result = Napi::Array::New(env, encoded_lines.size());
    for (size_t i = 0; i < encoded_lines.size(); ++i) {
        result[i] = Napi::String::New(env, encoded_lines[i]);
    }

    return result;
}

Napi::Value Base64Wrapper::Decode(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsArray()) {
        Napi::TypeError::New(env, "Array expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Array input_array = info[0].As<Napi::Array>();
    std::vector<std::string> encoded_lines;
    for (uint32_t i = 0; i < input_array.Length(); ++i) {
        Napi::Value val = input_array[i];
        if (!val.IsString()) {
             Napi::TypeError::New(env, "Array elements must be strings").ThrowAsJavaScriptException();
             return env.Null();
        }
        encoded_lines.push_back(val.As<Napi::String>().Utf8Value());
    }

    try {
        std::string decoded_string = codec_.decode(encoded_lines);
        return Napi::String::New(env, decoded_string);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}