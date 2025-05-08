// src/utils/addons.js (또는 src/main/utils/addons.js)
import path from "path";
import { fileURLToPath } from "url";

// ESM에서 __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 애드온 모듈 경로 설정
const addonPath = path.join(__dirname, "../../build/Release/mailio_addon.node");
// CommonJS 방식을 동적 import로 변경 (ESM에서 require 사용 문제 해결)
let addonModule;

try {
  // 동적 import 사용 (ESM 환경에서 require 대체)
  addonModule = await import(addonPath);
} catch (error) {
  console.error(`애드온 모듈 로드 오류: ${error.message}`);
  // 임시 모의 객체 생성 (테스트용)
  addonModule = {
    SmtpWrapper: class MockSmtpWrapper {
      constructor(host, port) {
        this.host = host;
        this.port = port;
        console.log(`[MOCK] SMTP Wrapper 생성: ${host}:${port}`);
      }

      authenticate(username, password, authMethod) {
        console.log(`[MOCK] SMTP 인증: ${username}, 방식: ${authMethod}`);
        return "인증 성공 (모의)";
      }

      submit(rawMessage) {
        console.log("[MOCK] 이메일 제출");
        return "<message-id@example.com>";
      }

      quit() {
        console.log("[MOCK] SMTP 연결 종료");
        return "연결 종료 (모의)";
      }
    },

    ImapWrapper: class MockImapWrapper {
      constructor(host, port) {
        this.host = host;
        this.port = port;
        console.log(`[MOCK] IMAP Wrapper 생성: ${host}:${port}`);
      }

      authenticate(username, password) {
        console.log(`[MOCK] IMAP 인증: ${username}`);
        return true;
      }

      append(mailbox, message) {
        console.log(`[MOCK] 메시지 추가: ${mailbox}`);
        return true;
      }
    },

    Base64Wrapper: class MockBase64Wrapper {},
    Bit7Wrapper: class MockBit7Wrapper {},
    Bit8Wrapper: class MockBit8Wrapper {},
  };
}

// 애드온 모듈 내보내기
export const SmtpWrapper = addonModule.SmtpWrapper;
export const ImapWrapper = addonModule.ImapWrapper;
export const Base64Wrapper =
  addonModule.Base64Wrapper || class MockBase64Wrapper {};
export const Bit7Wrapper = addonModule.Bit7Wrapper || class MockBit7Wrapper {};
export const Bit8Wrapper = addonModule.Bit8Wrapper || class MockBit8Wrapper {};

export default addonModule;
