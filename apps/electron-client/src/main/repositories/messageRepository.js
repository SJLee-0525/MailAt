// src/repositories/messageRepository.js
import { getConnection } from "../config/dbConfig.js";
import emailContactRepository from "./emailContactRepository.js";

class MessageRepository {
  /**
   * 메시지 저장
   * @param {Object} messageData - 메시지 데이터
   * @returns {Promise<Object>} 저장된 메시지 정보
   */
  async saveMessage(messageData) {
    try {
      const db = getConnection();
      const currentDate = new Date().toISOString();

      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run("BEGIN TRANSACTION");

          try {
            // 1. 메시지 저장
            const messageQuery = `
              INSERT OR REPLACE INTO Message (
                account_id, folder_id, external_message_id, thread_id,
                from_email, from_name, subject, snippet, body_text, body_html,
                reply_to, in_reply_to, reference_ids, sent_at, received_at,
                is_read, is_flagged, has_attachments, uid, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.run(
              messageQuery,
              [
                messageData.accountId,
                messageData.folderId,
                messageData.externalMessageId,
                messageData.threadId,
                messageData.fromEmail,
                messageData.fromName,
                messageData.subject,
                messageData.snippet,
                messageData.bodyText,
                messageData.bodyHtml,
                messageData.replyTo,
                messageData.inReplyTo,
                messageData.referenceIds,
                messageData.sentAt,
                messageData.receivedAt,
                messageData.isRead ? 1 : 0,
                messageData.isFlagged ? 1 : 0,
                messageData.hasAttachments ? 1 : 0,
                messageData.uid,
                currentDate,
              ],
              async function (err) {
                if (err) {
                  db.run("ROLLBACK");
                  reject(new Error(`메시지 저장 오류: ${err.message}`));
                  return;
                }

                const messageId = this.lastID;

                try {
                  // 2. 모든 이메일 연락처 저장 (FROM, TO, CC, BCC 모두 포함)
                  if (messageData.contacts && messageData.contacts.length > 0) {
                    for (const contact of messageData.contacts) {
                      if (contact.email) {
                        // EmailContact 테이블에 이메일 주소 저장/조회
                        const contactId =
                          await emailContactRepository.getOrCreateContact(
                            contact.email,
                            contact.name
                          );

                        // MessageContact 테이블에 참조 저장
                        const messageContactQuery = `
                          INSERT OR IGNORE INTO MessageContact (message_id, contact_id, type)
                          VALUES (?, ?, ?)
                        `;

                        db.run(
                          messageContactQuery,
                          [messageId, contactId, contact.type],
                          (err) => {
                            if (err) {
                              console.error(`연락처 저장 오류: ${err.message}`);
                            }
                          }
                        );
                      }
                    }
                  }

                  // 3. 헤더 저장
                  if (messageData.headers && messageData.headers.length > 0) {
                    const headerQuery = `
                      INSERT INTO Header (message_id, name, value)
                      VALUES (?, ?, ?)
                    `;

                    messageData.headers.forEach((header) => {
                      db.run(
                        headerQuery,
                        [messageId, header.name, header.value],
                        (err) => {
                          if (err) {
                            console.error(`헤더 저장 오류: ${err.message}`);
                          }
                        }
                      );
                    });
                  }

                  // 4. 첨부파일 저장
                  if (
                    messageData.attachments &&
                    messageData.attachments.length > 0
                  ) {
                    const attachmentQuery = `
                      INSERT INTO Attachment (
                        message_id, filename, mime_type, path, size, created_at
                      ) VALUES (?, ?, ?, ?, ?, ?)
                    `;

                    messageData.attachments.forEach((attachment) => {
                      db.run(
                        attachmentQuery,
                        [
                          messageId,
                          attachment.filename,
                          attachment.mimeType,
                          attachment.path,
                          attachment.size,
                          currentDate,
                        ],
                        (err) => {
                          if (err) {
                            console.error(`첨부파일 저장 오류: ${err.message}`);
                          }
                        }
                      );
                    });
                  }

                  // 트랜잭션 커밋
                  db.run("COMMIT", (err) => {
                    if (err) {
                      reject(new Error(`트랜잭션 커밋 오류: ${err.message}`));
                      return;
                    }
                    resolve({ messageId, ...messageData });
                  });
                } catch (error) {
                  db.run("ROLLBACK");
                  reject(new Error(`메시지 처리 오류: ${error.message}`));
                }
              }
            );
          } catch (error) {
            db.run("ROLLBACK");
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error("메시지 저장 오류:", error);
      throw new Error(`메시지 저장 실패: ${error.message}`);
    }
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
   * 계정의 최신 메시지 UID 조회
   * @param {Number} accountId - 계정 ID
   * @param {Number} folderId - 폴더 ID
   * @returns {Promise<Array>} UID 목록
   */
  async getExistingUids(accountId, folderId) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        db.all(
          `SELECT uid FROM Message WHERE account_id = ? AND folder_id = ?`,
          [accountId, folderId],
          (err, rows) => {
            if (err) {
              reject(new Error(`UID 조회 오류: ${err.message}`));
              return;
            }
            resolve(rows.map((row) => row.uid));
          }
        );
      });
    } catch (error) {
      console.error("UID 조회 오류:", error);
      throw new Error(`UID 조회 실패: ${error.message}`);
    }
  }

  /**
   * 메시지와 관련된 모든 연락처 조회
   * @param {Number} messageId - 메시지 ID
   * @returns {Promise<Array>} 연락처 목록
   */
  async getMessageContacts(messageId) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        db.all(
          `SELECT ec.*, mc.type
           FROM MessageContact mc
           JOIN EmailContact ec ON mc.contact_id = ec.contact_id
           WHERE mc.message_id = ?`,
          [messageId],
          (err, rows) => {
            if (err) {
              reject(new Error(`메시지 연락처 조회 오류: ${err.message}`));
              return;
            }
            resolve(rows);
          }
        );
      });
    } catch (error) {
      console.error("메시지 연락처 조회 오류:", error);
      throw new Error(`메시지 연락처 조회 실패: ${error.message}`);
    }
  }

  /**
   * 특정 연락처와 주고받은 메시지 목록 조회
   * @param {Number} contactId - 연락처 ID
   * @param {Object} options - 옵션 (limit, offset 등)
   * @returns {Promise<Array>} 메시지 목록
   */
  async getMessagesByContact(contactId, options = {}) {
    try {
      const db = getConnection();
      const { limit = 50, offset = 0 } = options;

      return new Promise((resolve, reject) => {
        db.all(
          `SELECT DISTINCT m.*
           FROM Message m
           JOIN MessageContact mc ON m.message_id = mc.message_id
           WHERE mc.contact_id = ?
           ORDER BY m.sent_at DESC
           LIMIT ? OFFSET ?`,
          [contactId, limit, offset],
          (err, rows) => {
            if (err) {
              reject(new Error(`연락처별 메시지 조회 오류: ${err.message}`));
              return;
            }
            resolve(rows);
          }
        );
      });
    } catch (error) {
      console.error("연락처별 메시지 조회 오류:", error);
      throw new Error(`연락처별 메시지 조회 실패: ${error.message}`);
    }
  }

  /**
   * 메시지 통계 조회
   * @param {Number} accountId - 계정 ID
   * @returns {Promise<Object>} 통계 정보
   */
  async getMessageStats(accountId) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        db.get(
          `SELECT 
            COUNT(DISTINCT m.message_id) as total_messages,
            COUNT(DISTINCT CASE WHEN mc.type = 'FROM' THEN mc.contact_id END) as unique_senders,
            COUNT(DISTINCT CASE WHEN mc.type IN ('TO', 'CC', 'BCC') THEN mc.contact_id END) as unique_recipients,
            COUNT(DISTINCT mc.contact_id) as total_contacts
           FROM Message m
           LEFT JOIN MessageContact mc ON m.message_id = mc.message_id
           WHERE m.account_id = ?`,
          [accountId],
          (err, row) => {
            if (err) {
              reject(new Error(`메시지 통계 조회 오류: ${err.message}`));
              return;
            }
            resolve(row);
          }
        );
      });
    } catch (error) {
      console.error("메시지 통계 조회 오류:", error);
      throw new Error(`메시지 통계 조회 실패: ${error.message}`);
    }
  }
}

export default new MessageRepository();
