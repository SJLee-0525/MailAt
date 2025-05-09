// src/main.js
import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

// ESM에서 __dirname 사용하기 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 모듈 임포트
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

// preload 스크립트 경로 찾기 함수
function findPreloadScript() {
  const possiblePaths = [
    path.join(__dirname, "preload.cjs"),
    path.join(process.cwd(), "preload.cjs"),
    path.join(__dirname, "..", "preload.cjs"),
  ];

  for (const preloadPath of possiblePaths) {
    console.log(`preload 스크립트 경로 검색: ${preloadPath}`);
    if (fs.existsSync(preloadPath)) {
      console.log(`preload 스크립트 발견: ${preloadPath}`);
      return preloadPath;
    }
  }

  // 파일이 없으면 기본 경로 반환
  console.warn("preload 스크립트를 찾을 수 없습니다. 기본 경로 사용.");
  return path.join(__dirname, "preload.cjs");
}

// 메인 윈도우 참조 유지
let mainWindow;

// 애플리케이션 초기화
const createWindow = () => {
  // preload 스크립트 경로 찾기
  const preloadPath = findPreloadScript();
  console.log("최종 preload 경로:", preloadPath);

  // 메인 윈도우 생성
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // 디버깅을 위한 추가 옵션
      devTools: true,
    },
  });

  // 개발 모드일 때 개발자 도구 열기
  if (isDev) {
    // const filePath = path.join(__dirname, "src", "renderer.html");
    // console.log("[MAIN] DEV MODE - loadFile:", filePath);
    mainWindow.webContents.openDevTools();
    // mainWindow.loadURL("http://localhost:5173"); // Vite 개발 서버 주소
    mainWindow.loadURL("http://localhost:5173/renderer.html");

    // 파일 존재 여부 확인
    if (fs.existsSync(filePath)) {
      mainWindow.loadFile(filePath);
    } else {
      console.error(`[MAIN] 파일을 찾을 수 없음: ${filePath}`);
      // 대체 HTML 생성
      const tempHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>임시 페이지</title></head>
        <body>
          <h1>렌더러 HTML을 찾지 못했습니다.</h1>
          <p>electronAPI 상태: <span id="status">확인 중...</span></p>
          <script>
            document.addEventListener('DOMContentLoaded', () => {
              const status = document.getElementById('status');
              if (window.electronAPI) {
                status.textContent = '사용 가능';
                status.style.color = 'green';
                console.log('electronAPI 사용 가능:', window.electronAPI);
              } else {
                status.textContent = '사용 불가';
                status.style.color = 'red';
                console.error('electronAPI undefined');
              }
            });
          </script>
        </body>
        </html>
      `;

      // 임시 HTML 파일 생성 및 로드
      const tempPath = path.join(__dirname, "temp.html");
      fs.writeFileSync(tempPath, tempHtml);
      mainWindow.loadFile(tempPath);
    }

    // 개발자 도구 열기
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../build/index.html"));
  }

  // 컨트롤러 초기화
  try {
    initSmtpController();
    initUserController();
    initAccountController();
  } catch (error) {
    console.error("컨트롤러 초기화 오류:", error);
  }

  // 디버깅을 위한 이벤트 리스너
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("[MAIN] 페이지 로드 완료");
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error(
        `[MAIN] 페이지 로드 실패: ${errorDescription} (${errorCode})`
      );
    }
  );

  // 윈도우가 닫힐 때 이벤트
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// 앱이 준비되면 윈도우 생성
app.whenReady().then(async () => {
  // 버전 정보 출력
  console.log(`[MAIN] Electron 버전: ${process.versions.electron}`);
  console.log(`[MAIN] Node.js 버전: ${process.versions.node}`);
  console.log(`[MAIN] Chrome 버전: ${process.versions.chrome}`);

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
  // console.log("[MAIN] ipcMain 핸들러 목록:", ipcMain.eventNames());

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
