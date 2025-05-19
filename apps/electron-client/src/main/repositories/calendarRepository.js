import { getConnection } from "../config/dbConfig.js";

class CalendarRepository {
  /**
   * 캘린더 항목 생성 또는 업데이트 (UPSERT)
   * @param {Object} calendarData - 캘린더 데이터
   * @param {Number} calendarData.message_id - 메시지 ID (PK)
   * @param {Number} calendarData.account_id - 계정 ID
   * @param {String|null} calendarData.summary - 요약 내용
   * @param {String|null} calendarData.scheduled_at - 일정 내용
   * @param {String|null} calendarData.task - 할 일 내용
   * @returns {Promise<Object>} 생성 또는 업데이트된 캘린더 항목의 message_id
   */
  async saveCalendarEntry(calendarData) {
    try {
      const db = getConnection();
      // summary 필드를 구조 분해 할당에 추가
      const { message_id, account_id, summary, scheduled_at, task } = calendarData;

      return new Promise((resolve, reject) => {
        const query = `
          INSERT OR REPLACE INTO Calendar (message_id, account_id, summary, scheduled_at, task)
          VALUES (?, ?, ?, ?, ?)
        `; // summary 컬럼 추가

        // 파라미터에 summary 추가
        db.run(query, [message_id, account_id, summary, scheduled_at, task], function (err) {
          if (err) {
            reject(new Error(`캘린더 항목 저장 오류: ${err.message}`));
            return;
          }
          resolve({ message_id });
        });
      });
    } catch (error) {
      console.error("캘린더 항목 저장 오류:", error);
      throw new Error(`캘린더 항목 저장 실패: ${error.message}`);
    }
  }

  /**
   * 메시지 ID로 캘린더 항목 조회
   * @param {Number} message_id - 메시지 ID
   * @returns {Promise<Object|null>} 캘린더 항목 정보 또는 null
   */
  async getCalendarEntryByMessageId(message_id) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        const query = `
          SELECT message_id, account_id, summary, scheduled_at, task 
          FROM Calendar
          WHERE message_id = ?
        `; // summary 컬럼 추가

        db.get(query, [message_id], (err, row) => {
          if (err) {
            reject(new Error(`캘린더 항목 조회 오류: ${err.message}`));
            return;
          }
          resolve(row || null);
        });
      });
    } catch (error) {
      console.error("캘린더 항목 조회 오류:", error);
      throw new Error(`캘린더 항목 조회 실패: ${error.message}`);
    }
  }

  /**
   * 메시지 ID로 캘린더 항목 삭제
   * @param {Number} message_id - 메시지 ID
   * @returns {Promise<{success: boolean, changes: number}>} 삭제 결과
   */
  async deleteCalendarEntriesByMessageId(message_id) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        const query = `DELETE FROM Calendar WHERE message_id = ?`;

        db.run(query, [message_id], function (err) {
          if (err) {
            reject(new Error(`캘린더 항목 삭제 오류 (message_id: ${message_id}): ${err.message}`));
            return;
          }
          resolve({ success: true, changes: this.changes });
        });
      });
    } catch (error)
    {
      console.error(`캘린더 항목 삭제 오류 (message_id: ${message_id}):`, error);
      throw new Error(`캘린더 항목 삭제 실패 (message_id: ${message_id}): ${error.message}`);
    }
  }

  /**
   * 계정 ID로 모든 캘린더 항목 삭제
   * @param {Number} account_id - 계정 ID
   * @returns {Promise<{success: boolean, changes: number}>} 삭제 결과
   */
  async deleteCalendarEntriesByAccountId(account_id) {
    try {
      const db = getConnection();

      return new Promise((resolve, reject) => {
        const query = `DELETE FROM Calendar WHERE account_id = ?`;

        db.run(query, [account_id], function (err) {
          if (err) {
            reject(new Error(`캘린더 항목 삭제 오류 (account_id: ${account_id}): ${err.message}`));
            return;
          }
          resolve({ success: true, changes: this.changes });
        });
      });
    } catch (error) {
      console.error(`캘린더 항목 삭제 오류 (account_id: ${account_id}):`, error);
      throw new Error(`캘린더 항목 삭제 실패 (account_id: ${account_id}): ${error.message}`);
    }
  }
}

export default new CalendarRepository();