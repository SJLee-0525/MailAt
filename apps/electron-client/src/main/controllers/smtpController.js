// src/controllers/smtpController.js
import { ipcMain } from 'electron';
import { sendEmail, testSmtpConnection, testSmtpAuthentication } from '../services/emailService.js';
import { getAccountById } from '../repositories/accountRepository.js';
import { appendSentMessage } from '../services/imapService.js';

/**
 * SMTP 컨트롤러 초기화
 */
export const initSmtpController = () => {
  // 이메일 전송 요청 처리
  ipcMain.handle('email:send', async (event, emailData) => {
    try {
      const { accountId, to, cc, bcc, title, body, attachments, threadId, inReplyTo, references } = emailData;
      
      // 계정 ID 유효성 검사
      if (!accountId) {
        return { success: false, message: '계정 ID(accountId)는 필수입니다.' };
      }
      
      // 요청 유효성 검사
      if (!to || !Array.isArray(to) || to.length === 0) {
        return { success: false, message: '수신자(to)는 필수이며 배열 형태여야 합니다.' };
      }
      
      if (!title) {
        return { success: false, message: '제목(title)은 필수입니다.' };
      }
      
      // 계정 정보 조회
      const accountInfo = await getAccountById(accountId);
      if (!accountInfo) {
        return { success: false, message: `계정 ID(${accountId})에 해당하는 계정을 찾을 수 없습니다.` };
      }
      
      // 이메일 서비스 호출하여 전송
      const result = await sendEmail({
        accountId,
        accountInfo,
        to,
        cc: cc || [],
        bcc: bcc || [],
        title,
        body,
        attachments: attachments || [],
        threadId,
        inReplyTo,
        references: references || []
      });
      
      // 전송 성공 후 IMAP으로 보낸 메일함에 추가
      if (result.success && result.rawMessage) {
        try {
          const appendResult = await appendSentMessage(
            accountInfo,
            result.rawMessage
          );
          console.log('IMAP 저장 결과:', appendResult);
        } catch (imapError) {
          console.error('보낸 메일함 저장 오류:', imapError);
          // 보낸 메일함 저장에 실패해도 메일 전송 자체는 성공으로 처리
        }
      }
      
      return { 
        success: true, 
        messageId: result.messageId 
      };
      
    } catch (error) {
      console.error('이메일 전송 오류:', error);
      return { 
        success: false, 
        message: '이메일 전송 중 오류가 발생했습니다.',
        error: error.message
      };
    }
  });
  
  // SMTP 서버 연결 테스트
  ipcMain.handle('smtp:connect', async (event, config) => {
    return await testSmtpConnection(config);
  });
  
  // SMTP 인증 테스트
  ipcMain.handle('smtp:authenticate', async (event, config) => {
    return await testSmtpAuthentication(config);
  });
};

export default { initSmtpController };