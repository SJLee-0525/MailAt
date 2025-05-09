// src/preload.js
const { contextBridge, ipcRenderer } = require("electron");

// 메인 프로세스와의 안전한 통신을 위한 API 노출
contextBridge.exposeInMainWorld("electronAPI", {
  // SMTP 관련 API
  sendEmail: (emailData) => ipcRenderer.invoke("email:send", emailData),
  testSmtpConnection: (config) => ipcRenderer.invoke("smtp:test", config),

  // 사용자 관련 API
  user: {
    create: (userData) => ipcRenderer.invoke("user:create", userData),
    get: (userId) => ipcRenderer.invoke("user:get", userId),
    update: (userId, userData) =>
      ipcRenderer.invoke("user:update", { userId, userData }),
    delete: (userId) => ipcRenderer.invoke("user:delete", userId),
  },

  // 계정 관련 API
  account: {
    create: (accountData) => ipcRenderer.invoke("account:create", accountData),
    getAll: () => ipcRenderer.invoke("account:getAll"),
    delete: (accountId) => ipcRenderer.invoke("account:delete", accountId),
  },
});
