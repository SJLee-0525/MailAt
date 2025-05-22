#pragma once

#include <napi.h>
#include <mailio/base64.hpp>
#include <vector>
#include <string>

class Base64Wrapper : public Napi::ObjectWrap<Base64Wrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    Base64Wrapper(const Napi::CallbackInfo& info);

private:
    Napi::Value Encode(const Napi::CallbackInfo& info);
    Napi::Value Decode(const Napi::CallbackInfo& info);

    mailio::base64 codec_;
};