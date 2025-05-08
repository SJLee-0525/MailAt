// src/services/smtpService.js
import { SmtpWrapper } from '../utils/addons.js';

/**
 * SMTP 서비스 클래스
 */
export class SmtpService {
  constructor() {
    this.client = null;
  }

  /**
   * SMTP 서버에 연결
   * @param {String} host - 호스트명
   * @param {Number} port - 포트 번호
   * @returns {Object} 연결 결과
   */
  connect(host, port) {
    this.client = new SmtpWrapper(host, port);
    return { success: true, greeting: '서버에 연결되었습니다.' };
  }

  /**
   * SMTP 서버 인증
   * @param {String} username - 사용자 이름
   * @param {String} password - 비밀번호
   * @param {String} authMethod - 인증 방식 (LOGIN, PLAIN 등)
   * @returns {Object} 인증 결과
   */
  authenticate(username, password, authMethod = 'LOGIN') {
    if (!this.client) {
      throw new Error('SMTP 서버에 먼저 연결해야 합니다.');
    }
    
    const response = this.client.authenticate(username, password, authMethod);
    return { success: true, response };
  }

  /**
   * 이메일 전송
   * @param {Object} emailData - 이메일 데이터
   * @returns {Object} 전송 결과
   */
  send(rawMessage) {
    if (!this.client) {
      throw new Error('SMTP 서버에 먼저 연결해야 합니다.');
    }
    
    const response = this.client.submit(rawMessage);
    return { 
      success: true, 
      messageId: this.extractMessageId(response),
      response
    };
  }

  /**
   * 연결 종료
   * @returns {Object} 종료 결과
   */
  quit() {
    if (!this.client) {
      return { success: false, message: '연결되어 있지 않습니다.' };
    }
    
    try {
      const response = this.client.quit();
      this.client = null;
      return { success: true, message: '연결이 종료되었습니다.' };
    } catch (error) {
      this.client = null; // 오류가 발생해도 연결은 닫음
      throw error;
    }
  }

  /**
   * 응답에서 메시지 ID 추출
   * @param {String} response - SMTP 서버 응답
   * @returns {String} 메시지 ID
   */
  extractMessageId(response) {
    const match = response.match(/<([^>]+)>/);
    return match ? match[1] : `msg-${Date.now()}@domain.com`;
  }
}

export default SmtpService;