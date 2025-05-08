// apps/electron-client/src/test/ipcTest.js
import { app, ipcMain, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { initSmtpController } from "../main/controllers/smtpController.js";

// __dirname 설정 (ESM 모듈에서는 __dirname이 기본적으로 제공되지 않음)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 테스트 데이터
const testEmailData = {
  accountId: 1,
  to: ["recipient@example.com"],
  cc: ["cc@example.com"],
  bcc: [],
  title: "테스트 이메일",
  body: "이것은 테스트 이메일입니다.",
  attachments: [
    {
      name: "테스트.txt",
      path: path.join(__dirname, "test-file.txt"),
      type: "text/plain",
      size: 1024,
    },
  ],
  threadId: "thread-test",
  inReplyTo: "msg-test",
  references: ["ref-1", "ref-2"],
};

// 테스트 파일 생성
const createTestFile = () => {
  const testFilePath = path.join(__dirname, "test-file.txt");
  if (!fs.existsSync(testFilePath)) {
    fs.writeFileSync(testFilePath, "이것은 테스트 첨부 파일입니다.", "utf8");
    console.log(`테스트 파일 생성됨: ${testFilePath}`);
  }
};

// 일렉트론 앱 초기화
app.whenReady().then(() => {
  console.log("테스트 앱 초기화됨");

  // 테스트 파일 생성
  createTestFile();

  // SMTP 컨트롤러 초기화
  initSmtpController();

  // 테스트용 윈도우 생성
  const testWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // IPC 테스트 핸들러
  console.log("테스트 시작: SMTP 연결 테스트");
  ipcMain
    .invoke("smtp:connect", null, {
      host: "smtp.gmail.com",
      port: 465,
    })
    .then((result) => {
      console.log("SMTP 연결 테스트 결과:", result);

      // 인증 테스트
      console.log("테스트 시작: SMTP 인증 테스트");
      return ipcMain.invoke("smtp:authenticate", null, {
        host: "smtp.gmail.com",
        port: 465,
        username: "your-email@gmail.com", // 실제 이메일로 변경
        password: "your-password", // 실제 비밀번호로 변경
        authMethod: "LOGIN",
      });
    })
    .then((result) => {
      console.log("SMTP 인증 테스트 결과:", result);

      // 이메일 전송 테스트
      console.log("테스트 시작: 이메일 전송 테스트");
      return ipcMain.invoke("email:send", null, testEmailData);
    })
    .then((result) => {
      console.log("이메일 전송 테스트 결과:", result);
      console.log("모든 테스트 완료");
    })
    .catch((error) => {
      console.error("테스트 실패:", error);
    })
    .finally(() => {
      // 앱 종료
      app.quit();
    });
});

app.on("window-all-closed", () => {
  app.quit();
});
