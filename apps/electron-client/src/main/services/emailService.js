// src/services/emailService.js
import folderRepository from "../repositories/folderRepository.js";
import messageRepository from "../repositories/messageRepository.js";
import emailContactRepository from "../repositories/emailContactRepository.js";

/**
 * 이메일 서비스 클래스
 */
class EmailService {
  /**
   * 계정별 폴더 목록 조회
   * @param {Number} accountId - 계정 ID
   * @returns {Promise<Array>} 폴더 목록
   */
  async getFolders(accountId) {
    try {
      if (!accountId) {
        throw new Error("계정 ID는 필수입니다.");
      }
      return await folderRepository.getFoldersByAccount(accountId);
    } catch (error) {
      console.error("폴더 목록 조회 서비스 오류:", error);
      throw error;
    }
  }

  /**
   * 이메일 목록 조회 (필터링 지원)
   * @param {Object} params - 이메일 조회 파라미터
   * @returns {Promise<Array>} 이메일 목록
   */
  async getEmails(params) {
    try {
      if (!params.accountId) {
        throw new Error("계정 ID는 필수입니다.");
      }

      if (!params.folderName) {
        throw new Error("폴더 이름은 필수입니다.");
      }

      return await messageRepository.getFilteredMessages(params);
    } catch (error) {
      console.error("이메일 목록 조회 서비스 오류:", error);
      throw error;
    }
  }

  /**
   * 특정 연락처와의 이메일 스레드 조회
   * @param {Object} params - 조회 파라미터 (contactId, limit, offset)
   * @returns {Promise<Object>} 연락처 정보와 메시지 목록
   */
  async getThreadsByContact(params) {
    try {
      const { contactId, limit, offset } = params;

      if (!contactId) {
        throw new Error("연락처 ID는 필수입니다.");
      }

      // 연락처 정보 조회
      const contact = await emailContactRepository.getContactById(contactId);
      if (!contact) {
        throw new Error(
          `연락처 ID(${contactId})에 해당하는 연락처를 찾을 수 없습니다.`
        );
      }

      // 연락처와 주고받은 메시지 목록 조회
      const messages = await messageRepository.getMessagesByContact(contactId, {
        limit,
        offset,
      });

      return {
        contact,
        messages,
      };
    } catch (error) {
      console.error("이메일 스레드 조회 서비스 오류:", error);
      throw error;
    }
  }

  /**
   * 이메일 상세 정보 조회
   * @param {Number} messageId - 메시지 ID
   * @returns {Promise<Object>} 이메일 상세 정보
   */
  async getEmailDetail(messageId) {
    try {
      if (!messageId) {
        throw new Error("메시지 ID는 필수입니다.");
      }

      // 메시지 기본 정보 조회
      const message = await messageRepository.getMessageById(messageId);
      if (!message) {
        throw new Error(
          `메시지 ID(${messageId})에 해당하는 메시지를 찾을 수 없습니다.`
        );
      }

      // 관련 연락처 조회
      const contacts = await messageRepository.getMessageContacts(messageId);

      // 첨부파일 조회
      const attachments =
        await messageRepository.getMessageAttachments(messageId);

      // 읽음 상태로 자동 변경 (옵션)
      await this.markAsRead(messageId, true);

      return {
        ...message,
        contacts,
        attachments,
      };
    } catch (error) {
      console.error("이메일 상세 조회 서비스 오류:", error);
      throw error;
    }
  }

  /**
   * 이메일 삭제
   * @param {Number} messageId - 메시지 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteEmail(messageId) {
    try {
      if (!messageId) {
        throw new Error("메시지 ID는 필수입니다.");
      }

      return await messageRepository.deleteMessage(messageId);
    } catch (error) {
      console.error("이메일 삭제 서비스 오류:", error);
      throw error;
    }
  }

  /**
   * 이메일 읽음 상태 변경
   * @param {Number} messageId - 메시지 ID
   * @param {Boolean} isRead - 읽음 상태
   * @returns {Promise<Object>} 업데이트 결과
   */
  async markAsRead(messageId, isRead = true) {
    try {
      if (!messageId) {
        throw new Error("메시지 ID는 필수입니다.");
      }

      return await messageRepository.updateReadStatus(messageId, isRead);
    } catch (error) {
      console.error("이메일 읽음 상태 변경 서비스 오류:", error);
      throw error;
    }
  }
}

export default new EmailService();
