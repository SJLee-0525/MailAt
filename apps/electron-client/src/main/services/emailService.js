// src/services/emailService.js
import { createRawEmail } from '../utils/emailUtils.js';
import { formatAttachments } from '../utils/emailUtils.js';
import { SmtpService } from './smtpService.js';
import { getAccountCredentials } from '../repositories/accountRepository.js';

// SMTP 서비스 싱글톤 인스턴스
const smtpService = new SmtpService();

/**
 * 이메일 전송 서비스
 * @param {Object} emailData - 이메일 데이터
 * @returns {Promise<Object>} 전송 결과
 */
export const sendEmail = async (emailData) => {
  try {
    const { accountInfo } = emailData;
    
    // 첨부 파일 처리
    const processedAttachments = await formatAttachments(emailData.attachments);
    
    // RFC 5322 형식의 원시 이메일 생성
    const rawMessage = createRawEmail({
      ...emailData,
      attachments: processedAttachments
    });
    
    // 계정 인증 정보 가져오기
    const credentials = await getAccountCredentials(accountInfo.accountId);
    
    // SMTP 서비스를 통한 이메일 전송
    // 1. 연결
    smtpService.connect(accountInfo.smtpHost, accountInfo.smtpPort);
    
    // 2. 인증
    smtpService.authenticate(
      credentials.username,
      credentials.password,
      accountInfo.authMethod
    );
    
    // 3. 이메일 전송
    const result = smtpService.send(rawMessage);
    
    // 4. 연결 종료
    smtpService.quit();
    
    return {
      success: true,
      messageId: result.messageId,
      rawMessage: rawMessage // 보낸 메일함에 저장하기 위해 원시 메시지 반환
    };
  } catch (error) {
    // 오류 발생 시 연결 종료 시도
    try {
      smtpService.quit();
    } catch (quitError) {
      console.error('SMTP 연결 종료 오류:', quitError);
    }
    
    console.error('이메일 서비스 오류:', error);
    throw new Error(`이메일 전송 실패: ${error.message}`);
  }
};

/**
 * SMTP 서버 연결 테스트
 * @param {Object} config - 연결 설정
 * @returns {Promise<Object>} 테스트 결과
 */
export const testSmtpConnection = async (config) => {
  try {
    const { host, port } = config;
    const result = smtpService.connect(host, port);
    smtpService.quit();
    return { success: true, greeting: result.greeting };
  } catch (error) {
    try {
      smtpService.quit();
    } catch (quitError) {
      // 이미 연결이 끊어졌거나 연결이 안 된 상태일 수 있으므로 무시
    }
    console.error('SMTP 연결 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * SMTP 서버 인증 테스트
 * @param {Object} config - 인증 설정
 * @returns {Promise<Object>} 테스트 결과
 */
export const testSmtpAuthentication = async (config) => {
  try {
    const { host, port, username, password, authMethod } = config;
    
    // 연결
    smtpService.connect(host, port);
    
    // 인증
    const result = smtpService.authenticate(username, password, authMethod);
    
    // 연결 종료
    smtpService.quit();
    
    return { success: true, result };
  } catch (error) {
    try {
      smtpService.quit();
    } catch (quitError) {
      // 이미 연결이 끊어졌거나 연결이 안 된 상태일 수 있으므로 무시
    }
    console.error('SMTP 인증 오류:', error);
    return { success: false, error: error.message };
  }
};