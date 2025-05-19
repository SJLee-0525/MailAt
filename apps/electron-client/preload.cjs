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

    // 그래프 관련 API 추가
    graph: {
      deleteNode: (nodeId) => {
        console.log("[PRELOAD] graph.deleteNode 호출됨", nodeId);
        return ipcRenderer.invoke("graph:deleteNode", nodeId);
      },
      updateLabel: (C_ID, newLabel) => {
        console.log("[PRELOAD] graph.updateLabel 호출됨", { C_ID, newLabel });
        return ipcRenderer.invoke("graph:updateLabel", { C_ID, newLabel });
      },
      mergeNode: (from_C_ID, to_C_ID) => {
        console.log("[PRELOAD] graph.mergeNode 호출됨", { from_C_ID, to_C_ID });
        return ipcRenderer.invoke("graph:mergeNode", { from_C_ID, to_C_ID });
      },
      testConnection: () => {
        console.log("[PRELOAD] graph.testConnection 호출됨");
        return ipcRenderer.invoke("graph:testConnection");
      },
      initializeGraphFromSQLite: () => {
        console.log("[PRELOAD] graph.initializeGraphFromSQLite 호출됨");
        return ipcRenderer.invoke("graph:initializeGraphFromSQLite");
      },
      getIncomingNodes: (node_name) => {
        console.log("[PRELOAD] graph.getIncomingNodes 호출됨", { node_name });
        return ipcRenderer.invoke("graph:getIncomingNodes", { node_name });
      },
      deleteAllNodes: () => {
        console.log("[PRELOAD] graph.deleteAllNodes 호출됨");
        return ipcRenderer.invoke("graph:deleteAllNodes");
      },
      moveComplexNode: (a_id, b_id, c_id) => {
        console.log("[PRELOAD] graph.moveComplexNode 호출됨", { a_id, b_id, c_id });
        return ipcRenderer.invoke("graph:moveComplexNode", { a_id, b_id, c_id });
      },
      processAndEmbedMessages: () => {
        console.log("[PRELOAD] graph.processAndEmbedMessages 호출됨");
        return ipcRenderer.invoke("graph:processAndEmbedMessages");
      },
      buildGraph: () => {
        console.log("[PRELOAD] graph.buildGraph 호출됨");
        return ipcRenderer.invoke("graph:buildGraph");
      },
      fetchNodes: (C_ID, C_type, IO_type) => {
        console.log("[PRELOAD] graph.fetchNodes 호출됨", { C_ID, C_type, IO_type });
        return ipcRenderer.invoke("graph:fetchNodes", { C_ID, C_type, IO_type });
      },
      fetchEmails: (basic_C_ID, C_type, IO_type, in_data) => {
        console.log("[PRELOAD] graph.fetchEmails 호출됨", { basic_C_ID, C_type, IO_type, in_data });
        return ipcRenderer.invoke("graph:fetchEmails", { basic_C_ID, C_type, IO_type, in_data });
      },
    },

    // 개발용 테스트 API 추가
    dev: {
      callBackendMethod: (serviceName, methodName, args) => {
        console.log(`[PRELOAD] dev.callBackendMethod 호출됨: ${serviceName}.${methodName}`, args);
        return ipcRenderer.invoke("dev:callBackendMethod", { serviceName, methodName, args });
      }
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
