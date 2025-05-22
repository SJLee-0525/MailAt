// src/repositories/accountRepository.js
import { getConnection } from "../config/dbConfig.js";

/**
 * 계정 저장소 클래스
 */
class AccountRepository {
  /**
   * 새 계정 생성
   * @param {Number} userId - 사용자 ID
   * @param {Object} accountData - 계정 데이터
   * @returns {Promise<Object>} 생성된 계정 정보
   */
  async createAccount(userId, accountData) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        const {
          email,
          password,
          imapHost,
          imapPort,
          smtpHost,
          smtpPort,
          authMethod,
          provider,
        } = accountData;
        const currentDate = new Date().toISOString();

        const query = `INSERT INTO Account (
          user_id, email, password, imap_host, imap_port, 
          smtp_host, smtp_port, auth_method, provider, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.run(
          query,
          [
            userId,
            email,
            password,
            imapHost,
            imapPort,
            smtpHost,
            smtpPort,
            authMethod || "LOGIN",
            provider || "unknown",
            currentDate,
          ],
          function (err) {
            if (err) {
              reject(new Error(`계정 생성 오류: ${err.message}`));
              return;
            }

            // 생성 성공
            resolve({ accountId: this.lastID });
          }
        );
      });
    } catch (error) {
      console.error("계정 생성 오류:", error);
      throw new Error(`계정 생성 실패: ${error.message}`);
    }
  }

  /**
   * 계정 ID로 계정 정보 조회
   * @param {Number} accountId - 계정 ID
   * @returns {Promise<Object>} 계정 정보
   */
  async getAccountById(accountId) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        const query = `
        SELECT a.account_id, a.email, a.password, a.imap_host, a.imap_port, 
               a.smtp_host, a.smtp_port, a.auth_method, a.provider,
               u.username
        FROM Account a
        JOIN User u ON a.user_id = u.user_id
        WHERE a.account_id = ?
      `;

        db.get(query, [accountId], (err, row) => {
          if (err) {
            reject(new Error(`계정 조회 오류: ${err.message}`));
            return;
          }

          if (!row) {
            resolve(null);
            return;
          }

          resolve({
            accountId: row.account_id,
            email: row.email,
            password: row.password,
            imapHost: row.imap_host,
            imapPort: row.imap_port,
            smtpHost: row.smtp_host,
            smtpPort: row.smtp_port,
            authMethod: row.auth_method || "LOGIN",
            provider: row.provider,
            username: row.username,
          });
        });
      });
    } catch (error) {
      console.error("계정 조회 오류:", error);
      throw new Error(`계정 조회 실패: ${error.message}`);
    }
  }

  /**
   * 모든 계정 목록 조회
   * @returns {Promise<Array>} 계정 목록
   */
  async getAllAccounts() {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        const query = `
          SELECT a.account_id, a.email, a.imap_host, a.imap_port, 
                 a.smtp_host, a.smtp_port, a.auth_method, a.provider,
                 u.username
          FROM Account a
          JOIN User u ON a.user_id = u.user_id
          ORDER BY a.account_id
        `;

        db.all(query, [], (err, rows) => {
          if (err) {
            reject(new Error(`계정 목록 조회 오류: ${err.message}`));
            return;
          }

          const accounts = rows.map((row) => ({
            accountId: row.account_id,
            email: row.email,
            imapHost: row.imap_host,
            smtpHost: row.smtp_host,
            username: row.username,
          }));

          resolve(accounts);
        });
      });
    } catch (error) {
      console.error("계정 목록 조회 오류:", error);
      throw new Error(`계정 목록 조회 실패: ${error.message}`);
    }
  }

  /**
   * 계정 삭제
   * @param {Number} accountId - 삭제할 계정 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteAccount(accountId) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        db.run(
          `DELETE FROM Account WHERE account_id = ?`,
          [accountId],
          function (err) {
            if (err) {
              reject(new Error(`계정 삭제 오류: ${err.message}`));
              return;
            }

            if (this.changes === 0) {
              reject(
                new Error(
                  `계정 ID(${accountId})에 해당하는 계정을 찾을 수 없습니다.`
                )
              );
              return;
            }

            resolve({ success: true });
          }
        );
      });
    } catch (error) {
      console.error("계정 삭제 오류:", error);
      throw new Error(`계정 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 첫 번째 사용자 ID 가져오기
   * @returns {Promise<Number>} 사용자 ID
   */
  async getFirstUserId() {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        const query = `SELECT user_id FROM User LIMIT 1`;

        db.get(query, [], (err, row) => {
          if (err) {
            reject(new Error(`사용자 조회 오류: ${err.message}`));
            return;
          }

          if (!row) {
            reject(
              new Error(
                "사용자가 존재하지 않습니다. 먼저 사용자를 생성해주세요."
              )
            );
            return;
          }

          resolve(row.user_id);
        });
      });
    } catch (error) {
      console.error("사용자 조회 오류:", error);
      throw new Error(`사용자 조회 실패: ${error.message}`);
    }
  }

  /**
   * 이메일로 계정 존재 여부 확인
   * @param {String} email - 확인할 이메일
   * @returns {Promise<Boolean>} 계정 존재 여부
   */
  async checkEmailExists(email) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        const query = `SELECT COUNT(*) as count FROM Account WHERE email = ?`;

        db.get(query, [email], (err, row) => {
          if (err) {
            reject(new Error(`이메일 중복 확인 오류: ${err.message}`));
            return;
          }

          resolve(row.count > 0);
        });
      });
    } catch (error) {
      console.error("이메일 중복 확인 오류:", error);
      throw new Error(`이메일 중복 확인 실패: ${error.message}`);
    }
  }
}

export default new AccountRepository();
