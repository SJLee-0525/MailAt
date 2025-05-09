// preload.js - CommonJS 형식
const { contextBridge, ipcRenderer } = require("electron");

// 디버깅용 로그
console.log("[PRELOAD] 🟢 preload.js 시작");

// 전역 오류 처리
process.on("uncaughtException", (error) => {
  console.error("[PRELOAD] 🔴 처리되지 않은 예외:", error);
});

// API 노출
try {
  contextBridge.exposeInMainWorld("electronAPI", {
    // SMTP 관련 API
    sendEmail: (emailData) => ipcRenderer.invoke("email:send", emailData),
    testSmtpConnection: (config) => ipcRenderer.invoke("smtp:test", config),

    // 사용자 관련 API
    user: {
      create: (userData) => {
        console.log("[PRELOAD] user.create 호출됨", userData);
        return ipcRenderer.invoke("user:create", userData);
      },
      get: (userId) => ipcRenderer.invoke("user:get", userId),
      update: (userId, userData) =>
        ipcRenderer.invoke("user:update", { userId, userData }),
      delete: (userId) => ipcRenderer.invoke("user:delete", userId),
    },

    // 계정 관련 API
    account: {
      create: (accountData) =>
        ipcRenderer.invoke("account:create", accountData),
      getAll: () => ipcRenderer.invoke("account:getAll"),
      delete: (accountId) => ipcRenderer.invoke("account:delete", accountId),
    },

    // 디버깅 도구
    debug: {
      ping: () => "pong", // 연결 테스트용
      getInfo: () => ({
        versions: process.versions,
        platform: process.platform,
        arch: process.arch,
      }),
    },
  });

  // 환경 정보 출력
  console.log("[PRELOAD] Node.js 버전:", process.versions.node);
  console.log("[PRELOAD] Electron 버전:", process.versions.electron);
  console.log("[PRELOAD] Chrome 버전:", process.versions.chrome);
} catch (error) {
  console.error("[PRELOAD] 🔴 contextBridge 오류:", error);
}

console.log("[PRELOAD] ✅ electronAPI가 성공적으로 등록됨");
