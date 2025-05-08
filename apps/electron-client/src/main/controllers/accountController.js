// src/controllers/accountController.js
import { ipcMain } from "electron";
import accountService from "../services/accountService.js";

/**
 * 계정 컨트롤러 초기화
 */
export const initAccountController = () => {
  // 계정 생성 요청 처리
  ipcMain.handle("account:create", async (event, accountData) => {
    try {
      const result = await accountService.createAccount(accountData);
      return { success: true, ...result };
    } catch (error) {
      console.error("계정 생성 컨트롤러 오류:", error);
      return { success: false, message: error.message };
    }
  });

  // 계정 목록 조회 요청 처리
  ipcMain.handle("account:getAll", async () => {
    try {
      const accounts = await accountService.getAllAccounts();
      return accounts;
    } catch (error) {
      console.error("계정 목록 조회 컨트롤러 오류:", error);
      return { success: false, message: error.message };
    }
  });

  // 계정 삭제 요청 처리
  ipcMain.handle("account:delete", async (event, accountId) => {
    try {
      const result = await accountService.deleteAccount(accountId);
      return result;
    } catch (error) {
      console.error("계정 삭제 컨트롤러 오류:", error);
      return { success: false, message: error.message };
    }
  });
};

export default { initAccountController };
