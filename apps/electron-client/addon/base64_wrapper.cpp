#include "base64_wrapper.hpp"

using namespace Napi;

Napi::Object Base64Wrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Base64Wrapper", {
        InstanceMethod("encode", &Base64Wrapper::Encode)
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