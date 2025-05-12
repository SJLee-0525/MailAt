// src/controllers/smtpController.js
import { ipcMain } from "electron";
import smtpService from "../services/smtpService.js";

/**
 * SMTP 컨트롤러 초기화
 */
export const initSmtpController = () => {
  // 이메일 전송 요청 처리
  ipcMain.handle("email:send", async (event, emailData) => {
    try {
      const result = await smtpService.sendEmail(emailData);
      console.log("이메일 전송 결과:", result);
      return { success: true, data: result };
    } catch (error) {
      console.error("이메일 전송 컨트롤러 오류:", error);
      return mapErrorToUserFriendlyResponse(error);
    }
  });

  // SMTP 연결 테스트 요청 처리
  ipcMain.handle("smtp:test", async (event, config) => {
    try {
      const result = await smtpService.testConnection(config);
      console.log("SMTP 테스트 결과:", result);
      return { success: true, data: result };
    } catch (error) {
      console.error("SMTP 테스트 컨트롤러 오류:", error);
      return mapErrorToUserFriendlyResponse(error);
    }
  });
};

/**
 * 오류를 사용자 친화적인 응답으로 변환
 * @param {Error} error - 오류 객체
 * @returns {Object} 응답 객체
 */
function mapErrorToUserFriendlyResponse(error) {
  const errorMessage = error.message || "알 수 없는 오류가 발생했습니다.";
  let userMessage = errorMessage;

  // 오류 유형에 따른 사용자 친화적 메시지 매핑
  const errorMappings = {
    "인증 실패": "이메일 계정 인증에 실패했습니다. 계정 정보를 확인해주세요.",
    연결: "SMTP 서버에 연결할 수 없습니다. 서버 설정과 인터넷 연결을 확인해주세요.",
    수신자: "유효하지 않은 수신자 주소가 포함되어 있습니다.",
    "시간 초과": "서버 응답 시간이 초과되었습니다. 나중에 다시 시도해주세요.",
    인증: "이메일 계정 인증에 실패했습니다.",
  };

  // 오류 메시지에 키워드가 포함되어 있는지 확인
  for (const [key, message] of Object.entries(errorMappings)) {
    if (errorMessage.includes(key)) {
      userMessage = message;
      break;
    }
  }

  return {
    success: false,
    message: userMessage,
    error: errorMessage,
  };
}

export default { initSmtpController };
