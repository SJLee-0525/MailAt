import { readAttachment } from "../utils/fileSystem.js";
import { getConnection } from "../config/dbConfig.js";

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
}

export default new AttachmentService();
