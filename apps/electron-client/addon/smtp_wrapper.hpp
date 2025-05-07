#pragma once

#include <napi.h>
#include <mailio/smtp.hpp> // smtps 포함 (smtp 상속)
#include <memory>          // std::unique_ptr 사용
#include <string>
#include <vector>

// mailio::smtps 클래스를 위한 N-API 래퍼 클래스
class SmtpWrapper : public Napi::ObjectWrap<SmtpWrapper> {
public:
    // N-API 모듈 초기화 시 호출되어 클래스를 JavaScript에 노출
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    // JavaScript에서 new SmtpWrapper(...) 호출 시 실행될 생성자
    SmtpWrapper(const Napi::CallbackInfo& info);

private:
    // JavaScript에서 호출될 메서드들
    Napi::Value Authenticate(const Napi::CallbackInfo& info); // 인증 수행
    Napi::Value Submit(const Napi::CallbackInfo& info);       // 메일 전송
    Napi::Value SetSourceHostname(const Napi::CallbackInfo& info); // EHLO/HELO 시 사용할 호스트 이름 설정
    Napi::Value GetSourceHostname(const Napi::CallbackInfo& info); // 설정된 소스 호스트 이름 가져오기
    Napi::Value SetSslOptions(const Napi::CallbackInfo& info); // SSL/TLS 옵션 설정 (주로 인증서 검증 관련)

    // mailio::smtps 클라이언트 인스턴스를 가리키는 스마트 포인터
    std::unique_ptr<mailio::smtps> smtp_client_;
};