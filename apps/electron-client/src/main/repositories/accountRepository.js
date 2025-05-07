// src/repositories/accountRepository.js
import { getConnection } from '../config/dbConfig.js';

/**
 * 계정 정보 조회
 * @param {String} accountId - 계정 ID
 * @returns {Promise<Object>} 계정 정보
 */
export const getAccountById = async (accountId) => {
  try {
    const db = getConnection();
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT a.email, a.smtp_host, a.smtp_port, a.imap_host, a.imap_port, a.auth_method, u.username 
        FROM Account a
        JOIN User u ON a.user_id = u.user_id
        WHERE a.account_id = ?
      `;
      
      db.get(query, [accountId], (err, row) => {
        if (err) {
          reject(new Error(`계정 정보 조회 오류: ${err.message}`));
          return;
        }
        
        if (!row) {
          reject(new Error(`계정 ID(${accountId})에 해당하는 계정을 찾을 수 없습니다.`));
          return;
        }
        
        // 보낸 메일함 위치 확인
        db.get(
          `SELECT name, path FROM Folder 
           WHERE account_id = ? AND (name LIKE '%Sent%' OR name LIKE '%sent%')
           LIMIT 1`,
          [accountId],
          (folderErr, folderRow) => {
            if (folderErr) {
              console.warn(`보낸 메일함 조회 오류: ${folderErr.message}`);
            }
            
            resolve({
              accountId,
              email: row.email,
              smtpHost: row.smtp_host,
              smtpPort: row.smtp_port,
              imapHost: row.imap_host,
              imapPort: row.imap_port,
              authMethod: row.auth_method,
              username: row.username,
              sentMailbox: folderRow ? folderRow.path || folderRow.name : 'INBOX.Sent'
            });
          }
        );
      });
    });
  } catch (error) {
    console.error('계정 정보 조회 오류:', error);
    throw new Error(`계정 정보 조회 실패: ${error.message}`);
  }
};

/**
 * 계정 관련 보안 정보 조회 (비밀번호 등)
 * @param {String} accountId - 계정 ID
 * @returns {Promise<Object>} 계정 보안 정보
 */
export const getAccountCredentials = async (accountId) => {
  try {
    const db = getConnection();
    
    return new Promise((resolve, reject) => {
      // 실제 환경에서는 보안 저장소에서 암호화된 비밀번호를 가져와야 함
      // 여기서는 임시로 DB에서 직접 읽는 것으로 가정
      const query = `SELECT email FROM Account WHERE account_id = ?`;
      
      db.get(query, [accountId], (err, row) => {
        if (err) {
          reject(new Error(`보안 정보 조회 오류: ${err.message}`));
          return;
        }
        
        if (!row) {
          reject(new Error(`계정 ID(${accountId})에 해당하는 계정을 찾을 수 없습니다.`));
          return;
        }
        
        // 실제 프로덕션 환경에서는 시스템 키체인이나 안전한 저장소에서 인증 정보를 가져와야 함
        // 여기서는 예시로만 제공
        resolve({
          username: row.email,
          password: '보안_저장소에서_가져온_비밀번호'  // 실제 구현 필요
        });
      });
    });
  } catch (error) {
    console.error('보안 정보 조회 오류:', error);
    throw new Error(`보안 정보 조회 실패: ${error.message}`);
  }
};