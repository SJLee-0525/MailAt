// src/controllers/imapController.js
import { ipcMain } from "electron";
import * as imapService from "../services/imapService.js";

/**
 * IMAP 컨트롤러 초기화
 */
export const initImapController = () => {
  // 최신 이메일 동기화 요청 처리
  ipcMain.handle("imap:syncLatest", async (event, accountId) => {
    try {
      const result = await imapService.syncLatestEmails(accountId);
      console.log("이메일 동기화 결과:", result);
      return { success: true, data: result };
    } catch (error) {
      console.error("이메일 동기화 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });

  // 특정 폴더 동기화 요청 처리
  ipcMain.handle(
    "imap:syncFolder",
    async (event, { accountId, folderName, limit }) => {
      try {
        const result = await imapService.syncFolder(
          accountId,
          folderName,
          limit
        );
        console.log("폴더 동기화 결과:", result);
        return { success: true, data: result };
      } catch (error) {
        console.error("폴더 동기화 컨트롤러 오류:", error);
        return {
          success: false,
          message: error.message,
          error: error.message,
        };
      }
    }
  );

  // IMAP 인증 테스트 요청 처리
  ipcMain.handle("imap:test", async (event, config) => {
    try {
      const result = await imapService.testImapAuthentication(config);
      console.log("IMAP 테스트 결과:", result);
      return { success: true, data: result };
    } catch (error) {
      console.error("IMAP 테스트 컨트롤러 오류:", error);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  });
};

export default { initImapController };
