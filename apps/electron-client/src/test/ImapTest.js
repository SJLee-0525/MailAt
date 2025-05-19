// src/test/imapTest.js
import userService from "../main/services/userService.js";
import accountService from "../main/services/accountService.js";
import * as imapService from "../main/services/imapService.js";
import messageRepository from "../main/repositories/messageRepository.js";
import { getConnection, closeConnection } from "../main/config/dbConfig.js";
import { fileURLToPath } from "url";

// ESM에서 현재 파일이 직접 실행되는지 확인하는 방법
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

/**
 * IMAP Function Test - 이메일 가져오기 및 DB 저장 테스트
 */
export const runImapTests = async () => {
  console.log("===== IMAP Function Test Start =====");
  let userId = null;
  let accountId = null;

  try {
    // 0. Create a test user first
    console.log("0. Creating Test User (Prerequisite)");
    const userData = { username: "ImapTestUser" };
    const createdUser = await userService.createUser(userData);
    console.log("Created User:", createdUser);
    userId = createdUser.userId;

    // 1. Create Account for IMAP Test
    console.log("\n1. Create Account for IMAP Test");
    const accountData = {
      // 실제 테스트 가능한 계정 정보로 변경해주세요
      email: "",
      password: "", // 앱 비밀번호 사용
      imapHost: "imap.gmail.com",
      imapPort: 993,
      smtpHost: "smtp.gmail.com",
      smtpPort: 465,
      authMethod: "LOGIN",
    };

    try {
      // 계정 생성
      const result = await accountService.createAccount(accountData);
      console.log("Created Account Result:", result);

      // 생성된 계정 목록 조회
      const accounts = await accountService.getAllAccounts();
      console.log("All accounts:", accounts);

      // 방금 생성한 계정의 ID 가져오기
      accountId = accounts[accounts.length - 1].accountId;
      console.log("Using Account ID:", accountId);

      // 2. Test IMAP Authentication
      console.log("\n2. Test IMAP Authentication");
      const authConfig = {
        host: accountData.imapHost,
        port: accountData.imapPort,
        username: accountData.email,
        password: accountData.password,
      };

      const authResult = await imapService.testImapAuthentication(authConfig);
      console.log("IMAP Authentication Result:", authResult);

      if (authResult.success) {
        // 3. Sync Latest Emails Test
        console.log("\n3. Sync Latest Emails Test");
        try {
          const syncResult = await imapService.syncLatestEmails(accountId);
          console.log("Sync Latest Emails Result:", syncResult);
          console.log(`Synced ${syncResult.syncedCount} new emails`);
          console.log(`Total processed: ${syncResult.totalProcessed}`);

          if (syncResult.errors && syncResult.errors.length > 0) {
            console.log("Errors during sync:", syncResult.errors);
          }

          // 4. Check if messages were saved to database
          console.log("\n4. Verify Messages in Database");
          const db = getConnection();

          // 폴더 정보 조회
          const folderQuery = `SELECT * FROM Folder WHERE account_id = ? AND name = 'INBOX'`;
          const folder = await new Promise((resolve, reject) => {
            db.get(folderQuery, [accountId], (err, row) => {
              if (err) reject(err);
              else resolve(row);
            });
          });
          console.log("INBOX Folder:", folder);

          // 저장된 메시지 개수 확인
          const messageCountQuery = `
            SELECT COUNT(*) as count 
            FROM Message 
            WHERE account_id = ? AND folder_id = ?
          `;
          const messageCount = await new Promise((resolve, reject) => {
            db.get(
              messageCountQuery,
              [accountId, folder.folder_id],
              (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
              }
            );
          });
          console.log(`Total messages in database: ${messageCount}`);

          // 최신 메시지 3개 조회
          const recentMessagesQuery = `
            SELECT message_id, subject, from_email, sent_at, has_attachments
            FROM Message 
            WHERE account_id = ? AND folder_id = ?
            ORDER BY received_at DESC
            LIMIT 3
          `;
          const recentMessages = await new Promise((resolve, reject) => {
            db.all(
              recentMessagesQuery,
              [accountId, folder.folder_id],
              (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
              }
            );
          });

          console.log("\nRecent messages:");
          recentMessages.forEach((msg, index) => {
            console.log(`${index + 1}. Subject: ${msg.subject}`);
            console.log(`   From: ${msg.from_email}`);
            console.log(`   Sent: ${new Date(msg.sent_at).toLocaleString()}`);
            console.log(
              `   Has attachments: ${msg.has_attachments ? "Yes" : "No"}`
            );
            console.log("---");
          });

          // // 5. Test Sync Specific Folder
          // console.log("\n5. Test Sync Specific Folder");
          // try {
          //   const folderSyncResult = await imapService.syncFolder(
          //     accountId,
          //     "INBOX",
          //     5 // 최대 5개만 가져오기
          //   );
          //   console.log("Folder Sync Result:", folderSyncResult);
          // } catch (folderSyncError) {
          //   console.error("Folder sync error:", folderSyncError.message);
          // }

          // 6. Check recipients data
          console.log("6. Check Message Contacts Data");
          try {
            const messageId = 1; // 적절한 메시지 ID
            const contacts = await new Promise((resolve, reject) => {
              db.all(
                `SELECT mc.*, ec.email, ec.name 
                FROM MessageContact mc
                JOIN EmailContact ec ON mc.contact_id = ec.contact_id
                WHERE mc.message_id = ?`,
                [messageId],
                (err, rows) => {
                  if (err) reject(err);
                  else resolve(rows);
                }
              );
            });
            console.log(`Contacts for message ${messageId}:`, contacts);
          } catch (error) {
            console.error("Message contacts check error:", error.message);
          }

          // 7. Check headers data
          console.log("\n7. Check Headers Data");
          if (recentMessages.length > 0) {
            const firstMessageId = recentMessages[0].message_id;
            const headersQuery = `
              SELECT name, value FROM Header 
              WHERE message_id = ? 
              LIMIT 5
            `;
            const headers = await new Promise((resolve, reject) => {
              db.all(headersQuery, [firstMessageId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
              });
            });
            console.log(`Headers for message ${firstMessageId}:`, headers);
          }

          // 8. Check attachments data
          console.log("\n8. Check Attachments Data");
          const attachmentsQuery = `
            SELECT m.subject, a.filename, a.mime_type, a.size
            FROM Message m
            JOIN Attachment a ON m.message_id = a.message_id
            WHERE m.account_id = ?
            LIMIT 5
          `;
          const attachments = await new Promise((resolve, reject) => {
            db.all(attachmentsQuery, [accountId], (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            });
          });

          if (attachments.length > 0) {
            console.log("Messages with attachments:");
            attachments.forEach((att) => {
              console.log(`Subject: ${att.subject}`);
              console.log(
                `File: ${att.filename} (${att.mime_type}, ${att.size} bytes)`
              );
              console.log("---");
            });
          } else {
            console.log("No attachments found in synced messages");
          }
        } catch (syncError) {
          console.error("Email sync error:", syncError.message);
          console.error("Error Stack:", syncError.stack);
        }
      } else {
        console.log("IMAP authentication failed, skipping sync tests");
      }
    } catch (accountError) {
      console.error("Account creation failed:", accountError.message);
      console.error("Error Stack:", accountError.stack);
    }

    console.log("\n===== IMAP Function Test Finished =====");
  } catch (error) {
    console.error("Error during test:", error);
    console.error("Error Stack:", error.stack);
  } finally {
    // // Clean up - Delete test account and user
    // try {
    //   if (accountId) {
    //     console.log("\nCleaning up - Deleting test account");
    //     await accountService.deleteAccount(accountId);
    //     console.log("Test account deleted successfully");
    //   }

    //   if (userId) {
    //     console.log("\nCleaning up - Deleting test user");
    //     await userService.deleteUser(userId);
    //     console.log("Test user deleted successfully");
    //   }
    // } catch (cleanupError) {
    //   console.error("Error during cleanup:", cleanupError);
    // }

    console.log("Waiting for background calendar tasks to complete...");
    await new Promise(resolve => setTimeout(resolve, 300*1000)); // 예: 15초 대기 (시간은 예상 작업 시간에 따라 조절)
    await closeConnection();
    process.exit(0);
  }
};

// 직접 실행될 때
if (isMainModule) {
  runImapTests();
}

export default { runImapTests };
