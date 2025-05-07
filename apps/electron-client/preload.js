// src/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 메인 프로세스와의 안전한 통신을 위한 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
  // 이메일 전송
  sendEmail: (emailData) => ipcRenderer.invoke('email:send', emailData),
  
  // SMTP 연결 테스트
  testSmtpConnection: (config) => ipcRenderer.invoke('smtp:connect', config),
  
  // SMTP 인증 테스트
  testSmtpAuthentication: (config) => ipcRenderer.invoke('smtp:authenticate', config)
});