import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url"; // url 모듈 추가
import { createRequire } from "module"; // createRequire 추가

import accountController from "./src/controllers/accountController.js"; // .js 확장자 추가
import mailController from "./src/controllers/mailController.js"; // .js 확장자 추가
import ImapService from "./src/services/imap.js"; // imap 서비스 import 추가 및 .js 확장자 추가

// C++ 애드온 로딩 (createRequire 사용 권장)
const require = createRequire(import.meta.url);
const addon = require("./build/Release/addon.node"); // .node 확장자 명시 권장

// __dirname 대신 사용할 현재 디렉토리 경로
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 이미 등록된 핸들러를 추적하기 위한 Set
const registeredHandlers = new Set();

// 핸들러 등록 헬퍼 함수
function registerHandler(channel, handler) {
  if (!registeredHandlers.has(channel)) {
    ipcMain.handle(channel, handler);
    registeredHandlers.add(channel);
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // if (process.env.NODE_ENV === "development") {
  //   // Vite dev 서버가 켜져 있는 주소로 바꿔주세요
  //   mainWindow.loadURL("http://localhost:5173");
  // } else {
  //   // 프로덕션 빌드 시 dist/index.html 경로를 정확히 지정
  //   mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
  // }

  if (process.env.NODE_ENV === "development") {
    console.log("Dev 모드");
    mainWindow.loadURL("http://localhost:5173");
  } else {
    console.log("Production 모드");
    mainWindow.loadFile(
      path.join(__dirname, "dist", "renderer", "renderer.html")
    );
  }
  // mainWindow.loadFile("renderer/index.html"); // 경로 확인 필요: 'src/dist/index.html' 또는 Vite 설정에 따라 다름
  // Vite 개발 서버를 사용하거나 빌드된 결과물의 경로를 정확히 지정해야 합니다.
  // 예: mainWindow.loadFile(path.join(__dirname, 'src', 'dist', 'index.html'));
  // 또는 개발 시: mainWindow.loadURL('http://localhost:5173'); (Vite 기본 포트)
  // ---> 이 부분은 현재 렌더러 빌드/실행 방식에 맞게 수정해야 합니다. <---

  mainWindow.webContents.openDevTools(); // 개발 중에는 DevTools 열기
}

app.whenReady().then(() => {
  // 계정 관련 IPC 핸들러
  registerHandler("account:add", async (event, accountData) => {
    try {
      return await accountController.addAccount(accountData);
    } catch (error) {
      console.error("계정 추가 에러:", error);
      throw error;
    }
  });

  registerHandler("account:getAll", async () => {
    try {
      return await accountController.getAllAccounts();
    } catch (error) {
      console.error("계정 조회 에러:", error);
      throw error;
    }
  });

  registerHandler("account:getFolders", async (event, accountId) => {
    try {
      return await accountController.getAccountFolders(accountId);
    } catch (error) {
      console.error("폴더 조회 에러:", error);
      throw error;
    }
  });

  // 이메일 관련 IPC 핸들러
  registerHandler("emails:fetchHeaders", async (event, params) => {
    try {
      const { accountId, folderPath, page, pageSize } = params;
      // 이 메소드는 mailController에 구현되어 있어야 함
      return await mailController.fetchEmailHeaders(
        accountId,
        folderPath,
        page,
        pageSize
      );
    } catch (error) {
      console.error("이메일 헤더 가져오기 에러:", error);
      throw error;
    }
  });

  registerHandler("emails:fetchBody", async (event, params) => {
    try {
      const { accountId, uid, folderPath } = params;
      // 이 메소드는 mailController에 구현되어 있어야 함
      return await mailController.fetchEmailBody(accountId, uid, folderPath);
    } catch (error) {
      console.error("이메일 본문 가져오기 에러:", error);
      throw error;
    }
  });

  registerHandler("emails:markAsRead", async (event, params) => {
    try {
      const { id } = params;
      return await mailController.markAsRead(id);
    } catch (error) {
      console.error("이메일 읽음 표시 에러:", error);
      throw error;
    }
  });

  registerHandler("emails:send", async (event, emailData) => {
    try {
      return await mailController.sendEmail(emailData);
    } catch (error) {
      console.error("이메일 전송 에러:", error);
      throw error;
    }
  });

  // 연결 테스트
  registerHandler("test-connection", async (event, accountData) => {
    try {
      // ImapService를 직접 사용 (위에서 import)
      const imapService = new ImapService(accountData);
      await imapService.connect();
      return { success: true, message: "연결 성공" };
    } catch (error) {
      console.error("연결 테스트 에러:", error);
      throw error;
    }
  });

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
