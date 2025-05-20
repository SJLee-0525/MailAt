// src/repositories/userRepository.js
import { getConnection } from "../config/dbConfig.js";

/**
 * 사용자 저장소 클래스
 */
class UserRepository {
  /**
   * 사용자 ID로 사용자 조회
   * @param {Number} userId - 사용자 ID
   * @returns {Promise<Object>} 사용자 정보
   */
  async getUserById(userId) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        const query = `SELECT user_id, username, created_at FROM User WHERE user_id = ?`;

        db.get(query, [userId], (err, row) => {
          if (err) {
            reject(new Error(`사용자 조회 오류: ${err.message}`));
            return;
          }

          if (!row) {
            return resolve(null);
          }

          resolve({
            userId: row.user_id,
            username: row.username,
            createdAt: row.created_at,
          });
        });
      });
    } catch (error) {
      console.error("사용자 조회 오류:", error);
      throw new Error(`사용자 조회 실패: ${error.message}`);
    }
  }

  /**
   * 새 사용자 생성
   * @param {Object} userData - 사용자 데이터
   * @returns {Promise<Object>} 생성된 사용자 정보
   */
  async createUser(userData) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        // 테이블들이 없으면 생성
        this.initTables(db)
          .then(() => {
            const { username } = userData;
            const currentDate = new Date().toISOString();
            
            db.run(
              `INSERT OR REPLACE INTO User (user_id, username, created_at) VALUES (1, ?, ?)`,
              [username, currentDate],
              function (err) {
                if (err) {
                  reject(new Error(`사용자 생성 오류: ${err.message}`));
                  return;
                }
  
                resolve({
                  userId: 1,
                  username,
                  createdAt: currentDate,
                });
              }
            );
          })
          .catch((err) => {
            reject(new Error(`테이블 초기화 오류: ${err.message}`));
          });
      });
    } catch (error) {
      console.error("사용자 생성 오류:", error);
      throw new Error(`사용자 생성 실패: ${error.message}`);
    }
  }

  /**
   * 사용자 정보 업데이트
   * @param {Number} userId - 사용자 ID
   * @param {Object} userData - 업데이트할 사용자 데이터
   * @returns {Promise<Object>} 업데이트된 사용자 정보
   */
  async updateUser(userId, userData) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        const { username } = userData;

        db.run(
          `UPDATE User SET username = ? WHERE user_id = ?`,
          [username, userId],
          function (err) {
            if (err) {
              reject(new Error(`사용자 업데이트 오류: ${err.message}`));
              return;
            }

            if (this.changes === 0) {
              reject(
                new Error(
                  `사용자 ID(${userId})에 해당하는 사용자를 찾을 수 없습니다.`
                )
              );
              return;
            }

            resolve({
              userId,
              username,
            });
          }
        );
      });
    } catch (error) {
      console.error("사용자 업데이트 오류:", error);
      throw new Error(`사용자 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 사용자 삭제
   * @param {Number} userId - 삭제할 사용자 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteUser(userId) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        db.run(`DELETE FROM User WHERE user_id = ?`, [userId], function (err) {
          if (err) {
            reject(new Error(`사용자 삭제 오류: ${err.message}`));
            return;
          }

          if (this.changes === 0) {
            reject(
              new Error(
                `사용자 ID(${userId})에 해당하는 사용자를 찾을 수 없습니다.`
              )
            );
            return;
          }

          resolve({ success: true });
        });
      });
    } catch (error) {
      console.error("사용자 삭제 오류:", error);
      throw new Error(`사용자 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 모든 테이블 초기화
   * @param {Object} db - 데이터베이스 연결 객체
   * @returns {Promise<void>}
   */
  async initTables(db) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        try {
          // User 테이블 생성
          db.run(`CREATE TABLE IF NOT EXISTS User (
            user_id INTEGER PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP
          )`);

          // Category 테이블 생성
          db.run(`CREATE TABLE IF NOT EXISTS Category (
            category_id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_name TEXT NOT NULL
          )`);

          // Account 테이블 생성
          db.run(`CREATE TABLE IF NOT EXISTS Account (
            account_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            email TEXT NOT NULL UNIQUE,
            imap_host TEXT NULL,
            imap_port INTEGER NULL,
            smtp_host TEXT NULL,
            smtp_port INTEGER NULL,
            auth_method TEXT NULL,
            provider TEXT NULL,
            created_at DATETIME NULL,
            password TEXT NULL,
            FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
          )`);

          // Folder 테이블 생성
          db.run(`CREATE TABLE IF NOT EXISTS Folder (
            folder_id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            path TEXT NULL,
            type TEXT NULL, -- 'inbox', 'sent', 'drafts', 'spam', 'trash', 'custom'
            flags TEXT NULL, -- IMAP 플래그들
            uid_next INTEGER NULL,
            uid_validity INTEGER NULL,
            messages_total INTEGER NULL,
            messages_recent INTEGER NULL,
            messages_unseen INTEGER NULL,
            last_sync_at DATETIME NULL,
            created_at DATETIME NULL,
            updated_at DATETIME NULL,
            FOREIGN KEY (account_id) REFERENCES Account(account_id) ON DELETE CASCADE,
            UNIQUE (account_id, name)
          )`);

          // Message 테이블 생성
          db.run(`CREATE TABLE IF NOT EXISTS Message (
            message_id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            folder_id INTEGER NOT NULL,
            external_message_id TEXT NULL,
            thread_id TEXT NULL,
            from_email TEXT NULL,
            from_name TEXT NULL,
            subject TEXT NULL,
            snippet TEXT NULL,
            body_text TEXT NULL,
            body_html TEXT NULL,
            reply_to TEXT NULL,
            in_reply_to TEXT NULL,
            reference_ids TEXT NULL,
            sent_at DATETIME NULL,
            received_at DATETIME NULL,
            is_read INTEGER DEFAULT 0,
            is_flagged INTEGER DEFAULT 0,
            has_attachments INTEGER DEFAULT 0,
            uid TEXT NULL,
            uid_validity TEXT NULL,
            category_id INTEGER NULL,
            sub_category_id INTEGER NULL,
            created_at DATETIME NOT NULL,
            FOREIGN KEY (account_id) REFERENCES Account(account_id) ON DELETE CASCADE,
            FOREIGN KEY (folder_id) REFERENCES Folder(folder_id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES Category(category_id) ON DELETE SET NULL,
            FOREIGN KEY (sub_category_id) REFERENCES Category(category_id) ON DELETE SET NULL,
            UNIQUE(account_id, external_message_id),
            UNIQUE(account_id, folder_id, uid, uid_validity)  -- 복합 유니크 제약조건
          )`);

          // EmailContact 테이블
          db.run(`CREATE TABLE IF NOT EXISTS EmailContact (
            contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            name TEXT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);

          // MessageContact 테이블
          db.run(`CREATE TABLE IF NOT EXISTS MessageContact (
            message_contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id INTEGER NOT NULL,
            contact_id INTEGER NOT NULL,
            type TEXT NOT NULL, -- 'FROM', 'TO', 'CC', 'BCC'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (message_id) REFERENCES Message(message_id) ON DELETE CASCADE,
            FOREIGN KEY (contact_id) REFERENCES EmailContact(contact_id),
            UNIQUE(message_id, contact_id, type)
          )`);
          // Header 테이블 생성
          db.run(`CREATE TABLE IF NOT EXISTS Header (
            header_id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id INTEGER NOT NULL,
            name TEXT NULL,
            value TEXT NULL,
            FOREIGN KEY (message_id) REFERENCES Message(message_id) ON DELETE CASCADE
          )`);

          // Attachment 테이블 생성
          db.run(`CREATE TABLE IF NOT EXISTS Attachment (
            attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id INTEGER NOT NULL,
            filename TEXT NULL,
            mime_type TEXT NULL,
            path TEXT NULL,
            size INTEGER NULL,
            created_at DATETIME NOT NULL,
            FOREIGN KEY (message_id) REFERENCES Message(message_id) ON DELETE CASCADE
          )`);

          // Calender 테이블 생성
          db.run(`CREATE TABLE IF NOT EXISTS Calendar (
            message_id INTEGER PRIMARY KEY,
            account_id INTEGER NOT NULL,
            summary TEXT NULL,
            scheduled_at DATETIME NULL,
            task TEXT NULL,
            FOREIGN KEY (message_id) REFERENCES Message(message_id) ON DELETE CASCADE,
            FOREIGN KEY (account_id) REFERENCES Account(account_id) ON DELETE CASCADE
          );`)

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}

export default new UserRepository();
