import { getConnection } from "../config/dbConfig.js";

class FolderRepository {
  /**
   * 폴더 정보 업서트
   * @param {Object} folderData - 폴더 데이터
   * @returns {Promise<Number>} 폴더 ID
   */
  async upsertFolder(folderData) {
    const { accountId, name, path, type, flags } = folderData;
    const db = getConnection();
    const currentDate = new Date().toISOString();

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO Folder (account_id, name, path, type, flags, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(account_id, name) DO UPDATE SET
           path = excluded.path,
           type = excluded.type,
           flags = excluded.flags,
           updated_at = excluded.updated_at`,
        [accountId, name, path, type, flags, currentDate, currentDate],
        function (err) {
          if (err) {
            reject(new Error(`폴더 업서트 오류: ${err.message}`));
            return;
          }
          resolve(this.lastID);
        }
      );
    });
  }

  /**
   * 폴더 메타데이터 업데이트
   * @param {Object} metadata - 메타데이터
   * @returns {Promise<void>}
   */
  async updateFolderMetadata(metadata) {
    const {
      folderId,
      uidNext,
      uidValidity,
      messagesTotal,
      messagesRecent,
      messagesUnseen,
    } = metadata;
    const db = getConnection();
    const currentDate = new Date().toISOString();

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE Folder SET
           uid_next = ?,
           uid_validity = ?,
           messages_total = ?,
           messages_recent = ?,
           messages_unseen = ?,
           last_sync_at = ?,
           updated_at = ?
         WHERE folder_id = ?`,
        [
          uidNext,
          uidValidity,
          messagesTotal,
          messagesRecent,
          messagesUnseen,
          currentDate,
          currentDate,
          folderId,
        ],
        (err) => {
          if (err) {
            reject(new Error(`폴더 메타데이터 업데이트 오류: ${err.message}`));
            return;
          }
          resolve();
        }
      );
    });
  }

  /**
   * 계정의 모든 폴더 조회
   * @param {Number} accountId - 계정 ID
   * @returns {Promise<Array>} 폴더 목록
   */
  async getFoldersByAccount(accountId) {
    const db = getConnection();

    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM Folder 
         WHERE account_id = ? 
         ORDER BY 
           CASE type 
             WHEN 'inbox' THEN 1
             WHEN 'sent' THEN 2
             WHEN 'drafts' THEN 3
             WHEN 'spam' THEN 4
             WHEN 'trash' THEN 5
             ELSE 6
           END, name`,
        [accountId],
        (err, rows) => {
          if (err) {
            reject(new Error(`폴더 목록 조회 오류: ${err.message}`));
            return;
          }
          resolve(rows);
        }
      );
    });
  }

  /**
   * 폴더 조회 또는 생성
   * @param {Number} accountId - 계정 ID
   * @param {String} folderName - 폴더 이름
   * @returns {Promise<Number>} 폴더 ID
   */
  async getOrCreateFolder(accountId, folderName) {
    try {
      const db = getConnection();
      const currentDate = new Date().toISOString();

      return new Promise((resolve, reject) => {
        // 먼저 폴더가 존재하는지 확인
        db.get(
          `SELECT folder_id FROM Folder WHERE account_id = ? AND name = ?`,
          [accountId, folderName],
          (err, row) => {
            if (err) {
              reject(new Error(`폴더 조회 오류: ${err.message}`));
              return;
            }

            if (row) {
              resolve(row.folder_id);
            } else {
              // 폴더가 없으면 생성
              db.run(
                `INSERT INTO Folder (account_id, name, created_at) VALUES (?, ?, ?)`,
                [accountId, folderName, currentDate],
                function (err) {
                  if (err) {
                    reject(new Error(`폴더 생성 오류: ${err.message}`));
                    return;
                  }
                  resolve(this.lastID);
                }
              );
            }
          }
        );
      });
    } catch (error) {
      console.error("폴더 조회/생성 오류:", error);
      throw new Error(`폴더 처리 실패: ${error.message}`);
    }
  }

  /**
   * 폴더 이름으로 폴더 ID 조회
   * @param {Number} accountId - 계정 ID
   * @param {String} folderName - 폴더 이름
   * @returns {Promise<Number>} 폴더 ID
   */
  async getFolderIdByName(accountId, folderName) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        db.get(
          `SELECT folder_id FROM Folder WHERE account_id = ? AND name = ?`,
          [accountId, folderName],
          (err, row) => {
            if (err) {
              reject(new Error(`폴더 ID 조회 오류: ${err.message}`));
              return;
            }
            resolve(row ? row.folder_id : null);
          }
        );
      });
    } catch (error) {
      console.error("폴더 ID 조회 오류:", error);
      throw new Error(`폴더 ID 조회 실패: ${error.message}`);
    }
  }

  async getFolderMetadata(folderId) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        db.get(
          `SELECT uid_next, uid_validity, messages_total, messages_recent, messages_unseen, last_sync_at
         FROM Folder 
         WHERE folder_id = ?`,
          [folderId],
          (err, row) => {
            if (err) {
              reject(new Error(`폴더 메타데이터 조회 오류: ${err.message}`));
              return;
            }
            resolve(row);
          }
        );
      });
    } catch (error) {
      console.error("폴더 메타데이터 조회 오류:", error);
      throw new Error(`폴더 메타데이터 조회 실패: ${error.message}`);
    }
  }
}

export default new FolderRepository();
