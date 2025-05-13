import { getConnection } from "../config/dbConfig.js";

class EmailContactRepository {
  /**
   * 이메일 연락처 조회 또는 생성
   * @param {String} email - 이메일 주소
   * @param {String} name - 이름 (선택사항)
   * @returns {Promise<Number>} contact_id
   */
  async getOrCreateContact(email, name = null) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        db.serialize(() => {
          // 먼저 이메일이 존재하는지 확인
          db.get(
            `SELECT contact_id FROM EmailContact WHERE email = ?`,
            [email],
            (err, row) => {
              if (err) {
                reject(new Error(`연락처 조회 오류: ${err.message}`));
                return;
              }

              if (row) {
                // 이미 존재하는 경우 - 마지막 확인 시간 업데이트
                db.run(
                  `UPDATE EmailContact 
                   SET last_seen_at = CURRENT_TIMESTAMP,
                       name = CASE 
                         WHEN name IS NULL OR name = '' THEN ? 
                         ELSE name 
                       END
                   WHERE contact_id = ?`,
                  [name, row.contact_id],
                  (updateErr) => {
                    if (updateErr) {
                      console.error("연락처 업데이트 오류:", updateErr);
                    }
                  }
                );
                resolve(row.contact_id);
              } else {
                // 새로 생성
                db.run(
                  `INSERT INTO EmailContact (email, name) VALUES (?, ?)`,
                  [email, name],
                  function (insertErr) {
                    if (insertErr) {
                      reject(
                        new Error(`연락처 생성 오류: ${insertErr.message}`)
                      );
                      return;
                    }
                    resolve(this.lastID);
                  }
                );
              }
            }
          );
        });
      });
    } catch (error) {
      console.error("연락처 조회/생성 오류:", error);
      throw new Error(`연락처 처리 실패: ${error.message}`);
    }
  }

  /**
   * 모든 연락처 조회
   * @returns {Promise<Array>} 연락처 목록
   */
  async getAllContacts() {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        db.all(
          `SELECT contact_id, email, name, created_at, last_seen_at
           FROM EmailContact
           ORDER BY last_seen_at DESC`,
          [],
          (err, rows) => {
            if (err) {
              reject(new Error(`연락처 목록 조회 오류: ${err.message}`));
              return;
            }
            resolve(rows);
          }
        );
      });
    } catch (error) {
      console.error("연락처 목록 조회 오류:", error);
      throw new Error(`연락처 목록 조회 실패: ${error.message}`);
    }
  }

  /**
   * 특정 연락처와의 메시지 통계
   * @param {Number} contactId - 연락처 ID
   * @returns {Promise<Object>} 통계 정보
   */
  async getContactStats(contactId) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        db.get(
          `SELECT 
            COUNT(CASE WHEN mc.type = 'FROM' THEN 1 END) as received_count,
            COUNT(CASE WHEN mc.type IN ('TO', 'CC', 'BCC') THEN 1 END) as sent_count,
            MAX(m.sent_at) as last_interaction
           FROM MessageContact mc
           JOIN Message m ON mc.message_id = m.message_id
           WHERE mc.contact_id = ?`,
          [contactId],
          (err, row) => {
            if (err) {
              reject(new Error(`연락처 통계 조회 오류: ${err.message}`));
              return;
            }
            resolve(row);
          }
        );
      });
    } catch (error) {
      console.error("연락처 통계 조회 오류:", error);
      throw new Error(`연락처 통계 조회 실패: ${error.message}`);
    }
  }

  /**
   * 연락처 ID로 연락처 조회
   * @param {Number} contactId - 연락처 ID
   * @returns {Promise<Object>} 연락처 정보
   */
  async getContactById(contactId) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        db.get(
          `SELECT 
           contact_id as contactId, 
           email, 
           name, 
           created_at as createdAt, 
           last_seen_at as lastSeenAt
         FROM EmailContact 
         WHERE contact_id = ?`,
          [contactId],
          (err, row) => {
            if (err) {
              reject(new Error(`연락처 조회 오류: ${err.message}`));
              return;
            }
            resolve(row);
          }
        );
      });
    } catch (error) {
      console.error("연락처 조회 오류:", error);
      throw new Error(`연락처 조회 실패: ${error.message}`);
    }
  }
}

export default new EmailContactRepository();
