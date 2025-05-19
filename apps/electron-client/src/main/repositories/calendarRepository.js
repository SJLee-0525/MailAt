import { getConnection } from "../config/dbConfig.js";

class CalendarRepository {
  /**
   * 캘린더 항목 생성 또는 업데이트 (UPSERT)
   * @param {Object} calendarData - 캘린더 데이터
   * @param {Number} calendarData.message_id - 메시지 ID (PK)
   * @param {Number} calendarData.account_id - 계정 ID
   * @param {String} calendarData.scheduled_at - 일정 내용
   * @param {String} calendarData.task - 할 일 내용
   * @returns {Promise<Object>} 생성 또는 업데이트된 캘린더 항목의 message_id
   */
  async saveCalendarEntry(calendarData) {
    try {
      const db = getConnection();
      const { message_id, account_id, scheduled_at, task } = calendarData;

      return new Promise((resolve, reject) => {
        // message_id를 기준으로 존재하면 업데이트, 없으면 생성 (UPSERT)
        // Calendar 테이블의 message_id는 Message 테이블의 message_id를 참조하는 PK이므로
        // INSERT OR REPLACE를 사용하거나,
        // INSERT ... ON CONFLICT(message_id) DO UPDATE ... 를 사용할 수 있습니다.
        // 여기서는 INSERT OR REPLACE를 사용합니다.
        const query = `
          INSERT OR REPLACE INTO Calendar (message_id, account_id, scheduled_at, task)
          VALUES (?, ?, ?, ?)
        `;

        db.run(query, [message_id, account_id, scheduled_at, task], function (err) {
          if (err) {
            reject(new Error(`캘린더 항목 저장 오류: ${err.message}`));
            return;
          }
          // INSERT OR REPLACE는 lastID를 신뢰할 수 없으므로, 입력된 message_id를 반환
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
          SELECT message_id, account_id, scheduled_at, task
          FROM Calendar
          WHERE message_id = ?
        `;

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