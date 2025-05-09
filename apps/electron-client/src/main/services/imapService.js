// src/services/imapService.js
import { ImapWrapper } from "../utils/addons.js";

/**
 * IMAP 서버 인증 테스트
 * @param {Object} config - 연결 설정 (host, port, username, password)
 * @returns {Promise<Object>} 테스트 결과
 */
export const testImapAuthentication = async (config) => {
  try {
    const { host, port, username, password } = config;

    // IMAP 래퍼 인스턴스 생성
    const imap = new ImapWrapper(host, port);

    // 인증 시도 - 성공하지 않으면 예외 발생
    const result = imap.authenticate(username, password);

    return {
      success: true,
      message: "인증 성공",
      result,
    };
  } catch (error) {
    console.error("IMAP 인증 오류:", error);

    // 오류 유형에 따른 메시지 구분
    let errorMessage = error.message;
    if (
      errorMessage.includes("authentication failed") ||
      errorMessage.includes("invalid credentials")
    ) {
      errorMessage = "이메일 또는 비밀번호가 올바르지 않습니다.";
    } else if (
      errorMessage.includes("connection") ||
      errorMessage.includes("timeout")
    ) {
      errorMessage =
        "IMAP 서버 연결에 실패했습니다. 네트워크 상태와 서버 설정을 확인하세요.";
    }

    return {
      success: false,
      message: errorMessage,
      error: error.message,
    };
  }
};

/**
 * 보낸 메일함에 메시지 저장
 * @param {Object} accountInfo - 계정 정보
 * @param {String} rawMessage - 원시 이메일 메시지
 * @returns {Promise<Object>} 저장 결과
 */
export const appendSentMessage = async (accountInfo, rawMessage) => {
  try {
    // 계정 인증 정보 가져오기
    const credentials = await getAccountCredentials(accountInfo.accountId);

    // 보낸 메일함 이름 설정 (기본값 'INBOX.Sent' 또는 'Sent')
    const sentMailbox = accountInfo.sentMailbox || "INBOX.Sent";

    // IMAP 래퍼 인스턴스 생성
    const imap = new ImapWrapper(accountInfo.imapHost, accountInfo.imapPort);

    // 인증
    imap.authenticate(credentials.username, credentials.password);

    // 메시지 추가
    imap.append(sentMailbox, rawMessage);

    return {
      success: true,
      message: `메시지가 ${sentMailbox}에 저장되었습니다.`,
    };
  } catch (error) {
    console.error("IMAP 메시지 추가 오류:", error);
    throw new Error(`보낸 메일함 저장 실패: ${error.message}`);
  }
};
