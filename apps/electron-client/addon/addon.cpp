#include <napi.h>
#include "base64_wrapper.hpp"
#include "imap_wrapper.hpp"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    Base64Wrapper::Init(env, exports);
    ImapWrapper::Init(env, exports);
    return exports;
}

NODE_API_MODULE(mailio_addon, InitAll)