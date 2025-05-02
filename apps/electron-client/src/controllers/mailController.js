// src/controllers/mailController.js - 리팩터링된 메일 컨트롤러 (ESM 버전)
import db from "../database/db.js"; // require를 import로 변경하고 .js 확장자 추가
import ImapService from "../services/imap.js"; // require를 import로 변경하고 .js 확장자 추가
import SmtpService from "../services/smtp.js"; // require를 import로 변경하고 .js 확장자 추가
import path from "path"; // require를 import로 변경
import fs from "fs"; // require를 import로 변경
import { app } from "electron"; // require를 import로 변경
import performanceLogger from "../utils/logging.js"; // require를 import로 변경하고 .js 확장자 추가 (파일이 존재한다고 가정)

class MailController {
  async fetchEmails(accountId, folderPath) {
    try {
      const account = await this.getAccountById(accountId);
      if (!account) throw new Error("계정을 찾을 수 없습니다.");

      const folderId = await this.ensureFolder(accountId, folderPath);
      const imapService = new ImapService(account);
      const emails = await imapService.getEmails(folderPath);

      await this.saveEmails(emails, accountId, folderId);
      return emails;
    } catch (error) {
      console.error("이메일 가져오기 실패:", error);
      throw error;
    }
  }

  getAccountById(accountId) {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM accounts WHERE id = ?", [accountId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async ensureFolder(accountId, folderPath) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT id FROM folders WHERE accountId = ? AND path = ?",
        [accountId, folderPath],
        (err, row) => {
          if (err) return reject(err);
          if (row) return resolve(row.id);

          const folderName = folderPath.split("/").pop();
          db.run(
            "INSERT INTO folders (accountId, name, path) VALUES (?, ?, ?)",
            [accountId, folderName, folderPath],
            function (err) {
              if (err) {
                if (err.message.includes("UNIQUE constraint failed")) {
                  db.get(
                    "SELECT id FROM folders WHERE accountId = ? AND path = ?",
                    [accountId, folderPath],
                    (err, row) => {
                      if (err || !row)
                        return reject(err || new Error("폴더 조회 실패"));
                      resolve(row.id);
                    }
                  );
                } else {
                  return reject(err);
                }
              } else {
                resolve(this.lastID);
              }
            }
          );
        }
      );
    });
  }

  async saveEmails(emails, accountId, folderId) {
    const savePromises = emails.map((email) => {
      return new Promise((resolve, reject) => {
        db.get(
          "SELECT id FROM emails WHERE accountId = ? AND uid = ? AND folderId = ?",
          [accountId, email.uid, folderId],
          (err, row) => {
            if (err) return reject(err);
            if (row) return resolve(row.id);

            db.run(
              `INSERT INTO emails 
              (accountId, folderId, messageId, sender, recipient, cc, bcc, subject, 
              body, bodyHtml, receivedDate, hasAttachments, uid) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                accountId,
                folderId,
                email.messageId,
                email.sender,
                email.recipient,
                email.cc,
                email.bcc,
                email.subject,
                email.body,
                email.bodyHtml,
                email.date ? email.date.toISOString() : null,
                email.hasAttachments ? 1 : 0,
                email.uid,
              ],
              function (err) {
                if (err) return reject(err);
                const emailId = this.lastID;

                if (email.attachments && email.attachments.length > 0) {
                  const attachmentDir = path.join(
                    app.getPath("userData"),
                    "attachments",
                    emailId.toString()
                  );
                  if (!fs.existsSync(attachmentDir)) {
                    fs.mkdirSync(attachmentDir, { recursive: true });
                  }

                  const saveAttachmentPromises = email.attachments.map(
                    (attachment) => {
                      return new Promise((resolve, reject) => {
                        if (attachment.content) {
                          const filePath = path.join(
                            attachmentDir,
                            attachment.filename
                          );
                          fs.writeFile(filePath, attachment.content, (err) => {
                            if (err) return reject(err);
                            db.run(
                              `INSERT INTO attachments 
                            (emailId, filename, contentType, size, path) 
                            VALUES (?, ?, ?, ?, ?)`,
                              [
                                emailId,
                                attachment.filename,
                                attachment.contentType,
                                attachment.size,
                                filePath,
                              ],
                              function (err) {
                                if (err) return reject(err);
                                resolve();
                              }
                            );
                          });
                        } else {
                          db.run(
                            `INSERT INTO attachments 
                          (emailId, filename, contentType, size) 
                          VALUES (?, ?, ?, ?)`,
                            [
                              emailId,
                              attachment.filename,
                              attachment.contentType,
                              attachment.size,
                            ],
                            function (err) {
                              if (err) return reject(err);
                              resolve();
                            }
                          );
                        }
                      });
                    }
                  );

                  Promise.all(saveAttachmentPromises)
                    .then(() => resolve(emailId))
                    .catch(reject);
                } else {
                  resolve(emailId);
                }
              }
            );
          }
        );
      });
    });

    return Promise.all(savePromises);
  }

  async sendEmail(emailData) {
    try {
      const {
        accountId,
        recipient,
        cc,
        bcc,
        subject,
        text,
        html,
        attachments,
      } = emailData;
      const account = await this.getAccountById(accountId);
      if (!account) throw new Error("계정을 찾을 수 없습니다.");

      const smtpService = new SmtpService(account);
      const result = await smtpService.sendEmail({
        to: recipient,
        cc,
        bcc,
        subject,
        text,
        html,
        attachments,
      });

      if (result.success) {
        const sentFolderId = await this.ensureFolder(accountId, "Sent");
        db.run(
          `INSERT INTO emails 
          (accountId, folderId, messageId, sender, recipient, cc, bcc, subject, 
          body, bodyHtml, sentDate, hasAttachments) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            accountId,
            sentFolderId,
            result.messageId,
            account.email,
            recipient,
            cc || "",
            bcc || "",
            subject,
            text,
            html,
            new Date().toISOString(),
            attachments && attachments.length > 0 ? 1 : 0,
          ]
        );
      }

      return result;
    } catch (error) {
      console.error("이메일 전송 실패:", error);
      throw error;
    }
  }

  async getEmailById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT e.*, f.path as folderPath FROM emails e JOIN folders f ON e.folderId = f.id WHERE e.id = ?`,
        [id],
        (err, email) => {
          if (err) return reject(err);
          if (!email) return resolve(null);

          db.all(
            "SELECT * FROM attachments WHERE emailId = ?",
            [id],
            (err, attachments) => {
              if (err) return reject(err);
              email.attachments = attachments || [];
              resolve(email);
            }
          );
        }
      );
    });
  }

  async markAsRead(id) {
    return new Promise((resolve, reject) => {
      db.run("UPDATE emails SET isRead = 1 WHERE id = ?", [id], function (err) {
        if (err) return reject(err);
        resolve({ success: true, changes: this.changes });
      });
    });
  }

  // 백그라운드 캐싱 메소드 추가
  async prefetchRecentEmails(accountId, folderPath, count = 10) {
    console.log(`최근 이메일 ${count}개에 대한 백그라운드 캐싱 시작...`);

    try {
      // 최근 이메일의 UID만 가져오기
      const folderId = await this.ensureFolder(accountId, folderPath);

      // 캐시되지 않은 최근 이메일 조회
      const recentEmails = await new Promise((resolve, reject) => {
        db.all(
          `SELECT uid FROM emails 
           WHERE accountId = ? AND folderId = ? AND (body IS NULL OR body = '')
           ORDER BY COALESCE(receivedDate, sentDate) DESC LIMIT ?`,
          [accountId, folderId, count],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
          }
        );
      });

      if (recentEmails.length === 0) {
        console.log("백그라운드 캐싱: 모든 이메일이 이미 캐시되었습니다.");
        return { success: true, count: 0 };
      }

      console.log(`백그라운드 캐싱: ${recentEmails.length}개 이메일 처리 시작`);

      // 백그라운드에서 순차적으로 처리 (1번에 하나씩 처리)
      let successCount = 0;
      for (const email of recentEmails) {
        try {
          // 10초 타임아웃으로 하나씩 처리
          await Promise.race([
            this.fetchEmailBody(accountId, email.uid, folderPath),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("fetchEmailBody 타임아웃")),
                10000
              )
            ),
          ]);

          successCount++;
          console.log(
            `백그라운드 캐싱 진행: ${successCount}/${recentEmails.length}`
          );
        } catch (e) {
          console.error(`UID ${email.uid} 백그라운드 캐싱 실패:`, e);
          // 실패해도 계속 진행
        }

        // 시스템 부하 방지를 위해 약간의 지연 추가
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      console.log(
        `백그라운드 캐싱 완료: ${successCount}/${recentEmails.length} 성공`
      );
      return { success: true, count: successCount };
    } catch (error) {
      console.error("백그라운드 캐싱 실패:", error);
      return { success: false, error: error.message };
    }
  }

  // 이메일 헤더만 페이지별로 가져오기
  async fetchEmailHeaders(accountId, folderPath, page = 1, pageSize = 20) {
    try {
      const account = await this.getAccountById(accountId);
      if (!account) throw new Error("계정을 찾을 수 없습니다.");

      const folderId = await this.ensureFolder(accountId, folderPath);

      // 먼저 DB에서 캐시된 헤더 조회
      const cached = await this.getCachedEmailHeaders(
        accountId,
        folderId,
        page,
        pageSize
      );

      // 캐시가 있으면 반환
      if (cached.headers.length > 0) {
        return { ...cached, cached: true };
      }

      // 캐시가 없으면 IMAP 서버에서 가져오기
      const imapService = new ImapService(account);
      const result = await imapService.getEmailHeaders(
        folderPath,
        page,
        pageSize
      );

      // DB에 헤더 저장
      await this.saveEmailHeaders(result.headers, accountId, folderId);

      return { ...result, cached: false };
    } catch (error) {
      console.error("이메일 헤더 가져오기 실패:", error);
      throw error;
    }
  }

  // DB에서 캐시된 이메일 헤더 가져오기
  async getCachedEmailHeaders(accountId, folderId, page, pageSize) {
    return new Promise((resolve, reject) => {
      const offset = (page - 1) * pageSize;

      // 총 이메일 수 구하기
      db.get(
        "SELECT COUNT(*) as total FROM emails WHERE accountId = ? AND folderId = ?",
        [accountId, folderId],
        (err, row) => {
          if (err) return reject(err);

          const total = row ? row.total : 0;

          // 페이지에 해당하는 이메일 헤더 가져오기
          db.all(
            `SELECT id, uid, sender, recipient, cc, bcc, subject, receivedDate, sentDate, isRead, hasAttachments 
             FROM emails 
             WHERE accountId = ? AND folderId = ? 
             ORDER BY COALESCE(receivedDate, sentDate) DESC 
             LIMIT ? OFFSET ?`,
            [accountId, folderId, pageSize, offset],
            (err, rows) => {
              if (err) return reject(err);
              resolve({ headers: rows || [], total });
            }
          );
        }
      );
    });
  }

  // 이메일 헤더 저장 (캐싱)
  async saveEmailHeaders(headers, accountId, folderId) {
    const savePromises = headers.map((header) => {
      return new Promise((resolve, reject) => {
        db.get(
          "SELECT id FROM emails WHERE accountId = ? AND uid = ? AND folderId = ?",
          [accountId, header.uid, folderId],
          (err, row) => {
            if (err) return reject(err);
            if (row) return resolve(row.id);

            db.run(
              `INSERT INTO emails 
              (accountId, folderId, messageId, sender, recipient, cc, bcc, subject, 
              receivedDate, hasAttachments, uid, isRead) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                accountId,
                folderId,
                header.messageId || "",
                header.sender,
                header.recipient || "",
                header.cc || "",
                header.bcc || "",
                header.subject || "",
                header.date ? header.date.toISOString() : null,
                header.hasAttachments ? 1 : 0,
                header.uid,
                0, // 기본적으로 읽지 않음 상태
              ],
              function (err) {
                if (err) return reject(err);
                resolve(this.lastID);
              }
            );
          }
        );
      });
    });

    return Promise.all(savePromises);
  }

  // mailController.js의 fetchEmailBody 함수 개선
  async fetchEmailBody(accountId, uid, folderPath) {
    try {
      // 성능 측정 시작
      const { performanceLogger } = require("../utils/logging");
      performanceLogger.start(`fetchEmailBody-${uid}`);

      const account = await this.getAccountById(accountId);
      if (!account) throw new Error("계정을 찾을 수 없습니다.");

      const folderId = await this.ensureFolder(accountId, folderPath);

      // 캐시된 이메일 확인 (타임아웃 추가)
      const cachedEmailPromise = this.getCachedEmailByUid(
        accountId,
        uid,
        folderId
      );
      const cachedEmail = await Promise.race([
        cachedEmailPromise,
        new Promise((resolve) => setTimeout(() => resolve(null), 1000)), // 1초 타임아웃
      ]);

      // 캐시가 있고 본문이 있으면 바로 반환
      if (cachedEmail && cachedEmail.body && cachedEmail.body.length > 10) {
        console.log("캐시에서 본문 데이터 가져옴");
        performanceLogger.end(`fetchEmailBody-${uid}`);
        return { ...cachedEmail, cached: true };
      }

      // IMAP 서비스 연결 최적화
      const imapService = new ImapService(account);

      // 본문 가져오기 시도 (타임아웃 추가)
      const emailPromise = imapService.getEmailBody(uid, folderPath);
      const email = await Promise.race([
        emailPromise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("이메일 본문 가져오기 타임아웃")),
            10000
          )
        ),
      ]);

      // 이메일 캐싱 처리
      if (cachedEmail) {
        // 존재하는 캐시 업데이트
        await new Promise((resolve, reject) => {
          db.run(
            "UPDATE emails SET body = ?, bodyHtml = ? WHERE id = ?",
            [email.body || "", email.bodyHtml || "", cachedEmail.id],
            function (err) {
              if (err) return reject(err);
              resolve();
            }
          );
        });

        performanceLogger.end(`fetchEmailBody-${uid}`);
        return { ...cachedEmail, ...email, cached: false, id: cachedEmail.id };
      } else {
        // 새 이메일 저장
        const emailId = await this.saveEmailWithBody(
          email,
          accountId,
          folderId,
          uid
        );

        performanceLogger.end(`fetchEmailBody-${uid}`);
        return { ...email, id: emailId, cached: false };
      }
    } catch (error) {
      // 오류가 발생해도 성능 측정 종료
      try {
        performanceLogger.end(`fetchEmailBody-${uid}`);
      } catch (e) {
        console.error("성능 측정 종료 실패:", e);
      }

      console.error("이메일 본문 가져오기 실패:", error);

      // 캐시된 데이터가 있으면 부분적으로 반환
      try {
        const cachedEmail = await this.getCachedEmailByUid(
          accountId,
          uid,
          folderPath
        );
        if (cachedEmail) {
          console.log("오류 발생, 캐시된 데이터로 대체");
          return { ...cachedEmail, cached: true, error: error.message };
        }
      } catch (e) {
        console.error("캐시 조회 실패:", e);
      }

      throw error;
    }
  }

  // 본문 업데이트 함수 (신규 추가)
  async updateEmailBody(emailId, body, bodyHtml) {
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE emails SET body = ?, bodyHtml = ? WHERE id = ?",
        [body || "", bodyHtml || "", emailId],
        function (err) {
          if (err) return reject(err);
          resolve(this.changes);
        }
      );
    });
  }

  // 이메일 본문 저장 (캐싱)
  async saveEmailWithBody(email, accountId, folderId, uid) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO emails 
        (accountId, folderId, messageId, sender, recipient, cc, bcc, subject, 
        body, bodyHtml, receivedDate, hasAttachments, uid, isRead) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          accountId,
          folderId,
          email.messageId || "",
          email.sender,
          email.recipient || "",
          email.cc || "",
          email.bcc || "",
          email.subject || "",
          email.body || "",
          email.bodyHtml || "",
          email.date ? email.date.toISOString() : null,
          email.hasAttachments ? 1 : 0,
          uid,
          0, // 기본적으로 읽지 않음 상태
        ],
        function (err) {
          if (err) return reject(err);
          const emailId = this.lastID;

          // 첨부파일 저장
          if (email.attachments && email.attachments.length > 0) {
            const attachmentPromises = email.attachments.map((att) => {
              return new Promise((resolve, reject) => {
                db.run(
                  `INSERT INTO attachments (emailId, filename, contentType, size) 
                  VALUES (?, ?, ?, ?)`,
                  [emailId, att.filename, att.contentType, att.size],
                  function (err) {
                    if (err) return reject(err);
                    resolve();
                  }
                );
              });
            });

            Promise.all(attachmentPromises)
              .then(() => resolve(emailId))
              .catch((err) => reject(err));
          } else {
            resolve(emailId);
          }
        }
      );
    });
  }

  // UID로 이메일 조회
  async getCachedEmailByUid(accountId, uid, folderId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM emails WHERE accountId = ? AND folderId = ? AND uid = ?`,
        [accountId, folderId, uid],
        (err, email) => {
          if (err) return reject(err);
          if (!email) return resolve(null);

          // 첨부파일 가져오기
          db.all(
            "SELECT * FROM attachments WHERE emailId = ?",
            [email.id],
            (err, attachments) => {
              if (err) return reject(err);
              email.attachments = attachments || [];
              resolve(email);
            }
          );
        }
      );
    });
  }
}

export default MailController;