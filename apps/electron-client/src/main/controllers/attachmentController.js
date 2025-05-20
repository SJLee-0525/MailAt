// src/controllers/attachmentController.js
import { ipcMain, app, dialog } from "electron";
import { writeFile } from "fs/promises";
import path from "path";
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
      console.log(`첨부파일 ID ${attachmentId} 내용 조회 성공`, result);
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

  // 첨부파일 다운로드 요청 처리 - 사용자가 저장 위치 선택
  ipcMain.handle("attachment:download", async (event, attachmentId) => {
    try {
      // 첨부파일 내용 가져오기
      const attachment =
        await attachmentService.getAttachmentContent(attachmentId);

      // 저장 대화상자 표시
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: "첨부파일 저장",
        defaultPath: path.join(app.getPath("downloads"), attachment.filename),
        filters: [{ name: "모든 파일", extensions: ["*"] }],
      });

      if (canceled || !filePath) {
        return {
          success: false,
          message: "다운로드가 취소되었습니다.",
        };
      }

      // 선택한 경로에 파일 저장
      await writeFile(filePath, attachment.content);

      console.log(`첨부파일 ID ${attachmentId} 다운로드 성공: ${filePath}`);
      return {
        success: true,
        data: {
          filename: attachment.filename,
          size: attachment.size,
          path: filePath,
        },
      };
    } catch (error) {
      console.error("첨부파일 다운로드 컨트롤러 오류:", error);
      return {
        success: false,
        message: `첨부파일을 다운로드할 수 없습니다: ${error.message}`,
      };
    }
  });

  // 본문 내용 기반 첨부파일 검색 API
  ipcMain.handle("attachment:searchByContent", async (event, params) => {
    try {
      const { accountId, keyword, limit, offset } = params;

      if (!accountId || !keyword) {
        return {
          success: false,
          message: "계정 ID와 검색 키워드는 필수입니다.",
        };
      }

      const options = { limit, offset };
      const result = await attachmentService.searchAttachmentsByContent(
        accountId,
        keyword,
        options
      );

      console.log(
        `계정 ID ${accountId}의 '${keyword}' 키워드 검색 결과: ${result.count}개 항목`
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("첨부파일 검색 컨트롤러 오류:", error);
      return {
        success: false,
        message: `첨부파일 검색 중 오류가 발생했습니다: ${error.message}`,
      };
    }
  });
};

export default { initAttachmentController };
