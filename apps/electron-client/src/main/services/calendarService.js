import calendarRepository from "../repositories/calendarRepository.js";
import axios from 'axios'; // HTTP 클라이언트 예시 (설치 필요: npm install axios)

const FLASK_API_URL = 'http://localhost:5000/summarize'; // Flask 서버 주소

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
        email_text: emailBody,
      });

      // 서버 응답에 summary가 있고, scheduled_at 또는 task가 있을 때 처리
      if (response.data && (response.data.scheduled_at || response.data.task || response.data.summary)) {
        const calendarData = {
          message_id: messageId,
          account_id: accountId,
          summary: response.data.summary || null, // summary 추가
          scheduled_at: response.data.scheduled_at || null,
          task: response.data.task || null,
        };
        await calendarRepository.saveCalendarEntry(calendarData);
        console.log(`[CalendarService] messageId: ${messageId} - 캘린더 정보 저장 완료 (summary 포함)`);
      } else {
        console.log(`[CalendarService] messageId: ${messageId} - Flask API로부터 유효한 scheduled_at/task/summary를 받지 못했습니다.`);
      }
    } catch (error) {
      console.error(`[CalendarService] messageId: ${messageId} - 처리 중 오류 발생:`, error.message);
      throw new Error(`캘린더 정보 처리 실패 (messageId: ${messageId}): ${error.message}`);
    }
  }

  /**
   * 특정 월 및 이전/다음 월의 캘린더 이벤트 조회
   * @param {Object} params
   * @param {Number} params.accountId - 계정 ID
   * @param {Number} params.year - 조회할 연도
   * @param {Number} params.month - 조회할 월 (1-12)
   * @returns {Promise<Array<Object>>} 캘린더 이벤트 목록
   */
  async getCalendarEventsForMonth({ accountId, year, month }) {
    // 월은 0 (1월) 부터 11 (12월)까지 사용하므로 month - 1
    const targetMonth = month - 1;

    // 요청된 달의 시작일과 종료일
    const startDateCurrentMonth = new Date(year, targetMonth, 1);
    const endDateCurrentMonth = new Date(year, targetMonth + 1, 1);

    // 이전 달의 시작일과 종료일
    const startDatePrevMonth = new Date(year, targetMonth - 1, 1);
    const endDatePrevMonth = new Date(year, targetMonth, 1);

    // 다음 달의 시작일과 종료일
    const startDateNextMonth = new Date(year, targetMonth + 1, 1);
    const endDateNextMonth = new Date(year, targetMonth + 2, 1);

    try {
      const [prevMonthEvents, currentMonthEvents, nextMonthEvents] = await Promise.all([
        calendarRepository.getCalendarEntriesByDateRange(accountId, startDatePrevMonth.toISOString(), endDatePrevMonth.toISOString()),
        calendarRepository.getCalendarEntriesByDateRange(accountId, startDateCurrentMonth.toISOString(), endDateCurrentMonth.toISOString()),
        calendarRepository.getCalendarEntriesByDateRange(accountId, startDateNextMonth.toISOString(), endDateNextMonth.toISOString()),
      ]);

      return [...prevMonthEvents, ...currentMonthEvents, ...nextMonthEvents];
    } catch (error) {
      console.error(`[CalendarService] getCalendarEventsForMonth 오류:`, error);
      throw new Error(`캘린더 이벤트 조회 중 오류 발생: ${error.message}`);
    }
  }
}

export default new CalendarService();
