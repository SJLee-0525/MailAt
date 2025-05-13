// src/controllers/emailController.js
import { ipcMain } from "electron";
import emailService from "../services/emailService.js";

/**
 * 이메일 컨트롤러 초기화
 */
export const initEmailController = () => {
  // 폴더 목록 조회 요청 처리
  ipcMain.handle("email:getFolders", async (event, accountId) => {
    try {
      const folders = await emailService.getFolders(accountId);
      return { success: true, data: folders };
    } catch (error) {
      console.error("폴더 목록 조회 컨트롤러 오류:", error);
      return { success: false, message: error.message };
    }
  });

  // 이메일 목록 조회 요청 처리
  ipcMain.handle("email:getEmails", async (event, params) => {
    try {
      const emails = await emailService.getEmails(params);
      return { success: true, data: emails };
    } catch (error) {
      console.error("이메일 목록 조회 컨트롤러 오류:", error);
      return { success: false, message: error.message };
    }
  });

  // 이메일 스레드 조회 요청 처리
  ipcMain.handle("email:getThreads", async (event, params) => {
    try {
      const threads = await emailService.getThreadsByContact(params);
      return { success: true, data: threads };
    } catch (error) {
      console.error("이메일 스레드 조회 컨트롤러 오류:", error);
      return { success: false, message: error.message };
    }
  });

  // 특정 이메일 주소와 주고받은 스레드 조회
  ipcMain.handle("email:getThreadsByEmail", async (event, params) => {
    try {
      // params는 { accountId, email, limit, offset } 형태
      const contact = await emailContactRepository.getOrCreateContactByEmail(
        params.email
      );
      const threads = await emailService.getThreadsByContact({
        contactId: contact.contactId,
        limit: params.limit,
        offset: params.offset,
      });
      return { success: true, data: threads };
    } catch (error) {
      console.error("이메일 주소별 스레드 조회 컨트롤러 오류:", error);
      return { success: false, message: error.message };
    }
  });

  // 이메일 상세 조회 요청 처리
  ipcMain.handle("email:getDetail", async (event, messageId) => {
    try {
      const emailDetail = await emailService.getEmailDetail(messageId);
      return { success: true, data: emailDetail };
    } catch (error) {
      console.error("이메일 상세 조회 컨트롤러 오류:", error);
      return { success: false, message: error.message };
    }
  });

  // 이메일 삭제 요청 처리
  ipcMain.handle("email:delete", async (event, messageId) => {
    try {
      const result = await emailService.deleteEmail(messageId);
      return { success: true, data: result };
    } catch (error) {
      console.error("이메일 삭제 컨트롤러 오류:", error);
      return { success: false, message: error.message };
    }
  });

  // 이메일 읽음 상태 변경 요청 처리
  ipcMain.handle("email:markAsRead", async (event, { messageId, isRead }) => {
    try {
      const result = await emailService.markAsRead(messageId, isRead);
      return { success: true, data: result };
    } catch (error) {
      console.error("이메일 읽음 상태 변경 컨트롤러 오류:", error);
      return { success: false, message: error.message };
    }
  });
};

export default { initEmailController };
