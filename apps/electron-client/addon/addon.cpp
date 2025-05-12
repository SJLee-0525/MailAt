#include <napi.h>
#include "base64_wrapper.hpp"
#include "imap_wrapper.hpp"
#include "bit8_wrapper.hpp"
#include "smtp_wrapper.hpp"
#include "bit7_wrapper.hpp"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    try {
        Base64Wrapper::Init(env, exports);
        ImapWrapper::Init(env, exports);
        Bit8Wrapper::Init(env, exports);
        Bit7Wrapper::Init(env, exports);
        SmtpWrapper::Init(env, exports);
    } catch (const std::exception& ex) {
        Napi::Error::New(env, std::string("Addon Init failed: ") + ex.what())
            .ThrowAsJavaScriptException();
    }
    return exports;
}

NODE_API_MODULE(mailio_addon, InitAll)