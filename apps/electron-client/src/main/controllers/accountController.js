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
      console.log("계정 생성 결과:", result);
      return { success: true, data: result };
    } catch (error) {
      console.error("계정 생성 컨트롤러 오류:", error);

      // 오류 메시지에 따라 사용자 친화적인 메시지 반환
      let message = error.message;
      if (message.includes("IMAP 인증 실패")) {
        message =
          "이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.";
      } else if (message.includes("연결")) {
        message =
          "IMAP 서버에 연결할 수 없습니다. 서버 설정과 인터넷 연결을 확인해주세요.";
      }

      return {
        success: false,
        message: message,
        error: error.message,
      };
    }
  });

  // 계정 목록 조회 요청 처리
  ipcMain.handle("account:getAll", async () => {
    try {
      const accounts = await accountService.getAllAccounts();
      console.log("계정 목록 조회 결과:", accounts);
      return { success: true, data: accounts };
    } catch (error) {
      console.error("계정 목록 조회 컨트롤러 오류:", error);
      return { success: false, message: error.message };
    }
  });

  // 계정 삭제 요청 처리
  ipcMain.handle("account:delete", async (event, accountId) => {
    try {
      const result = await accountService.deleteAccount(accountId);
      console.log("계정 삭제 결과:", result);
      return { success: true, data: result };
    } catch (error) {
      console.error("계정 삭제 컨트롤러 오류:", error);
      return { success: false, message: error.message };
    }
  });
};

export default { initAccountController };
