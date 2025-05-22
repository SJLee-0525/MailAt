// src/repositories/messageRepository.js
import { getConnection } from "../config/dbConfig.js";
import emailContactRepository from "./emailContactRepository.js";
import folderRepository from "./folderRepository.js";

class MessageRepository {
  /**
   * 메시지 저장
   * @param {Object} messageData - 메시지 데이터
   * @returns {Promise<Object>} 저장된 메시지 정보
   */
  /**
   * 메시지 저장
   * @param {Object} messageData - 메시지 데이터
   * @returns {Promise<Object>} 저장된 메시지 정보
   */
  async saveMessage(messageData) {
    try {
      const db = getConnection();
      const currentDate = new Date().toISOString();

      // 먼저 UID가 이미 존재하는지 확인
      const existingMessage = await this.findMessageByUid(
        messageData.accountId,
        messageData.folderId,
        messageData.uid
      );

      if (existingMessage) {
        console.log(
          `UID ${messageData.uid}를 가진 메시지가 이미 존재합니다. 업데이트를 건너뜁니다.`
        );
        return existingMessage; // 기존 메시지 반환하고 종료
      }

      // 트랜잭션 시작
      return new Promise((resolve, reject) => {
        db.run("BEGIN TRANSACTION", (transactionErr) => {
          if (transactionErr) {
            console.error("트랜잭션 시작 실패:", transactionErr.message);
            return reject(
              new Error(`트랜잭션 시작 실패: ${transactionErr.message}`)
            );
          }

          // 1. 메시지 저장
          const messageQuery = `
          INSERT INTO Message (
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
            function (insertErr) {
              if (insertErr) {
                console.error("메시지 삽입 실패:", insertErr.message);
                return db.run("ROLLBACK", () => {
                  reject(new Error(`메시지 저장 오류: ${insertErr.message}`));
                });
              }

              const messageId = this.lastID;
              console.log(
                `메시지 ID ${messageId} 생성 성공 (UID: ${messageData.uid})`
              );

              // 연락처, 헤더, 첨부파일 저장을 위한 Promise 배열
              const promises = [];

              // 2. 연락처 저장 (비동기 작업을 Promise로 래핑)
              if (messageData.contacts && messageData.contacts.length > 0) {
                // 연락처 처리를 위한 함수
                const processContacts = () => {
                  return new Promise((contactsResolve, contactsReject) => {
                    // 연락처 처리를 위한 순차적 실행 함수
                    const processContactSequentially = (index) => {
                      if (index >= messageData.contacts.length) {
                        return contactsResolve(); // 모든 연락처 처리 완료
                      }

                      const contact = messageData.contacts[index];
                      if (!contact.email) {
                        return processContactSequentially(index + 1); // 다음 연락처로
                      }

                      // 연락처 저장/조회를 Promise로 변환
                      emailContactRepository
                        .getOrCreateContact(contact.email, contact.name)
                        .then((contactId) => {
                          // MessageContact 테이블에 참조 저장
                          const messageContactQuery = `
                          INSERT OR IGNORE INTO MessageContact (message_id, contact_id, type)
                          VALUES (?, ?, ?)
                        `;

                          db.run(
                            messageContactQuery,
                            [messageId, contactId, contact.type],
                            (contactInsertErr) => {
                              if (contactInsertErr) {
                                console.error(
                                  `연락처 참조 저장 오류: ${contactInsertErr.message}`
                                );
                              }
                              // 오류가 있어도 계속 진행
                              processContactSequentially(index + 1);
                            }
                          );
                        })
                        .catch((contactErr) => {
                          console.error(
                            `연락처 조회/생성 오류: ${contactErr.message}`
                          );
                          processContactSequentially(index + 1);
                        });
                    };

                    // 연락처 처리 시작
                    processContactSequentially(0);
                  });
                };

                promises.push(processContacts());
              }

              // 3. 헤더 저장 (비동기 작업을 Promise로 래핑)
              if (messageData.headers && messageData.headers.length > 0) {
                const processHeaders = () => {
                  return new Promise((headersResolve) => {
                    const headerQuery = `
                    INSERT INTO Header (message_id, name, value)
                    VALUES (?, ?, ?)
                  `;

                    let headersProcessed = 0;

                    messageData.headers.forEach((header) => {
                      db.run(
                        headerQuery,
                        [messageId, header.name, header.value],
                        (headerErr) => {
                          if (headerErr) {
                            console.error(
                              `헤더 저장 오류: ${headerErr.message}`
                            );
                          }

                          headersProcessed++;
                          if (headersProcessed === messageData.headers.length) {
                            headersResolve();
                          }
                        }
                      );
                    });

                    // 헤더가 없는 경우를 대비
                    if (messageData.headers.length === 0) {
                      headersResolve();
                    }
                  });
                };

                promises.push(processHeaders());
              }

              // 4. 첨부파일 저장 (비동기 작업을 Promise로 래핑)
              if (
                messageData.attachments &&
                messageData.attachments.length > 0
              ) {
                const processAttachments = () => {
                  return new Promise((attachmentsResolve) => {
                    const attachmentQuery = `
                    INSERT INTO Attachment (
                      message_id, filename, mime_type, path, size, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                  `;

                    let attachmentsProcessed = 0;

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
                        (attachmentErr) => {
                          if (attachmentErr) {
                            console.error(
                              `첨부파일 저장 오류: ${attachmentErr.message}`
                            );
                          }

                          attachmentsProcessed++;
                          if (
                            attachmentsProcessed ===
                            messageData.attachments.length
                          ) {
                            attachmentsResolve();
                          }
                        }
                      );
                    });

                    // 첨부파일이 없는 경우를 대비
                    if (messageData.attachments.length === 0) {
                      attachmentsResolve();
                    }
                  });
                };

                promises.push(processAttachments());
              }

              // 모든 관련 데이터 저장이 완료되면 트랜잭션 커밋
              Promise.all(promises)
                .then(() => {
                  db.run("COMMIT", (commitErr) => {
                    if (commitErr) {
                      console.error("트랜잭션 커밋 실패:", commitErr.message);
                      return db.run("ROLLBACK", () => {
                        reject(
                          new Error(`트랜잭션 커밋 오류: ${commitErr.message}`)
                        );
                      });
                    }

                    console.log(
                      `메시지 ID ${messageId} 저장 완료 (UID: ${messageData.uid})`
                    );
                    resolve({ messageId, ...messageData });
                  });
                })
                .catch((promiseErr) => {
                  console.error("관련 데이터 저장 실패:", promiseErr.message);
                  db.run("ROLLBACK", () => {
                    reject(
                      new Error(`관련 데이터 저장 오류: ${promiseErr.message}`)
                    );
                  });
                });
            }
          );
        });
      });
    } catch (error) {
      console.error("메시지 저장 오류:", error);
      throw new Error(`메시지 저장 실패: ${error.message}`);
    }
  }

  // UID로 메시지 찾기 (새로 추가)
  async findMessageByUid(accountId, folderId, uid) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        db.get(
          `SELECT message_id FROM Message 
         WHERE account_id = ? AND folder_id = ? AND uid = ?`,
          [accountId, folderId, uid],
          (err, row) => {
            if (err) {
              reject(new Error(`UID로 메시지 검색 오류: ${err.message}`));
              return;
            }
            resolve(row);
          }
        );
      });
    } catch (error) {
      console.error("UID로 메시지 검색 오류:", error);
      throw new Error(`UID로 메시지 검색 실패: ${error.message}`);
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
            // uid 컬럼의 값만 배열로 반환
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
          `SELECT DISTINCT m.*, c.summary as summary
         FROM Message m
         JOIN MessageContact mc ON m.message_id = mc.message_id
         LEFT JOIN Calendar c ON m.message_id = c.message_id
         WHERE mc.contact_id = ?
         ORDER BY m.sent_at DESC
         LIMIT ? OFFSET ?`,
          [contactId, limit, offset],
          (err, rows) => {
            if (err) {
              reject(new Error(`연락처별 메시지 조회 오류: ${err.message}`));
              return;
            }
            const messages = rows.map((row) => {
              const messageData = this.formatMessageData(row);
              return {
                ...messageData,
                bodyHtml: row.body_html,
              };
            });
            resolve(messages);
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

  /**
   * 필터링을 통한 메시지 조회
   * @param {Object} params - 조회 파라미터
   * @returns {Promise<Array>} 메시지 목록
   */
  async getMessagesByFilter(params) {
    try {
      const db = getConnection();
      const {
        accountId,
        folderName,
        from,
        to,
        subject,
        includeKeywords,
        excludeKeywords,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
        sort = "sent_at",
        order = "DESC",
      } = params;

      // 필수 파라미터 검증
      if (!accountId || !folderName) {
        throw new Error("계정 ID와 폴더 이름은 필수입니다.");
      }

      // 폴더 ID 조회
      const folderId = await folderRepository.getFolderIdByName(
        accountId,
        folderName
      );
      if (!folderId) {
        throw new Error(`폴더를 찾을 수 없습니다: ${folderName}`);
      }

      // 기본 쿼리 작성
      let query = `
      SELECT DISTINCT m.*, 
        f.name as folder_name, 
        (SELECT COUNT(*) FROM Attachment WHERE message_id = m.message_id) as attachment_count
      FROM Message m
      JOIN Folder f ON m.folder_id = f.folder_id
    `;

      // 수신자 필터링이 있는 경우 MessageContact 테이블 조인
      if (to && to.length > 0) {
        query += `
        LEFT JOIN MessageContact mc ON m.message_id = mc.message_id
        LEFT JOIN EmailContact ec ON mc.contact_id = ec.contact_id
      `;
      }

      // WHERE 절 시작
      query += ` WHERE m.account_id = ? AND m.folder_id = ?`;
      const queryParams = [accountId, folderId];

      // 발신자 필터
      if (from && from.length > 0) {
        query += ` AND m.from_email IN (${from.map(() => "?").join(",")})`;
        queryParams.push(...from);
      }

      // 수신자 필터
      if (to && to.length > 0) {
        query += ` AND mc.type IN ('TO', 'CC', 'BCC') AND ec.email IN (${to.map(() => "?").join(",")})`;
        queryParams.push(...to);
      }

      // 제목 필터
      if (subject && subject.length > 0) {
        const subjectConditions = subject
          .map(() => "m.subject LIKE ?")
          .join(" OR ");
        query += ` AND (${subjectConditions})`;
        queryParams.push(...subject.map((subj) => `%${subj}%`));
      }

      // 기간 필터
      if (startDate) {
        query += ` AND m.sent_at >= ?`;
        queryParams.push(startDate);
      }

      if (endDate) {
        query += ` AND m.sent_at <= ?`;
        queryParams.push(endDate);
      }

      // 포함 키워드 필터
      if (includeKeywords && includeKeywords.length > 0) {
        const keywordConditions = includeKeywords
          .map(() => "(m.subject LIKE ? OR m.body_text LIKE ?)")
          .join(" OR ");

        query += ` AND (${keywordConditions})`;

        includeKeywords.forEach((keyword) => {
          queryParams.push(`%${keyword}%`, `%${keyword}%`);
        });
      }

      // 제외 키워드 필터 (새로 추가)
      if (excludeKeywords && excludeKeywords.length > 0) {
        const excludeConditions = excludeKeywords
          .map(() => "(m.subject NOT LIKE ? AND m.body_text NOT LIKE ?)")
          .join(" AND ");

        query += ` AND (${excludeConditions})`;

        excludeKeywords.forEach((keyword) => {
          queryParams.push(`%${keyword}%`, `%${keyword}%`);
        });
      }

      // 정렬 및 페이징
      query += ` ORDER BY m.${sort} ${order}`;
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);

      return new Promise((resolve, reject) => {
        db.all(query, queryParams, (err, rows) => {
          if (err) {
            reject(new Error(`메시지 필터링 조회 오류: ${err.message}`));
            return;
          }

          // 결과 형식화
          const messages = rows.map((row) => ({
            messageId: row.message_id,
            externalMessageId: row.external_message_id,
            threadId: row.thread_id,
            accountId: row.account_id,
            folderId: row.folder_id,
            folderName: row.folder_name,
            fromEmail: row.from_email,
            fromName: row.from_name,
            subject: row.subject,
            snippet: row.snippet,
            sentAt: row.sent_at,
            receivedAt: row.received_at,
            isRead: Boolean(row.is_read),
            isFlagged: Boolean(row.is_flagged),
            hasAttachments: Boolean(row.has_attachments),
            attachmentCount: row.attachment_count || 0,
          }));

          resolve(messages);
        });
      });
    } catch (error) {
      console.error("메시지 필터링 조회 오류:", error);
      throw new Error(`메시지 필터링 조회 실패: ${error.message}`);
    }
  }

  /**
   * 필터링을 적용한 메시지 조회
   * @param {Object} params - 필터 파라미터
   * @returns {Promise<Array>} 메시지 목록
   */
  async getFilteredMessages(params) {
    try {
      const db = getConnection();
      const {
        accountId,
        folderName,
        from,
        to,
        subject,
        includeKeywords,
        excludeKeywords,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
        sort = "sent_at",
        order = "DESC",
      } = params;

      // 폴더 ID 조회
      const folderId = await folderRepository.getFolderIdByName(
        accountId,
        folderName
      );
      if (!folderId) {
        throw new Error(`폴더를 찾을 수 없습니다: ${folderName}`);
      }

      // 기본 쿼리 구성
      let query = `
      SELECT m.*, 
        f.name as folder_name, 
        (SELECT COUNT(*) FROM Attachment WHERE message_id = m.message_id) as attachment_count,
        c.summary as summary
      FROM Message m
      LEFT JOIN Calendar c ON m.message_id = c.message_id
      JOIN Folder f ON m.folder_id = f.folder_id
    `;

      // 수신자 필터링이 있는 경우 MessageContact 테이블 조인
      if (to && to.length > 0) {
        query += `
        LEFT JOIN MessageContact mc ON m.message_id = mc.message_id
        LEFT JOIN EmailContact ec ON mc.contact_id = ec.contact_id
      `;
      }

      // WHERE 절 시작
      query += ` WHERE m.account_id = ? AND m.folder_id = ?`;
      const queryParams = [accountId, folderId];

      // 발신자 필터
      if (from && from.length > 0) {
        query += ` AND m.from_email IN (${from.map(() => "?").join(",")})`;
        queryParams.push(...from);
      }

      // 수신자 필터
      if (to && to.length > 0) {
        query += ` AND mc.type IN ('TO', 'CC', 'BCC') AND ec.email IN (${to.map(() => "?").join(",")})`;
        queryParams.push(...to);
      }

      // 제목 필터
      if (subject && subject.length > 0) {
        const subjectConditions = subject
          .map(() => "m.subject LIKE ?")
          .join(" OR ");
        query += ` AND (${subjectConditions})`;
        queryParams.push(...subject.map((subj) => `%${subj}%`));
      }

      // 기간 필터
      if (startDate) {
        query += ` AND m.sent_at >= ?`;
        queryParams.push(startDate);
      }

      if (endDate) {
        query += ` AND m.sent_at <= ?`;
        queryParams.push(endDate);
      }

      // 포함 키워드 필터
      if (includeKeywords && includeKeywords.length > 0) {
        const keywordConditions = includeKeywords
          .map(() => "(m.subject LIKE ? OR m.body_text LIKE ?)")
          .join(" OR ");

        query += ` AND (${keywordConditions})`;

        includeKeywords.forEach((keyword) => {
          queryParams.push(`%${keyword}%`, `%${keyword}%`);
        });
      }

      // 제외 키워드 필터
      if (excludeKeywords && excludeKeywords.length > 0) {
        const excludeConditions = excludeKeywords
          .map(() => "(m.subject NOT LIKE ? AND m.body_text NOT LIKE ?)")
          .join(" AND ");

        query += ` AND (${excludeConditions})`;

        excludeKeywords.forEach((keyword) => {
          queryParams.push(`%${keyword}%`, `%${keyword}%`);
        });
      }

      // 정렬 및 페이징
      query += ` ORDER BY m.${sort} ${order}`;
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);

      return new Promise((resolve, reject) => {
        db.all(query, queryParams, (err, rows) => {
          if (err) {
            reject(new Error(`메시지 필터링 조회 오류: ${err.message}`));
            return;
          }

          // camelCase로 변환하여 반환
          const messages = rows.map((row) => this.formatMessageData(row));
          resolve(messages);
        });
      });
    } catch (error) {
      console.error("메시지 필터링 조회 오류:", error);
      throw new Error(`메시지 필터링 조회 실패: ${error.message}`);
    }
  }

  /**
   * 메시지 데이터를 일관된 형식으로 변환
   * @param {Object} row - 데이터베이스 결과 행
   * @returns {Object} 변환된 메시지 데이터
   */
  formatMessageData(row) {
    return {
      messageId: row.message_id,
      externalMessageId: row.external_message_id,
      threadId: row.thread_id,
      accountId: row.account_id,
      folderId: row.folder_id,
      folderName: row.folder_name,
      fromEmail: row.from_email,
      fromName: row.from_name,
      subject: row.subject,
      snippet: row.snippet,
      sentAt: row.sent_at,
      receivedAt: row.received_at,
      isRead: Boolean(row.is_read),
      isFlagged: Boolean(row.is_flagged),
      hasAttachments: Boolean(row.has_attachments),
      attachmentCount: row.attachment_count || 0,
      summary: row.summary || null,
    };
  }

  /**
   * 메시지 ID로 메시지 조회
   * @param {Number} messageId - 메시지 ID
   * @returns {Promise<Object>} 메시지 정보
   */
  async getMessageById(messageId) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        db.get(
          `SELECT m.*, f.name as folder_name, c.summary as calendar_summary
         FROM Message m
         JOIN Folder f ON m.folder_id = f.folder_id
         LEFT JOIN Calendar c ON m.message_id = c.message_id
         WHERE m.message_id = ?`,
          [messageId],
          (err, row) => {
            if (err) {
              reject(new Error(`메시지 조회 오류: ${err.message}`));
              return;
            }

            if (!row) {
              resolve(null);
              return;
            }

            // 기본 데이터 가져오기
            const messageData = this.formatMessageData(row);

            // HTML 본문 추가 (bodyText는 제외)
            resolve({
              ...messageData,
              bodyHtml: row.body_html,
            });
          }
        );
      });
    } catch (error) {
      console.error("메시지 조회 오류:", error);
      throw new Error(`메시지 조회 실패: ${error.message}`);
    }
  }

  /**
   * 메시지 첨부파일 조회
   * @param {Number} messageId - 메시지 ID
   * @returns {Promise<Array>} 첨부파일 목록
   */
  async getMessageAttachments(messageId) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        db.all(
          `SELECT 
           attachment_id as attachmentId, 
           message_id as messageId,
           filename,
           mime_type as mimeType,
           path,
           size,
           created_at as createdAt
         FROM Attachment 
         WHERE message_id = ?`,
          [messageId],
          (err, rows) => {
            if (err) {
              reject(new Error(`첨부파일 조회 오류: ${err.message}`));
              return;
            }
            resolve(rows);
          }
        );
      });
    } catch (error) {
      console.error("첨부파일 조회 오류:", error);
      throw new Error(`첨부파일 조회 실패: ${error.message}`);
    }
  }

  /**
   * 메시지 삭제
   * @param {Number} messageId - 메시지 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteMessage(messageId) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        db.run(
          `DELETE FROM Message WHERE message_id = ?`,
          [messageId],
          function (err) {
            if (err) {
              reject(new Error(`메시지 삭제 오류: ${err.message}`));
              return;
            }

            if (this.changes === 0) {
              reject(
                new Error(
                  `메시지 ID(${messageId})에 해당하는 메시지를 찾을 수 없습니다.`
                )
              );
              return;
            }

            resolve({
              success: true,
              messageId: parseInt(messageId),
            });
          }
        );
      });
    } catch (error) {
      console.error("메시지 삭제 오류:", error);
      throw new Error(`메시지 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 메시지 읽음 상태 업데이트
   * @param {Number} messageId - 메시지 ID
   * @param {Boolean} isRead - 읽음 상태
   * @returns {Promise<Object>} 업데이트 결과
   */
  async updateReadStatus(messageId, isRead) {
    try {
      const db = getConnection();
      const readValue = isRead ? 1 : 0;

      return new Promise((resolve, reject) => {
        db.run(
          `UPDATE Message SET is_read = ? WHERE message_id = ?`,
          [readValue, messageId],
          function (err) {
            if (err) {
              reject(
                new Error(`메시지 읽음 상태 업데이트 오류: ${err.message}`)
              );
              return;
            }

            if (this.changes === 0) {
              reject(
                new Error(
                  `메시지 ID(${messageId})에 해당하는 메시지를 찾을 수 없습니다.`
                )
              );
              return;
            }

            resolve({
              success: true,
              messageId: parseInt(messageId),
              isRead: Boolean(isRead),
            });
          }
        );
      });
    } catch (error) {
      console.error("메시지 읽음 상태 업데이트 오류:", error);
      throw new Error(`메시지 읽음 상태 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 키워드로 첨부파일 검색
   * @param {Number} accountId - 계정 ID
   * @param {String} keyword - 검색 키워드
   * @param {Object} options - 검색 옵션 (limit, offset 등)
   * @returns {Promise<Array>} 첨부파일 목록
   */
  async searchAttachmentsByContent(accountId, keyword, options = {}) {
    try {
      const db = getConnection();
      const { limit = 50, offset = 0 } = options;

      // 검색 패턴 생성
      const searchPattern = `%${keyword}%`;

      return new Promise((resolve, reject) => {
        db.all(
          `SELECT 
          a.attachment_id as id,
          a.message_id as messageId,
          a.filename,
          a.mime_type as mimeType,
          a.path,
          a.size,
          a.created_at as createdAt,
          m.subject as messageSubject,
          m.from_email as fromEmail,
          m.from_name as fromName,
          f.name as folderName,
          ec.name as contactName,
          ec.email as contactEmail
        FROM Attachment a
        JOIN Message m ON a.message_id = m.message_id
        JOIN Folder f ON m.folder_id = f.folder_id
        LEFT JOIN MessageContact mc ON m.message_id = mc.message_id AND mc.type = 'FROM'
        LEFT JOIN EmailContact ec ON mc.contact_id = ec.contact_id
        WHERE m.account_id = ? AND (
          m.subject LIKE ? OR
          m.body_text LIKE ? OR
          m.body_html LIKE ?
        )
        GROUP BY a.attachment_id
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?`,
          [
            accountId,
            searchPattern,
            searchPattern,
            searchPattern,
            limit,
            offset,
          ],
          (err, rows) => {
            if (err) {
              reject(new Error(`첨부파일 검색 오류: ${err.message}`));
              return;
            }

            resolve(rows);
          }
        );
      });
    } catch (error) {
      console.error("첨부파일 검색 오류:", error);
      throw new Error(`첨부파일 검색 실패: ${error.message}`);
    }
  }
}

export default new MessageRepository();
