// src/controllers/attachmentController.js
import { ipcMain } from "electron";
import attachmentService from "../services/attachmentService.js";
import messageRepository from "../repositories/messageRepository.js";

/**
 * 첨부파일 컨트롤러 초기화
 */
export const initAttachmentController = () => {
  // 첨부파일 정보 조회 요청 처리
  ipcMain.handle("attachment:getInfo", async (event, attachmentId) => {
    try {
      const result = await attachmentService.getAttachmentInfo(attachmentId);
      console.log(`첨부파일 ID ${attachmentId} 정보 조회 결과:`, result);
      return { success: true, data: result };
    } catch (error) {
      console.error("첨부파일 정보 조회 컨트롤러 오류:", error);
      return {
        success: false,
        message: `첨부파일 정보를 가져올 수 없습니다: ${error.message}`,
      };
    }
  });

  // 첨부파일 내용 조회 요청 처리
  ipcMain.handle("attachment:getContent", async (event, attachmentId) => {
    try {
      const result = await attachmentService.getAttachmentContent(attachmentId);
      // content는 Buffer이므로 로그에서 생략
      console.log(`첨부파일 ID ${attachmentId} 내용 조회 성공`);
      return { success: true, data: result };
    } catch (error) {
      console.error("첨부파일 내용 조회 컨트롤러 오류:", error);
      return {
        success: false,
        message: `첨부파일을 가져올 수 없습니다: ${error.message}`,
      };
    }
  });

  // 메시지의 모든 첨부파일 목록 조회 요청 처리
  ipcMain.handle("attachment:getByMessage", async (event, messageId) => {
    try {
      const result = await messageRepository.getMessageAttachments(messageId);
      console.log(`메시지 ID ${messageId}의 첨부파일 목록 조회 결과:`, result);
      return { success: true, data: result };
    } catch (error) {
      console.error("메시지 첨부파일 목록 조회 컨트롤러 오류:", error);
      return {
        success: false,
        message: `메시지의 첨부파일 목록을 가져올 수 없습니다: ${error.message}`,
      };
    }
  });

  // 첨부파일 다운로드 요청 처리
  ipcMain.handle(
    "attachment:download",
    async (event, attachmentId, savePath) => {
      try {
        // 첨부파일 내용 가져오기
        const attachment =
          await attachmentService.getAttachmentContent(attachmentId);

        // Node.js의 fs 모듈을 사용하여 파일 저장
        const fs = require("fs");
        fs.writeFileSync(savePath, attachment.content);

        console.log(`첨부파일 ID ${attachmentId} 다운로드 성공: ${savePath}`);
        return {
          success: true,
          data: {
            filename: attachment.filename,
            size: attachment.size,
            path: savePath,
          },
        };
      } catch (error) {
        console.error("첨부파일 다운로드 컨트롤러 오류:", error);
        return {
          success: false,
          message: `첨부파일을 다운로드할 수 없습니다: ${error.message}`,
        };
      }
    }
  );
};

export default { initAttachmentController };
