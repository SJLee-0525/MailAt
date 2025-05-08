// src/main.js
import { app, BrowserWindow } from "electron";
import path from "path";
import { initSmtpController } from "./src/main/controllers/smtpController.js";
import { initUserController } from "./src/main/controllers/userController.js";
import { initAccountController } from "./src/main/controllers/accountController.js";
import { getConnection, closeConnection } from "./src/main/config/dbConfig.js";
import { runUserTests } from "./src/test/userTest.js";
import { runAccountTests } from "./src/test/accountTest.js";

// 개발 모드 체크
const isDev = process.env.NODE_ENV === "development";
// 테스트 모드 체크
const isTest = process.argv.includes("--test");

// 메인 윈도우 참조 유지
let mainWindow;

// 애플리케이션 초기화
const createWindow = () => {
  // 메인 윈도우 생성
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // 개발 모드일 때 개발자 도구 열기
  if (isDev) {
    mainWindow.webContents.openDevTools();
    mainWindow.loadURL("http://localhost:5173"); // Vite 개발 서버 주소
  } else {
    mainWindow.loadFile(path.join(__dirname, "../build/index.html")); // 빌드된 파일 로드
  }

  // 컨트롤러 초기화
  initSmtpController();
  initUserController();
  initAccountController();

  // 윈도우가 닫힐 때 이벤트
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// 앱이 준비되면 윈도우 생성
app.whenReady().then(async () => {
  // 데이터베이스 연결 초기화
  try {
    getConnection();
  } catch (error) {
    console.error("데이터베이스 초기화 오류:", error);
  }

  // 테스트 모드일 경우 테스트 실행
  if (isTest) {
    console.log("테스트 모드로 실행 중...");
    await runUserTests();
    app.quit();
    return;
  }

  createWindow();

  // macOS에서 앱 아이콘 클릭 시 윈도우 재생성
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 모든 윈도우가 닫히면 앱 종료 (Windows/Linux)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    closeConnection();
    app.quit();
  }
});

// 앱 종료 직전 정리 작업
app.on("before-quit", () => {
  closeConnection();
});
