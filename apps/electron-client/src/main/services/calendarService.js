import calendarRepository from "../repositories/calendarRepository.js";
import axios from 'axios'; // HTTP 클라이언트 예시 (설치 필요: npm install axios)

const FLASK_API_URL = 'http://localhost:5000/summarize'; // Flask 서버 주소 (환경 변수 등으로 관리하는 것이 좋음)

class CalendarService {
  /**
   * 새 이메일 정보를 받아 Flask API를 호출하고 캘린더 항목을 저장합니다.
   * @param {Object} emailData
   * @param {Number} emailData.messageId - 저장된 메시지의 ID
   * @param {Number} emailData.accountId - 계정 ID
   * @param {String} emailData.emailBody - 이메일 본문
   */
  async processNewEmailForCalendar({ messageId, accountId, emailBody }) {
    if (!emailBody || emailBody.trim() === "") {
      console.log(`[CalendarService] messageId: ${messageId} - 이메일 본문이 없어 스킵합니다.`);
      return;
    }

    try {
      console.log(`[CalendarService] messageId: ${messageId} - Flask API 호출 시작`);
      const response = await axios.post(FLASK_API_URL, {
        email_body: emailBody,
      });

      if (response.data && (response.data.schedule || response.data.task)) {
        const calendarData = {
          message_id: messageId,
          account_id: accountId,
          schedule: response.data.schedule || null, // API 응답에 따라 null 처리
          task: response.data.task || null,       // API 응답에 따라 null 처리
        };
        await calendarRepository.saveCalendarEntry(calendarData);
        console.log(`[CalendarService] messageId: ${messageId} - 캘린더 정보 저장 완료`);
      } else {
        console.log(`[CalendarService] messageId: ${messageId} - Flask API로부터 유효한 schedule/task를 받지 못했습니다.`);
      }
    } catch (error) {
      console.error(`[CalendarService] messageId: ${messageId} - 처리 중 오류 발생:`, error.message);
      // 필요에 따라 오류를 다시 throw 하거나, 특정 오류는 무시할 수 있습니다.
      // throw new Error(`캘린더 정보 처리 실패 (messageId: ${messageId}): ${error.message}`);
    }
  }
}

export default new CalendarService();
