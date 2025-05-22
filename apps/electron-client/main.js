// main.js
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import * as graphServiceForDev from "./src/main/services/neo4jAdapter.js"; //test용

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("[MAIN] 메인 프로세스 시작됨");

// 전역 변수
let mainWindow;
let dbConnection, closeDbConnection;
let controllersInitialized = false;

// 개발 모드 및 테스트 모드 체크
const isDev = process.env.NODE_ENV === "development";
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

  console.warn("preload 스크립트를 찾을 수 없습니다. 기본 경로 사용.");
  return path.join(__dirname, "preload.cjs");
}

/**
 * 컨트롤러 초기화 함수 - 비동기로 모듈을 로드하고 초기화
 */
async function initializeControllers() {
  if (controllersInitialized) {
    console.log("[MAIN] 컨트롤러가 이미 초기화되어 있습니다.");
    return;
  }

  console.log("[MAIN] 컨트롤러 초기화 시작...");

  try {
    // 모든 기존 핸들러 제거
    [
      // 사용자 관련
      "user:create", 
      "user:get", 
      "user:update", 
      "user:delete",
      // 계정 관련
      "account:create", 
      "account:getAll", 
      "account:delete",
      // 이메일 관련
      "email:send", 
      "smtp:test", 
      "imap:syncLatest", 
      "imap:syncFolder", 
      "imap:test",
      "email:getFolders", 
      "email:getEmails", 
      "email:getThreads", 
      "email:getThreadsByEmail",
      "email:getDetail", 
      "email:delete", 
      "email:markAsRead",
      // 첨부파일 관련
      "attachment:getInfo", 
      "attachment:getContent", 
      "attachment:getByMessage", 
      "attachment:download",
      // 구 그래프 API
      "graph:readData", "graph:createNode", "graph:updateNode", "graph:deleteNode", 
      "graph:readNode", "graph:readMessage", "graph:deleteMessage", "graph:updateLabel",
      "graph:searchByKeyword", "graph:mergeNode", "graph:llmTagNode", 
      "graph:initializeGraphFromSQLite", "graph:getIncomingNodes", "graph:getOutgoingNodes",
      "graph:deleteAllNodes", "graph:moveComplexNode", "graph:moveEmail", 
      "graph:getNodeEmails", "graph:createRelationship", "graph:deleteRelationship",
      // Python 기반 새 그래프 채널
      "graph:processAndEmbedMessagesPy", 
      "graph:initializeGraphFromSQLitePy", 
      "graph:readNodePy",
      "graph:readMessagePy", 
      "graph:createNodePy", 
      "graph:deleteNodePy", 
      "graph:renameNodePy",
      "graph:mergeNodePy", 
      "graph:deleteMailPy", 
      "graph:moveMailPy",
      "graph:searchByKeywordPy"
    ].forEach((channel) => {
      try {
        ipcMain.removeHandler(channel);
      } catch (err) {
        // 등록되지 않은 핸들러는 무시
      }
    });

    // 컨트롤러 모듈 가져오기
    const userControllerModule = await import(
      "./src/main/controllers/userController.js"
    );
    const accountControllerModule = await import(
      "./src/main/controllers/accountController.js"
    );
    const smtpControllerModule = await import(
      "./src/main/controllers/smtpController.js"
    );
    const imapControllerModule = await import(
      "./src/main/controllers/imapController.js"
    );
    const emailControllerModule = await import(
      "./src/main/controllers/emailController.js"
    );
    const graphControllerModule = await import(
      "./src/main/controllers/graphController.js"
    );
    const calendarControllerModule = await import(
      "./src/main/controllers/calendarController.js"
    );
    const attachmentControllerModule = await import(
      "./src/main/controllers/attachmentController.js"
    );

    // 컨트롤러 초기화 함수 실행
    userControllerModule.initUserController();
    console.log("[MAIN] User 컨트롤러 초기화 완료");

    accountControllerModule.initAccountController();
    console.log("[MAIN] Account 컨트롤러 초기화 완료");

    smtpControllerModule.initSmtpController();
    console.log("[MAIN] SMTP 컨트롤러 초기화 완료");

    imapControllerModule.initImapController();
    console.log("[MAIN] IMAP 컨트롤러 초기화 완료");

    emailControllerModule.initEmailController();
    console.log("[MAIN] Email 컨트롤러 초기화 완료");

    graphControllerModule.initGraphController();
    console.log("[MAIN] Graph 컨트롤러 초기화 완료");

    calendarControllerModule.initCalendarController();
    console.log("[MAIN] Calendar 컨트롤러 초기화 완료");

    attachmentControllerModule.initAttachmentController();
    console.log("[MAIN] 첨부파일 컨트롤러 초기화 완료");

    // --- dev:callBackendMethod 핸들러 등록 ---
    console.log("[MAIN] Registering dev:callBackendMethod handler...");
    const servicesForDevTool = {
      graph: graphServiceForDev,
    };

    ipcMain.handle(
      "dev:callBackendMethod",
      async (event, { serviceName, methodName, args }) => {
        console.log(
          `[MAIN_DEV_TOOL] dev:callBackendMethod received: ${serviceName}.${methodName}`,
          args
        );
        try {
          if (
            servicesForDevTool[serviceName] &&
            typeof servicesForDevTool[serviceName][methodName] === "function"
          ) {
            const service = servicesForDevTool[serviceName];
            const method = service[methodName];
            // 인자가 undefined이면 빈 배열, 아니면 배열인지 확인 후 그대로 사용하거나 배열로 감쌈
            const argsArray =
              args === undefined ? [] : Array.isArray(args) ? args : [args];
            const result = await method.apply(service, argsArray);
            console.log(
              `[MAIN_DEV_TOOL] ${serviceName}.${methodName} result:`,
              result
            );
            return { success: true, data: result };
          } else {
            console.error(
              `[MAIN_DEV_TOOL] Method ${methodName} not found in service ${serviceName} or not a function.`
            );
            return {
              success: false,
              message: `Method ${methodName} not found in service ${serviceName} or not a function.`,
            };
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(
            `[MAIN_DEV_TOOL] Error calling ${serviceName}.${methodName}:`,
            errorMessage,
            error
          );
          return {
            success: false,
            message: errorMessage,
            error: error instanceof Error ? error.toString() : String(error),
          };
        }
      }
    );
    console.log(
      "[MAIN] dev:callBackendMethod handler successfully registered."
    );
    // --- 핸들러 등록 완료 ---

    controllersInitialized = true;
    console.log(
      "[MAIN] 등록된 IPC 핸들러 (dev 포함 예상):",
      ipcMain.eventNames()
    );

    return true;
  } catch (error) {
    console.error("[MAIN] 컨트롤러 초기화 오류:", error);
    return false;
  }
}

/**
 * 데이터베이스 초기화 함수
 */
async function initializeDatabase() {
  try {
    const dbModule = await import("./src/main/config/dbConfig.js");
    dbConnection = dbModule.getConnection;
    closeDbConnection = dbModule.closeConnection;

    console.log("[MAIN] 데이터베이스 모듈 로드 성공");
    dbConnection();
    return true;
  } catch (error) {
    console.error("[MAIN] 데이터베이스 초기화 오류:", error);
    return false;
  }
}

/**
 * 메인 윈도우 생성 함수
 */
async function createWindow() {
  console.log("[MAIN] 창 생성 시작");

  // preload 스크립트 경로 찾기
  const preloadPath = findPreloadScript();
  console.log("[MAIN] 최종 preload 경로:", preloadPath);

  // 메인 윈도우 생성
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // 처음에는 창을 숨깁니다.
    frame: false, // 기본 프레임 및 메뉴 바 제거

    // 최소 크기 설정
    minWidth: 1280,
    minHeight: 720,

    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: true,
    },
  });

  // 개발 모드일 때 설정
  if (isDev) {
    console.log("[MAIN] 개발 모드 - Vite 개발 서버에 연결");
    mainWindow.webContents.openDevTools();
    mainWindow.loadURL("http://localhost:5173/renderer.html");
  } else {
    console.log("[MAIN] 프로덕션 모드 - 로컬 파일 로드");
    mainWindow.loadFile(path.join(__dirname, "../build/index.html"));
  }

  // 이벤트 리스너 등록
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("[MAIN] 페이지 로드 완료");
    mainWindow.show(); // 로드 완료 후 창을 보이게 함
    mainWindow.focus(); // 포커스를 주어 입력 문제 해결
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error(
        `[MAIN] 페이지 로드 실패: ${errorDescription} (${errorCode})`
      );
    }
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  console.log("[MAIN] 창 생성 완료");
}

// 앱이 준비되면 초기화 시작
app.whenReady().then(async () => {
  console.log(`[MAIN] Electron 버전: ${process.versions.electron}`);
  console.log(`[MAIN] Node.js 버전: ${process.versions.node}`);
  console.log(`[MAIN] Chrome 버전: ${process.versions.chrome}`);

  // 테스트 모드일 경우 테스트 실행
  if (isTest) {
    console.log("[MAIN] 테스트 모드로 실행 중...");
    try {
      const { runUserTests } = await import("./src/test/userTest.js");
      await runUserTests();
    } catch (error) {
      console.error("[MAIN] 테스트 실행 오류:", error);
    }
    app.quit();
    return;
  }

  // 데이터베이스 초기화
  await initializeDatabase();

  // 컨트롤러 초기화
  await initializeControllers();

  // 윈도우 생성
  await createWindow();

  // IPC 핸들러 등록 (사용자 정의 창 컨트롤)
  ipcMain.on("window-close", () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });

  ipcMain.on("window-minimize", () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.on("window-toggle-maximize", () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on("window-reload", () => {
    if (mainWindow) {
      mainWindow.webContents.reload();
    }
  });

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
    if (closeDbConnection) closeDbConnection();
    app.quit();
  }
});

// 앱 종료 직전 정리 작업
app.on("before-quit", () => {
  if (closeDbConnection) closeDbConnection();
});
