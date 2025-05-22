#pragma once

#include <napi.h>
#include <mailio/bit7.hpp> // bit7 헤더 포함
#include <memory>          // std::unique_ptr 사용
#include <string>
#include <vector>

// mailio::bit7 클래스를 위한 N-API 래퍼 클래스
class Bit7Wrapper : public Napi::ObjectWrap<Bit7Wrapper> {
public:
    // N-API 모듈 초기화 시 호출되어 클래스를 JavaScript에 노출
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    // JavaScript에서 new Bit7Wrapper(...) 호출 시 실행될 생성자
    Bit7Wrapper(const Napi::CallbackInfo& info);

private:
    // JavaScript에서 호출될 메서드들
    Napi::Value Encode(const Napi::CallbackInfo& info); // 7bit 인코딩 수행
    Napi::Value Decode(const Napi::CallbackInfo& info); // 7bit 디코딩 수행

    // mailio::bit7 코덱 인스턴스를 가리키는 스마트 포인터
    // bit7은 복사/이동이 금지되어 unique_ptr 사용
    std::unique_ptr<mailio::bit7> codec_;
};