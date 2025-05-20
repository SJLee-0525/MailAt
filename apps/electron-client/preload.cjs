// preload.cjs - CommonJS 형식
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

    // IMAP 관련 API
    imap: {
      syncLatest: (accountId) => {
        console.log("[PRELOAD] imap.syncLatest 호출됨", accountId);
        return ipcRenderer.invoke("imap:syncLatest", accountId);
      },
      syncFolder: ({ accountId, folderName, limit }) => {
        console.log("[PRELOAD] imap.syncFolder 호출됨", {
          accountId,
          folderName,
          limit,
        });
        return ipcRenderer.invoke("imap:syncFolder", {
          accountId,
          folderName,
          limit,
        });
      },
      test: (config) => {
        console.log("[PRELOAD] imap.test 호출됨", config);
        return ipcRenderer.invoke("imap:test", config);
      },
    },

    // 이메일 관련 API 추가
    email: {
      getFolders: (accountId) => {
        console.log("[PRELOAD] email.getFolders 호출됨", accountId);
        return ipcRenderer.invoke("email:getFolders", accountId);
      },
      getEmails: (params) => {
        console.log("[PRELOAD] email.getEmails 호출됨", params);
        return ipcRenderer.invoke("email:getEmails", params);
      },
      getThreads: (params) => {
        console.log("[PRELOAD] email.getThreads 호출됨", params);
        return ipcRenderer.invoke("email:getThreads", params);
      },
      getThreadsByEmail: (params) => {
        console.log("[PRELOAD] email.getThreadsByEmail 호출됨", params);
        return ipcRenderer.invoke("email:getThreadsByEmail", params);
      },
      getDetail: (messageId) => {
        console.log("[PRELOAD] email.getDetail 호출됨", messageId);
        return ipcRenderer.invoke("email:getDetail", messageId);
      },
      delete: (messageId) => {
        console.log("[PRELOAD] email.delete 호출됨", messageId);
        return ipcRenderer.invoke("email:delete", messageId);
      },
      markAsRead: (params) => {
        console.log("[PRELOAD] email.markAsRead 호출됨", params);
        return ipcRenderer.invoke("email:markAsRead", params);
      },
    },

    // 그래프 관련 API 추가 - Python 기반 새 API
    graph: {
      // Python 기반 새 그래프 API
      processAndEmbedMessagesPy: () => {
        console.log("[PRELOAD] graph.processAndEmbedMessagesPy 호출됨");
        return ipcRenderer.invoke("graph:processAndEmbedMessagesPy");
      },
      initializeGraphFromSQLitePy: () => {
        console.log("[PRELOAD] graph.initializeGraphFromSQLitePy 호출됨");
        return ipcRenderer.invoke("graph:initializeGraphFromSQLitePy");
      },
      readNodePy: (json_obj) => {
        console.log("[PRELOAD] graph.readNodePy 호출됨", json_obj);
        return ipcRenderer.invoke("graph:readNodePy", json_obj);
      },
      readMessagePy: (json_obj) => {
        console.log("[PRELOAD] graph.readMessagePy 호출됨", json_obj);
        return ipcRenderer.invoke("graph:readMessagePy", json_obj);
      },
      createNodePy: (json_obj) => {
        console.log("[PRELOAD] graph.createNodePy 호출됨", json_obj);
        return ipcRenderer.invoke("graph:createNodePy", json_obj);
      },
      deleteNodePy: (json_obj) => {
        console.log("[PRELOAD] graph.deleteNodePy 호출됨", json_obj);
        return ipcRenderer.invoke("graph:deleteNodePy", json_obj);
      },
      renameNodePy: (json_obj) => {
        console.log("[PRELOAD] graph.renameNodePy 호출됨", json_obj);
        return ipcRenderer.invoke("graph:renameNodePy", json_obj);
      },
      mergeNodePy: (json_obj) => {
        console.log("[PRELOAD] graph.mergeNodePy 호출됨", json_obj);
        return ipcRenderer.invoke("graph:mergeNodePy", json_obj);
      },
      deleteMailPy: (json_obj) => {
        console.log("[PRELOAD] graph.deleteMailPy 호출됨", json_obj);
        return ipcRenderer.invoke("graph:deleteMailPy", json_obj);
      },
      moveMailPy: (json_obj) => {
        console.log("[PRELOAD] graph.moveMailPy 호출됨", json_obj);
        return ipcRenderer.invoke("graph:moveMailPy", json_obj);
      },
    },

    // 개발용 테스트 API 추가
    dev: {
      callBackendMethod: (serviceName, methodName, args) => {
        console.log(
          `[PRELOAD] dev.callBackendMethod 호출됨: ${serviceName}.${methodName}`,
          args
        );
        return ipcRenderer.invoke("dev:callBackendMethod", {
          serviceName,
          methodName,
          args,
        });
      },
    },

    calendar: {
      getEvents: (params) => {
        // params: { accountId, year, month }
        console.log("[PRELOAD] calendar.getEvents 호출됨", params);
        return ipcRenderer.invoke("calendar:getEvents", params);
      },
    },

    // 첨부파일 관련 API
    attachment: {
      // 첨부파일 정보 조회
      getInfo: (attachmentId) => {
        console.log("[PRELOAD] attachment.getInfo 호출됨", attachmentId);
        return ipcRenderer.invoke("attachment:getInfo", attachmentId);
      },
      // 첨부파일 내용 조회
      getContent: (attachmentId) => {
        console.log("[PRELOAD] attachment.getContent 호출됨", attachmentId);
        return ipcRenderer.invoke("attachment:getContent", attachmentId);
      },
      // 메시지의 모든 첨부파일 목록 조회
      getByMessage: (messageId) => {
        console.log("[PRELOAD] attachment.getByMessage 호출됨", messageId);
        return ipcRenderer.invoke("attachment:getByMessage", messageId);
      },
      // 첨부파일 다운로드
      download: (attachmentId, savePath) => {
        console.log("[PRELOAD] attachment.download 호출됨", {
          attachmentId,
          savePath,
        });
        return ipcRenderer.invoke(
          "attachment:download",
          attachmentId,
          savePath
        );
      },
      searchByContent: (params) => {
        console.log("[PRELOAD] attachment.searchByContent 호출됨", params);
        return ipcRenderer.invoke("attachment:searchByContent", params);
      },
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

    // 창 제어 API 추가
    reloadWindow: () => ipcRenderer.send("window-reload"),
    minimizeWindow: () => ipcRenderer.send("window-minimize"),
    toggleMaximizeWindow: () => ipcRenderer.send("window-toggle-maximize"),
    closeWindow: () => ipcRenderer.send("window-close"),
  });
  
  // 환경 정보 출력
  console.log("[PRELOAD] Node.js 버전:", process.versions.node);
  console.log("[PRELOAD] Electron 버전:", process.versions.electron);
  console.log("[PRELOAD] Chrome 버전:", process.versions.chrome);
} catch (error) {
  console.error("[PRELOAD] 🔴 electronAPI 노출 실패:", error);
}

console.log("[PRELOAD] 🟢 electronAPI 노출 성공");
console.log("[PRELOAD] 🟢 preload.js 로드 완료");