// src/test/smtpTest.js
import smtpService from "../main/services/smtpService.js";
import accountService from "../main/services/accountService.js";
import userService from "../main/services/userService.js";
import accountRepository from "../main/repositories/accountRepository.js";
import { closeConnection } from "../main/config/dbConfig.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// ESM에서 현재 파일이 직접 실행되는지 확인하는 방법
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

/**
 * SMTP Function Test
 */
export const runSmtpTests = async () => {
  console.log("===== SMTP Function Test Start =====");
  let userId = null;
  let accountId = null;

  try {
    // 0. Create a test user first
    console.log("0. Creating Test User (Prerequisite)");
    const userData = { username: "TestUser" };
    const createdUser = await userService.createUser(userData);
    console.log("Created User:", createdUser);
    userId = createdUser.userId;

    // 1. Create Account for SMTP Test
    console.log("\n1. Create Account for SMTP Test");
    const accountData = {
      // 테스트 계정 정보 - 실제 사용 가능한 정보로 변경해야 합니다
      email: "",
      password: "", // 앱 비밀번호나 실제 비밀번호 사용
      imapHost: "imap.gmail.com",
      imapPort: 993,
      smtpHost: "smtp.gmail.com",
      smtpPort: 465,
      authMethod: "LOGIN", // Gmail은 보통 LOGIN 사용
    };

    try {
      // 계정 생성
      const result = await accountService.createAccount(accountData);
      console.log("Created Account Result:", result);

      // 생성된 계정 목록 조회
      const accounts = await accountService.getAllAccounts();
      console.log("All accounts:", accounts);

      // 방금 생성한 계정의 ID 가져오기
      accountId = accounts[accounts.length - 1].accountId; // 가장 최근에 생성된 계정
      console.log("Using Account ID:", accountId);

      // 2. Test SMTP Connection
      console.log("\n2. Test SMTP Connection");
      const connectionConfig = {
        host: accountData.smtpHost,
        port: accountData.smtpPort,
      };

      const connectionResult =
        await smtpService.testConnection(connectionConfig);
      console.log("Connection Test Result:", connectionResult);

      // 3. Test SMTP Authentication
      console.log("\n3. Test SMTP Authentication");
      const authConfig = {
        host: accountData.smtpHost,
        port: accountData.smtpPort,
        username: accountData.email,
        password: accountData.password,
        authMethod: accountData.authMethod,
      };

      try {
        const authResult = await smtpService.testConnection(authConfig);
        console.log("Authentication Test Result:", authResult);

        // 4. Send Test Email
        if (authResult.authenticated) {
          console.log("\n4. Send Test Email");

          // 계정 정보 다시 확인
          const accountDetails =
            await accountRepository.getAccountById(accountId);
          console.log("Account details for sending:", accountDetails);

          // 테스트 이메일 데이터 (첨부 파일 포함)
          const emailData = {
            accountId: accountId,
            to: ["emily1290@naver.com"],
            cc: [],
            bcc: [],
            title: "smtp 테스트 이메일",
            body: `
                    <html>
                        <head>
                        <meta charset="UTF-8">
                        </head>
                        <body>
                        <h2>SMTP 기능 테스트</h2>
                        <p>이 이메일은 SMTP 기능을 테스트하기 위해 생성되었습니다.</p>
                        <p>첨부된 파일을 확인해 주세요.</p>
                        </body>
                    </html>
                    `,
            attachments: [
              {
                name: "test.txt",
                path: "/path/to/test.txt",
                type: "text/plain",
              },
            ],
          };

          try {
            const sendResult = await smtpService.sendEmail(emailData);
            console.log("Email Send Result:", sendResult);
            console.log("Message ID:", sendResult.messageId);
          } catch (sendError) {
            console.error("Email Send Error:", sendError.message);
            console.error("Error Stack:", sendError.stack);
          }
        } else {
          console.log("Authentication failed, skipping email send test");
        }
      } catch (authError) {
        console.error("Authentication Test Error:", authError.message);
        console.error("Error Stack:", authError.stack);
      }

      // 5. Test Error Handling - Invalid Credentials
      console.log("\n5. Test Error Handling - Invalid Credentials");
      const invalidConfig = {
        host: accountData.smtpHost,
        port: accountData.smtpPort,
        username: accountData.email,
        password: "wrong_password",
        authMethod: accountData.authMethod,
      };

      try {
        await smtpService.testConnection(invalidConfig);
        console.log("Error: No error thrown for invalid credentials");
      } catch (error) {
        console.log("Expected Error Occurred:", error.message);
      }

      // 6. Test Error Handling - Invalid Server
      console.log("\n6. Test Error Handling - Invalid Server");
      const invalidServerConfig = {
        host: "invalid.smtp.server",
        port: 465,
      };

      try {
        await smtpService.testConnection(invalidServerConfig);
        console.log("Error: No error thrown for invalid server");
      } catch (error) {
        console.log("Expected Error Occurred:", error.message);
      }
    } catch (accountError) {
      console.error("Account creation failed:", accountError.message);
      console.error("Error Stack:", accountError.stack);
    }

    console.log("\n===== SMTP Function Test Finished =====");
  } catch (error) {
    console.error("Error during test:", error);
    console.error("Error Stack:", error.stack);
  } finally {
    // Clean up - Delete test account and user
    try {
      if (accountId) {
        console.log("\nCleaning up - Deleting test account");
        await accountService.deleteAccount(accountId);
        console.log("Test account deleted successfully");
      }

      if (userId) {
        console.log("\nCleaning up - Deleting test user");
        await userService.deleteUser(userId);
        console.log("Test user deleted successfully");
      }
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }

    await closeConnection();
    process.exit(0);
  }
};

// 직접 실행될 때
if (isMainModule) {
  runSmtpTests();
}
