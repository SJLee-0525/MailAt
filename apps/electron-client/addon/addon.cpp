#include <napi.h>
#include "base64_wrapper.hpp"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return Base64Wrapper::Init(env, exports);
}

NODE_API_MODULE(mailio_addon, InitAll)