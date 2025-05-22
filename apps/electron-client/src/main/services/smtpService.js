// src/services/smtpService.js
import SmtpClient from "./smtpClient.js";
import { createRawEmail, formatAttachments } from "../utils/emailUtils.js";
import accountRepository from "../repositories/accountRepository.js";

/**
 * SMTP 서비스 - 비즈니스 로직 처리
 */
class SmtpService {
  constructor() {
    // 의존성 주입을 위한 팩토리 메서드
    this.createSmtpClient = () => new SmtpClient();
  }

  /**
   * 이메일 전송
   * @param {Object} emailData - 이메일 데이터
   * @returns {Promise<Object>} 전송 결과
   */
  async sendEmail(emailData) {
    // 입력 데이터 검증
    this.validateEmailData(emailData);

    let smtpClient = null;

    try {
      // 계정 정보 조회
      const accountInfo = await this.getAccountInfo(emailData.accountId);
      console.log("계정 정보 확인 (비밀번호 로깅 생략):", {
        ...accountInfo,
        password: accountInfo.password ? "********" : "missing",
      });

      console.log("생성된 이메일 데이터:", {
      accountId: emailData.accountId,
      to: emailData.to,
      cc: emailData.cc,
      title: emailData.title,
    });

      // 계정 정보 필수 필드 확인
      if (!accountInfo.smtpHost || !accountInfo.smtpPort) {
        throw new Error("SMTP 서버 정보가 없습니다");
      }

      if (!accountInfo.password) {
        throw new Error("계정 비밀번호가 없습니다");
      }

      // 첨부 파일 처리 - 임시로 비활성화하고 빈 배열 사용
      // TODO[지우]: 첨부파일 기능 추가 후 활성화 하기
      // const attachments = await formatAttachments(emailData.attachments || []);
      const attachments = []; // 첨부 파일 기능 비활성화

      // 이메일 메시지 생성
      const emailMessage = {
        accountInfo,
        to: emailData.to,
        cc: emailData.cc || [],
        bcc: emailData.bcc || [],
        title: emailData.title,
        body: emailData.body || "",
        attachments,
        threadId: emailData.threadId,
        inReplyTo: emailData.inReplyTo,
        references: emailData.references,
      };

      // 원시 이메일 생성
      const rawMessage = createRawEmail(emailMessage);

      // SMTP 클라이언트를 통한 이메일 전송
      smtpClient = this.createSmtpClient();

      await smtpClient.connect(accountInfo.smtpHost, accountInfo.smtpPort);
      await smtpClient.authenticate(
        accountInfo.email,
        accountInfo.password,
        accountInfo.authMethod || "LOGIN"
      );

      const result = await smtpClient.sendMail(rawMessage);

      return {
        messageId: result.messageId,
        rawMessage, // 보낸 메일함 저장을 위해 반환
      };
    } catch (error) {
      console.error("이메일 전송 상세 오류:", error);
      throw this.enhanceError(error, "이메일 전송");
    } finally {
      // 항상 리소스 정리 시도
      if (smtpClient) {
        await smtpClient
          .quit()
          .catch((err) => console.error("연결 종료 오류:", err));
      }
    }
  }

  /**
   * SMTP 연결 테스트
   * @param {Object} config - 연결 설정
   * @returns {Promise<Object>} 테스트 결과
   */
  async testConnection(config) {
    const smtpClient = this.createSmtpClient();

    try {
      const { host, port, username, password, authMethod = "LOGIN" } = config;

      // 필수 파라미터 확인
      if (!host || !port) {
        throw new Error("SMTP 호스트와 포트는 필수입니다.");
      }

      // 연결 테스트
      const connectionResult = await smtpClient.connect(host, port);

      // 인증 정보가 제공된 경우 인증 테스트
      if (username && password) {
        await smtpClient.authenticate(username, password, authMethod);
        return { greeting: connectionResult.greeting, authenticated: true };
      }

      return { greeting: connectionResult.greeting };
    } catch (error) {
      throw this.enhanceError(error, "SMTP 테스트");
    } finally {
      await smtpClient
        .quit()
        .catch((err) => console.error("리소스 정리 오류:", err));
    }
  }

  /**
   * 이메일 데이터 유효성 검사
   * @param {Object} emailData - 이메일 데이터
   * @throws {Error} 유효성 검사 실패 시 오류
   */
  validateEmailData(emailData) {
    const requiredFields = {
      accountId: "계정 ID",
      to: "수신자 주소",
      title: "이메일 제목",
      body: "이메일 본문",
    };

    // 필수 필드 확인
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!emailData[field]) {
        throw new Error(`${label}은(는) 필수입니다.`);
      }
    }

    // 수신자 배열 검증
    if (!Array.isArray(emailData.to) || emailData.to.length === 0) {
      throw new Error("최소 한 명 이상의 수신자가 필요합니다.");
    }

    // 첨부파일 배열 검증 (있는 경우)
    if (emailData.attachments && !Array.isArray(emailData.attachments)) {
      throw new Error("첨부 파일은 배열 형식이어야 합니다.");
    }

    return true;
  }

  /**
   * 계정 정보 조회
   * @param {Number|String} accountId - 계정 ID
   * @returns {Promise<Object>} 계정 정보
   */
  async getAccountInfo(accountId) {
    try {
      const account = await accountRepository.getAccountById(accountId);

      if (!account) {
        throw new Error(
          `계정 ID(${accountId})에 해당하는 계정을 찾을 수 없습니다.`
        );
      }

      return account;
    } catch (error) {
      throw this.enhanceError(error, "계정 정보 조회");
    }
  }

  /**
   * 오류 정보 강화
   * @param {Error} error - 원본 오류
   * @param {String} context - 오류 컨텍스트
   * @returns {Error} 강화된 오류
   */
  enhanceError(error, context) {
    const enhancedError = new Error(`${context} 실패: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.context = context;
    return enhancedError;
  }
}

export default new SmtpService();
