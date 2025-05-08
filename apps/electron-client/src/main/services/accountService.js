// src/services/accountService.js
import accountRepository from "../repositories/accountRepository.js";

/**
 * 계정 서비스 클래스
 */
class AccountService {
  /**
   * IMAP 호스트에서 제공자 이름 추출
   * @param {String} imapHost - IMAP 호스트 주소 (예: imap.gmail.com)
   * @returns {String} 제공자 이름 (예: gmail)
   */
  extractProviderFromHost(imapHost) {
    if (!imapHost) return "unknown";

    // imap. 이후, .com(또는 다른 TLD) 이전의 문자열 추출
    const regex = /^(?:imap\.|mail\.|smtp\.)?([^.]+)(?:\.[^.]+)?(?:\.[^.]+)$/;
    const match = imapHost.match(regex);

    if (match && match[1]) {
      // 일부 잘 알려진 제공자는 별도 처리
      const provider = match[1].toLowerCase();

      // 큰 제공자들의 특별 케이스 처리
      if (provider === "google" || provider === "googlemail") {
        return "gmail";
        //   } else if (
        //     provider === "outlook" ||
        //     provider === "hotmail" ||
        //     provider === "live"
        //   ) {
        //     return "microsoft";
      } else if (provider === "mail" && imapHost.includes("yahoo")) {
        return "yahoo";
      } else if (provider === "mail" && imapHost.includes("naver")) {
        return "naver";
      } else if (provider === "mail" && imapHost.includes("daum")) {
        return "daum";
      }

      return provider;
    }

    return "unknown";
  }

  /**
   * 새 계정 생성
   * @param {Object} accountData - 계정 데이터
   * @returns {Promise<Object>} 생성된 계정 정보
   */
  async createAccount(accountData) {
    try {
      if (!accountData.email) {
        throw new Error("이메일은 필수입니다.");
      }

      if (!accountData.password) {
        throw new Error("비밀번호는 필수입니다.");
      }

      if (!accountData.imapHost || !accountData.imapPort) {
        throw new Error("IMAP 호스트 및 포트는 필수입니다.");
      }

      if (!accountData.smtpHost || !accountData.smtpPort) {
        throw new Error("SMTP 호스트 및 포트는 필수입니다.");
      }

      // 제공자 이름 추출
      const provider = this.extractProviderFromHost(accountData.imapHost);

      // 계정 데이터에 제공자 추가
      const enrichedAccountData = {
        ...accountData,
        provider: provider,
      };

      // 사용자는 한 명만 있다고 가정하고, 첫 번째 사용자 ID 가져오기
      const userId = await accountRepository.getFirstUserId();

      // 계정 생성
      return await accountRepository.createAccount(userId, enrichedAccountData);
    } catch (error) {
      console.error("계정 생성 서비스 오류:", error);
      throw error;
    }
  }

  /**
   * 모든 계정 목록 조회
   * @returns {Promise<Array>} 계정 목록
   */
  async getAllAccounts() {
    try {
      return await accountRepository.getAllAccounts();
    } catch (error) {
      console.error("계정 목록 조회 서비스 오류:", error);
      throw error;
    }
  }

  /**
   * 계정 삭제
   * @param {Number} accountId - 삭제할 계정 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteAccount(accountId) {
    try {
      return await accountRepository.deleteAccount(accountId);
    } catch (error) {
      console.error("계정 삭제 서비스 오류:", error);
      throw error;
    }
  }
}

export default new AccountService();
