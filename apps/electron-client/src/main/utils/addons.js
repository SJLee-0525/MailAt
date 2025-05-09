// src/main/utils/addons.js
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// ESM에서 __dirname 흉내내기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// createRequire를 사용하여 require 함수 생성
const require = createRequire(import.meta.url);

// 모듈 기본값 (애드온 로드 실패 시 사용할 대체 구현)
class DummySmtpWrapper {
  constructor() {
    console.log("DummySmtpWrapper 인스턴스 생성됨");
  }

  sendMail(config, callback) {
    console.log("더미 SMTP sendMail 호출됨, 설정:", config);
    // 성공 응답 시뮬레이션
    setTimeout(
      () => callback(null, { success: true, message: "더미 전송 성공" }),
      500
    );
  }
}

class DummyImapWrapper {
  constructor() {
    console.log("DummyImapWrapper 인스턴스 생성됨");
  }

  fetchEmails(config, callback) {
    console.log("더미 IMAP fetchEmails 호출됨, 설정:", config);
    // 빈 이메일 목록 반환 시뮬레이션
    setTimeout(() => callback(null, []), 500);
  }
}

class DummyBase64Wrapper {
  encode(text) {
    return Buffer.from(text).toString("base64");
  }

  decode(base64) {
    return Buffer.from(base64, "base64").toString();
  }
}

class DummyBit7Wrapper {
  encode(text) {
    return text; // 간단한 구현을 위해 그대로 반환
  }

  decode(encoded) {
    return encoded;
  }
}

class DummyBit8Wrapper {
  encode(text) {
    return text; // 간단한 구현을 위해 그대로 반환
  }

  decode(encoded) {
    return encoded;
  }
}

// 애드온을 로드하거나 더미 구현을 제공하는 함수
function loadAddon() {
  // 가능한 경로들
  const possiblePaths = [
    path.join(__dirname, "../../../build/Release/mailio_addon.node"),
    path.join(__dirname, "../../build/Release/mailio_addon.node"),
    path.join(process.cwd(), "build/Release/mailio_addon.node"),
  ];

  console.log("현재 디렉토리:", process.cwd());
  console.log("__dirname:", __dirname);

  // 각 경로 시도
  for (const addonPath of possiblePaths) {
    try {
      console.log("애드온 경로 시도:", addonPath);

      // 파일 존재 여부 확인
      if (!fs.existsSync(addonPath)) {
        console.log(`${addonPath} 파일이 존재하지 않음. 다음 경로 시도...`);
        continue;
      }

      // 애드온 로드 시도
      const addonModule = require(addonPath);
      console.log("네이티브 애드온 모듈 로드 성공:", addonPath);

      return {
        SmtpWrapper: addonModule.SmtpWrapper,
        ImapWrapper: addonModule.ImapWrapper,
        Base64Wrapper: addonModule.Base64Wrapper,
        Bit7Wrapper: addonModule.Bit7Wrapper || null,
        Bit8Wrapper: addonModule.Bit8Wrapper,
        isNative: true,
        modulePath: addonPath,
      };
    } catch (error) {
      console.log(`${addonPath} 로드 중 오류:`, error.message);
    }
  }

  // 모든 경로 시도 실패 - 더미 구현 반환
  console.warn("네이티브 애드온을 로드할 수 없어 더미 구현을 사용합니다.");
  return {
    SmtpWrapper: DummySmtpWrapper,
    ImapWrapper: DummyImapWrapper,
    Base64Wrapper: DummyBase64Wrapper,
    Bit7Wrapper: DummyBit7Wrapper,
    Bit8Wrapper: DummyBit8Wrapper,
    isNative: false,
    modulePath: null,
  };
}

// 애드온 로드 (또는 더미 구현 가져오기)
const addon = loadAddon();

// 내보내기
export const SmtpWrapper = addon.SmtpWrapper;
export const ImapWrapper = addon.ImapWrapper;
export const Base64Wrapper = addon.Base64Wrapper;
export const Bit7Wrapper = addon.Bit7Wrapper;
export const Bit8Wrapper = addon.Bit8Wrapper;
export const isNativeAddonLoaded = addon.isNative;

// 디버깅 및 진단용 정보 출력
console.log(`네이티브 애드온 상태: ${addon.isNative ? "로드됨" : "더미 사용"}`);
if (addon.modulePath) {
  console.log(`사용된 애드온 경로: ${addon.modulePath}`);
}
