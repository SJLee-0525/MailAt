#include "smtp_wrapper.hpp"
#include <mailio/message.hpp> // 메일 메시지 파싱 및 포맷팅 위해 포함
#include <sstream>            // 문자열 스트림 사용 (필요시)
#include <stdexcept>          // 예외 처리
#include <boost/asio/ssl.hpp> // boost::asio::ssl::verify_mode 사용 위해 추가
#include <string>             // std::string 사용 위해 추가 (명시적)
#include <algorithm>          // std::replace 사용 위해 추가 (대안)

using namespace Napi;

// SmtpWrapper 클래스를 JavaScript에 노출하는 초기화 함수
Napi::Object SmtpWrapper::Init(Napi::Env env, Napi::Object exports) {
    // JavaScript 클래스 정의
    Napi::Function func = DefineClass(env, "SmtpWrapper", {
        // 인스턴스 메서드들을 JavaScript 함수로 매핑
        InstanceMethod("authenticate", &SmtpWrapper::Authenticate),
        InstanceMethod("submit", &SmtpWrapper::Submit),
        InstanceMethod("setSourceHostname", &SmtpWrapper::SetSourceHostname),
        InstanceMethod("getSourceHostname", &SmtpWrapper::GetSourceHostname),
        InstanceMethod("setSslOptions", &SmtpWrapper::SetSslOptions)
    });

    // 정의된 클래스를 exports 객체에 추가
    exports.Set("SmtpWrapper", func);
    return exports;
}

// SmtpWrapper의 C++ 생성자
SmtpWrapper::SmtpWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<SmtpWrapper>(info) {
    Napi::Env env = info.Env();

    // JavaScript 생성자 인자 유효성 검사 (호스트 이름, 포트 번호)
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "SMTP Wrapper constructor requires (hostname: string, port: number, [timeout_ms: number])").ThrowAsJavaScriptException();
        return;
    }

    std::string hostname = info[0].As<Napi::String>();
    int port = info[1].As<Napi::Number>().Int32Value();
    std::chrono::milliseconds timeout(0); // 기본 타임아웃: 0 (무한 대기)

    // 세 번째 인자로 타임아웃(ms)을 받을 수 있도록 처리
    if (info.Length() > 2 && info[2].IsNumber()) {
        timeout = std::chrono::milliseconds(info[2].As<Napi::Number>().Int64Value());
    }

    try {
        // mailio::smtps 클라이언트 인스턴스 생성
        smtp_client_ = std::make_unique<mailio::smtps>(hostname, port, timeout);
        // 기본 SSL 옵션 설정 (필요에 따라 setSslOptions로 변경 가능)
        // 예: mailio::dialog_ssl::ssl_options_t ssl_opts = { boost::asio::ssl::context::sslv23, boost::asio::ssl::verify_peer };
        // smtp_client_->ssl_options(ssl_opts);
    } catch (const std::exception& e) {
        // 생성 중 오류 발생 시 JavaScript 예외 발생
        Napi::Error::New(env, "Failed to create SMTP client: " + std::string(e.what())).ThrowAsJavaScriptException();
    }
}

// SMTP 인증 처리
Napi::Value SmtpWrapper::Authenticate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // 인자 유효성 검사 (사용자 이름, 비밀번호, 인증 방식)
    if (info.Length() < 3 || !info[0].IsString() || !info[1].IsString() || !info[2].IsString()) {
        Napi::TypeError::New(env, "Authenticate requires (username: string, password: string, authMethod: 'NONE' | 'LOGIN' | 'START_TLS')").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string username = info[0].As<Napi::String>();
    std::string password = info[1].As<Napi::String>();
    std::string authMethodStr = info[2].As<Napi::String>();

    // JavaScript 문자열을 mailio enum 값으로 변환
    mailio::smtps::auth_method_t authMethod;
    if (authMethodStr == "NONE") {
        authMethod = mailio::smtps::auth_method_t::NONE;
    } else if (authMethodStr == "LOGIN") {
        authMethod = mailio::smtps::auth_method_t::LOGIN;
    } else if (authMethodStr == "START_TLS") {
        authMethod = mailio::smtps::auth_method_t::START_TLS;
    } else {
        Napi::TypeError::New(env, "Invalid authMethod. Use 'NONE', 'LOGIN', or 'START_TLS'.").ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        // mailio 클라이언트의 authenticate 메서드 호출
        std::string greeting = smtp_client_->authenticate(username, password, authMethod);
        // 성공 시 서버 인사말 반환
        return Napi::String::New(env, greeting);
    } catch (const mailio::smtp_error& e) {
        // SMTP 관련 오류 발생 시 JavaScript 예외 발생
        Napi::Error::New(env, "SMTP Authentication Error: " + std::string(e.what()) + " Details: " + e.details()).ThrowAsJavaScriptException();
        return env.Null();
    } catch (const std::exception& e) {
        // 기타 오류 발생 시 JavaScript 예외 발생
        Napi::Error::New(env, "Authentication Error: " + std::string(e.what())).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// 메일 전송 처리
Napi::Value SmtpWrapper::Submit(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // 인자 유효성 검사 (메일 원본 문자열)
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Submit requires (raw_message: string)").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string raw_message = info[0].As<Napi::String>().Utf8Value(); // UTF8로 가져오기

    // --- 줄 바꿈 문자 변환 (LF -> CRLF) ---
    std::string corrected_message;
    corrected_message.reserve(raw_message.size() * 1.1); // 예상 크기 예약 (효율성)

    for (size_t i = 0; i < raw_message.size(); ++i) {
        // 이미 CRLF인 경우는 그대로 복사하고 다음 문자로 건너뜀
        if (raw_message[i] == '\r' && i + 1 < raw_message.size() && raw_message[i+1] == '\n') {
            corrected_message += "\r\n";
            i++; // '\n' 건너뛰기
        }
        // LF만 있는 경우 CRLF로 변환
        else if (raw_message[i] == '\n') {
            corrected_message += "\r\n";
        }
        // 그 외 문자는 그대로 복사
        else {
            corrected_message += raw_message[i];
        }
    }
    // ---------------------------------------


    try {
        // mailio::message 객체 생성
        mailio::message msg;

        // CRLF로 변환된 문자열을 message 객체로 파싱
        msg.parse(corrected_message); // 수정된 문자열 사용

        // 메일 전송 시도
        std::string server_response = smtp_client_->submit(msg);
        // 성공 시 서버 응답 반환
        return Napi::String::New(env, server_response);
    } catch (const mailio::smtp_error& e) {
        // SMTP 관련 오류 발생 시 JavaScript 예외 발생
        Napi::Error::New(env, "SMTP Submit Error: " + std::string(e.what()) + " Details: " + e.details()).ThrowAsJavaScriptException();
        return env.Null();
    } catch (const mailio::message_error& e) {
        // 메시지 파싱 오류 발생 시 JavaScript 예외 발생
        Napi::Error::New(env, "Message Parsing Error: " + std::string(e.what())).ThrowAsJavaScriptException();
        return env.Null();
    } catch (const std::exception& e) {
        // 기타 오류 발생 시 JavaScript 예외 발생
        Napi::Error::New(env, "Submit Error: " + std::string(e.what())).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// 소스 호스트 이름 설정
Napi::Value SmtpWrapper::SetSourceHostname(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "SetSourceHostname requires (hostname: string)").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string hostname = info[0].As<Napi::String>();
    try {
        smtp_client_->source_hostname(hostname);
    } catch (const std::exception& e) {
         Napi::Error::New(env, "Error setting source hostname: " + std::string(e.what())).ThrowAsJavaScriptException();
    }
    return env.Undefined(); // 반환값 없음
}

// 설정된 소스 호스트 이름 가져오기
Napi::Value SmtpWrapper::GetSourceHostname(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        std::string hostname = smtp_client_->source_hostname();
        return Napi::String::New(env, hostname);
    } catch (const std::exception& e) {
         Napi::Error::New(env, "Error getting source hostname: " + std::string(e.what())).ThrowAsJavaScriptException();
         return env.Null();
    }
}

// SSL/TLS 옵션 설정 (주로 인증서 검증 방식 설정)
Napi::Value SmtpWrapper::SetSslOptions(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // 예시: JavaScript에서 { verify_peer: boolean } 형태의 객체를 받는다고 가정
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "SetSslOptions requires an options object, e.g., { verify_peer: boolean }").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Object jsOptions = info[0].As<Napi::Object>();
    // mailio::dialog_ssl::ssl_options_t ssl_opts = smtp_client_->ssl_options(); // getter가 아니므로 제거
    mailio::dialog_ssl::ssl_options_t ssl_opts; // 새로운 옵션 객체 생성

    // 기본 컨텍스트 옵션 설정 (필요시)
    // ssl_opts.ctx_options = boost::asio::ssl::context::default_workarounds | boost::asio::ssl::context::no_sslv2 | boost::asio::ssl::context::no_sslv3;

    // verify_mode 설정 (기본값은 verify_peer로 가정, 필요시 mailio 기본값 확인)
    ssl_opts.verify_mode = boost::asio::ssl::verify_peer; // 기본적으로 검증 활성화
    if (jsOptions.Has("verify_peer") && jsOptions.Get("verify_peer").IsBoolean()) {
        bool verify = jsOptions.Get("verify_peer").As<Napi::Boolean>().Value();
        // boost::asio::ssl::verify_mode 설정
        ssl_opts.verify_mode = verify ? boost::asio::ssl::verify_peer : boost::asio::ssl::verify_none;
    }
    // 다른 옵션들 (예: context)도 필요에 따라 추가 가능

    try {
        smtp_client_->ssl_options(ssl_opts); // setter 함수 호출
    } catch (const std::exception& e) {
         Napi::Error::New(env, "Error setting SSL options: " + std::string(e.what())).ThrowAsJavaScriptException();
    }

    return env.Undefined();
}