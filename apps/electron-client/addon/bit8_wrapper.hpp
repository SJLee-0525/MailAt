#pragma once

#include <napi.h>
#include <mailio/bit8.hpp>
#include <vector>
#include <string>

class Bit8Wrapper : public Napi::ObjectWrap<Bit8Wrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    Bit8Wrapper(const Napi::CallbackInfo& info);

private:
    Napi::Value Encode(const Napi::CallbackInfo& info);
    Napi::Value Decode(const Napi::CallbackInfo& info);

    mailio::bit8 codec_;
};