// src/main/services/smtpClient.js
import { SmtpWrapper } from "../utils/addons.js";

/**
 * SMTP 클라이언트 - SmtpWrapper에 대한 Promise 기반 추상화
 */
class SmtpClient {
  constructor() {
    this.smtp = null;
    this.isConnected = false;
  }

  /**
   * SMTP 서버에 연결
   * @param {String} host - SMTP 서버 호스트
   * @param {Number} port - SMTP 서버 포트
   * @param {Number} timeout_ms - 타임아웃 (선택적, 밀리초)
   * @returns {Promise<Object>} 연결 결과
   */
  async connect(host, port, timeout_ms = 30000) {
    return new Promise((resolve, reject) => {
      try {
        // 이미 연결된 경우 리소스 해제
        if (this.smtp) {
          this.smtp = null;
        }

        // 네이티브 모듈은 생성자에서 호스트와 포트를 받음
        this.smtp = new SmtpWrapper(host, port, timeout_ms);
        this.isConnected = true;

        resolve({
          greeting: "연결 성공",
        });
      } catch (error) {
        this.isConnected = false;
        this.smtp = null;
        reject(new Error(`SMTP 서버 연결 실패: ${error.message}`));
      }
    });
  }

  /**
   * SMTP 서버 인증
   * @param {String} username - 사용자 이름 (이메일)
   * @param {String} password - 비밀번호
   * @param {String} authMethod - 인증 방식 (NONE, LOGIN, START_TLS 중 하나)
   * @returns {Promise<Object>} 인증 결과
   */
  async authenticate(username, password, authMethod = "LOGIN") {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isConnected || !this.smtp) {
          throw new Error("SMTP 서버에 연결되어 있지 않습니다.");
        }

        // 샘플 코드와 맞춰 인증 시도
        try {
          const greeting = this.smtp.authenticate(
            username,
            password,
            authMethod
          );
          resolve({ success: true, greeting });
        } catch (authError) {
          throw new Error(`인증 실패: ${authError.message}`);
        }
      } catch (error) {
        reject(new Error(`SMTP 인증 실패: ${error.message}`));
      }
    });
  }

  /**
   * 이메일 전송 - 애드온 테스트 코드에 맞게 submit으로 변경
   * @param {String} rawMessage - RFC 5322 형식 원시 이메일
   * @returns {Promise<Object>} 전송 결과
   */
  async sendMail(rawMessage) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isConnected || !this.smtp) {
          throw new Error("SMTP 서버에 연결되어 있지 않습니다.");
        }

        // submit 메서드 사용 - 애드온의 실제 메서드 이름
        const response = this.smtp.submit(rawMessage);

        // 응답으로부터 메시지 ID 추출 또는 생성
        const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}>`;

        resolve({
          messageId,
          response,
        });
      } catch (error) {
        reject(new Error(`이메일 전송 실패: ${error.message}`));
      }
    });
  }

  /**
   * 리소스 정리
   * @returns {Promise<void>}
   */
  async quit() {
    return new Promise((resolve) => {
      // SmtpWrapper에는 quit 메서드가 없음
      // 가비지 컬렉션에 의존하여 리소스 정리
      this.smtp = null;
      this.isConnected = false;
      resolve();
    });
  }
}

export default SmtpClient;
