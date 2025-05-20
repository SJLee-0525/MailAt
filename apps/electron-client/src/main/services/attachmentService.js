import { readAttachment } from "../utils/fileSystem.js";
import { getConnection } from "../config/dbConfig.js";
import messageRepository from "../repositories/messageRepository.js";

class AttachmentService {
  /**
   * 첨부파일 정보 조회
   * @param {Number} attachmentId - 첨부파일 ID
   * @returns {Promise<Object>} 첨부파일 정보
   */
  async getAttachmentInfo(attachmentId) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        db.get(
          `SELECT 
              attachment_id as attachmentId,
              message_id as messageId,
              filename,
              mime_type as mimeType,
              path,
              size
            FROM Attachment 
            WHERE attachment_id = ?`,
          [attachmentId],
          (err, row) => {
            if (err) {
              reject(new Error(`첨부파일 정보 조회 오류: ${err.message}`));
              return;
            }

            if (!row) {
              reject(
                new Error(`첨부파일 ID ${attachmentId}를 찾을 수 없습니다.`)
              );
              return;
            }

            resolve(row);
          }
        );
      });
    } catch (error) {
      console.error("첨부파일 정보 조회 오류:", error);
      throw new Error(`첨부파일 정보 조회 실패: ${error.message}`);
    }
  }

  /**
   * 첨부파일 내용 조회
   * @param {Number} attachmentId - 첨부파일 ID
   * @returns {Promise<Object>} 첨부파일 정보와 내용
   */
  async getAttachmentContent(attachmentId) {
    try {
      // 첨부파일 정보 조회
      const attachmentInfo = await this.getAttachmentInfo(attachmentId);

      if (!attachmentInfo.path) {
        throw new Error(`첨부파일 경로가 없습니다: ${attachmentId}`);
      }

      // 파일시스템에서 파일 내용 읽기
      const content = readAttachment(attachmentInfo.path);

      if (!content) {
        throw new Error(`첨부파일을 읽을 수 없습니다: ${attachmentInfo.path}`);
      }

      return {
        ...attachmentInfo,
        content,
      };
    } catch (error) {
      console.error("첨부파일 내용 조회 오류:", error);
      throw new Error(`첨부파일 내용 조회 실패: ${error.message}`);
    }
  }

  /**
   * 본문 내용으로 첨부파일 검색
   * @param {Number} accountId - 계정 ID
   * @param {String} keyword - 검색 키워드
   * @param {Object} options - 검색 옵션 (limit, offset 등)
   * @returns {Promise<Object>} 검색 결과 객체
   */
  async searchAttachmentsByContent(accountId, keyword, options = {}) {
    try {
      if (!accountId) {
        throw new Error("계정 ID는 필수입니다.");
      }

      if (!keyword || keyword.trim().length === 0) {
        throw new Error("검색 키워드는 필수입니다.");
      }

      // 키워드가 2글자 미만인 경우 검색 제한 (성능 향상을 위해)
      if (keyword.trim().length < 2) {
        throw new Error("검색 키워드는 2글자 이상이어야 합니다.");
      }

      // 리포지토리 메소드 호출
      const attachments = await messageRepository.searchAttachmentsByContent(
        accountId,
        keyword.trim(),
        options
      );

      return {
        keyword,
        count: attachments.length,
        attachments,
      };
    } catch (error) {
      console.error("첨부파일 검색 서비스 오류:", error);
      throw new Error(`첨부파일 검색 실패: ${error.message}`);
    }
  }
}

export default new AttachmentService();
