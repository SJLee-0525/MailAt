import { contextBridge, ipcRenderer } from "electron"; // require를 import로 변경

contextBridge.exposeInMainWorld("api", {
  account: {
    add: (accountData) => ipcRenderer.invoke("account:add", accountData),
    getAll: () => ipcRenderer.invoke("account:getAll"),
    getFolders: (accountId) =>
      ipcRenderer.invoke("account:getFolders", accountId),
  },
  emails: {
    fetchHeaders: (params) => ipcRenderer.invoke("emails:fetchHeaders", params),
    fetchBody: (params) => ipcRenderer.invoke("emails:fetchBody", params),
    markAsRead: (params) => ipcRenderer.invoke("emails:markAsRead", params),
    send: (emailData) => ipcRenderer.invoke("emails:send", emailData),
      },
  testConnection: (accountData) =>
    ipcRenderer.invoke("test-connection", accountData),
});
