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
      readData: () => {
        console.log("[PRELOAD] graph.readData 호출됨");
        return ipcRenderer.invoke("graph:readData");
      },
      createNode: (nodeData) => {
        console.log("[PRELOAD] graph.createNode 호출됨", nodeData);
        return ipcRenderer.invoke("graph:createNode", nodeData);
      },
      updateNode: (nodeId, updateData) => {
        console.log("[PRELOAD] graph.updateNode 호출됨", {
          nodeId,
          updateData,
        });
        return ipcRenderer.invoke("graph:updateNode", { nodeId, updateData });
      },
      deleteNode: (nodeId) => {
        console.log("[PRELOAD] graph.deleteNode 호출됨", nodeId);
        return ipcRenderer.invoke("graph:deleteNode", nodeId);
      },
      readNode: (params) => {
        console.log("[PRELOAD] graph.readNode 호출됨", params);
        return ipcRenderer.invoke("graph:readNode", params);
      },
      readMessage: (params) => {
        console.log("[PRELOAD] graph.readMessage 호출됨", params);
        return ipcRenderer.invoke("graph:readMessage", params);
      },
      deleteMessage: (params) => {
        console.log("[PRELOAD] graph.deleteMessage 호출됨", params);
        return ipcRenderer.invoke("graph:deleteMessage", params);
      },
      updateLabel: (params) => {
        console.log("[PRELOAD] graph.updateLabel 호출됨", params);
        return ipcRenderer.invoke("graph:updateLabel", params);
      },
      searchByKeyword: (params) => {
        console.log("[PRELOAD] graph.searchByKeyword 호출됨", params);
        return ipcRenderer.invoke("graph:searchByKeyword", params);
      },
      mergeNode: (params) => {
        console.log("[PRELOAD] graph.mergeNode 호출됨", params);
        return ipcRenderer.invoke("graph:mergeNode", params);
      },
      llmTagNode: (params) => {
        console.log("[PRELOAD] graph.llmTagNode 호출됨", params);
        return ipcRenderer.invoke("graph:llmTagNode", params);
      },
      testGraph: (params) => {
        console.log("[PRELOAD] graph.testGraph 호출됨", params); // Corrected console log
        return ipcRenderer.invoke("graph:testGraph", params);
      },
      initializeGraphFromSQLite: () => { // Added
        console.log("[PRELOAD] graph.initializeGraphFromSQLite 호출됨");
        return ipcRenderer.invoke("graph:initializeGraphFromSQLite");
      },
      getIncomingNodes: (params) => { // Added
        console.log("[PRELOAD] graph.getIncomingNodes 호출됨", params);
        return ipcRenderer.invoke("graph:getIncomingNodes", params);
      },
      getOutgoingNodes: (params) => { // Added
        console.log("[PRELOAD] graph.getOutgoingNodes 호출됨", params);
        return ipcRenderer.invoke("graph:getOutgoingNodes", params);
      },
      deleteAllNodes: () => { // Added
        console.log("[PRELOAD] graph.deleteAllNodes 호출됨");
        return ipcRenderer.invoke("graph:deleteAllNodes");
      },
      moveComplexNode: (params) => { // Added
        console.log("[PRELOAD] graph.moveComplexNode 호출됨", params);
        return ipcRenderer.invoke("graph:moveComplexNode", params);
      },
      moveEmail: (params) => { // Added
        console.log("[PRELOAD] graph.moveEmail 호출됨", params);
        return ipcRenderer.invoke("graph:moveEmail", params);
      },
      getNodeEmails: (params) => { // Added
        console.log("[PRELOAD] graph.getNodeEmails 호출됨", params);
        return ipcRenderer.invoke("graph:getNodeEmails", params);
      },
      createRelationship: (params) => { // Added
        console.log("[PRELOAD] graph.createRelationship 호출됨", params);
        return ipcRenderer.invoke("graph:createRelationship", params);
      },
      deleteRelationship: (params) => { // Added
        console.log("[PRELOAD] graph.deleteRelationship 호출됨", params);
        return ipcRenderer.invoke("graph:deleteRelationship", params); // Intentional: This was a copy-paste error in the previous step, should be graph:deleteRelationship
      }
    },

    // 개발용 테스트 API 추가
    dev: {
      callBackendMethod: (serviceName, methodName, args) => {
        console.log(`[PRELOAD] dev.callBackendMethod 호출됨: ${serviceName}.${methodName}`, args);
        return ipcRenderer.invoke("dev:callBackendMethod", { serviceName, methodName, args });
      }
    },

    calendar: {
      getEvents: (params) => { // params: { accountId, year, month }
        console.log("[PRELOAD] calendar.getEvents 호출됨", params);
        return ipcRenderer.invoke("calendar:getEvents", params);
      }
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
