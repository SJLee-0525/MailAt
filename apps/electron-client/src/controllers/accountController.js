// src/controllers/accountController.js - 계정 컨트롤러 (ESM 버전)
import db from "../database/db.js"; // require를 import로 변경하고 .js 확장자 추가
import ImapService from "../services/imap.js"; // require를 import로 변경하고 .js 확장자 추가

class AccountController {
  // 계정 추가 (이메일 중복 확인 추가)
  async addAccount(accountData) {
    try {
      // 이메일 중복 확인
      const existingAccount = await this.getAccountByEmail(accountData.email);
      if (existingAccount) {
        throw new Error("이미 등록된 이메일 주소입니다.");
      }

      // IMAP 연결 테스트
      const imapService = new ImapService(accountData);
      await imapService.connect();

      // this를 변수에 저장하여 Promise 내부에서도 접근 가능하게 함
      const self = this;

      return new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO accounts
          (email, password, name, imapHost, imapPort, smtpHost, smtpPort)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            accountData.email,
            accountData.password,
            accountData.name || "",
            accountData.imapHost || "k12a204.p.ssafy.io",
            accountData.imapPort || 5000,
            accountData.smtpHost || "k12a204.p.ssafy.io",
            accountData.smtpPort || 8443,
          ],
          async function (err) {
            if (err) {
              // UNIQUE 제약 조건 위반 시
              if (err.message.includes("UNIQUE constraint failed")) {
                reject(new Error("이미 등록된 이메일 주소입니다."));
                return;
              }
              reject(err);
              return;
            }

            const accountId = this.lastID;

            // 기본 폴더 생성
            const defaultFolders = ["INBOX", "Drafts", "Sent", "Trash"];
            const folderPromises = defaultFolders.map((folder) => {
              return new Promise((resolve, reject) => {
                db.run(
                  "INSERT INTO folders (accountId, name, path) VALUES (?, ?, ?)",
                  [accountId, folder, folder],
                  function (err) {
                    if (err) {
                      console.error(`폴더 추가 에러 (${folder}):`, err);
                      // 에러가 있어도 건너뜀
                      resolve();
                    } else {
                      resolve();
                    }
                  }
                );
              });
            });

            try {
              await Promise.all(folderPromises);

              // IMAP 서버에서 실제 폴더 목록 가져오기
              const folders = await imapService.getFolders();

              // 실제 폴더 추가 (중복 확인 로직 추가)
              for (const folder of folders) {
                // 이미 추가된 기본 폴더가 아닌 경우만 추가
                if (!defaultFolders.includes(folder.path)) {
                  await self.ensureFolder(accountId, folder.name, folder.path);
                }
              }

              // 확실하게 계정 ID와 이메일 반환
              resolve({ id: accountId, email: accountData.email });
            } catch (err) {
              console.error("폴더 초기화 에러:", err);
              // 폴더 초기화에 실패해도 계정은 생성됨
              resolve({ id: accountId, email: accountData.email });
            }
          }
        );
      });
    } catch (error) {
      console.error("계정 추가 실패:", error);
      throw error;
    }
  }

  // 이메일로 계정 조회 (신규 추가)
  async getAccountByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM accounts WHERE email = ?", [email], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  // 폴더 추가 또는 확인 (중복 방지)
  async ensureFolder(accountId, folderName, folderPath) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT id FROM folders WHERE accountId = ? AND path = ?",
        [accountId, folderPath],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (row) {
            // 경로가 일치하는 폴더가 있으면 해당 ID 반환
            resolve(row.id);
          } else {
            // 폴더가 없으면 새로 생성
            db.run(
              "INSERT INTO folders (accountId, name, path) VALUES (?, ?, ?)",
              [accountId, folderName, folderPath],
              function (err) {
                if (err) {
                  console.error(`폴더 추가 에러 (${folderName}):`, err);
                  resolve(null); // 오류 발생해도 계속 진행
                } else {
                  resolve(this.lastID);
                }
              }
            );
          }
        }
      );
    });
  }

  // 모든 계정 가져오기
  async getAllAccounts() {
    return new Promise((resolve, reject) => {
      db.all("SELECT id, email, name FROM accounts", (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  // 계정 폴더 가져오기
  async getAccountFolders(accountId) {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM folders WHERE accountId = ?",
        [accountId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  }
}

export default new AccountController(); // module.exports를 export default로 변경
