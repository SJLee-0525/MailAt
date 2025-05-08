// src/services/imapService.js
import { ImapWrapper } from '../utils/addons.js';
import { getAccountCredentials } from '../repositories/accountRepository.js';

/**
 * 보낸 메일함에 메시지 저장
 * @param {Object} accountInfo - 계정 정보
 * @param {String} rawMessage - 원시 이메일 메시지
 * @returns {Promise<Object>} 저장 결과
 */
export const appendSentMessage = async (accountInfo, rawMessage) => {
  try {
    // 계정 인증 정보 가져오기
    const credentials = await getAccountCredentials(accountInfo.accountId);
    
    // 보낸 메일함 이름 설정 (기본값 'INBOX.Sent' 또는 'Sent')
    const sentMailbox = accountInfo.sentMailbox || 'INBOX.Sent';
    
    // IMAP 래퍼 인스턴스 생성
    const imap = new ImapWrapper(accountInfo.imapHost, accountInfo.imapPort);
    
    // 인증
    imap.authenticate(credentials.username, credentials.password);
    
    // 메시지 추가
    imap.append(sentMailbox, rawMessage);
    
    return { success: true, message: `메시지가 ${sentMailbox}에 저장되었습니다.` };
  } catch (error) {
    console.error('IMAP 메시지 추가 오류:', error);
    throw new Error(`보낸 메일함 저장 실패: ${error.message}`);
  }
};