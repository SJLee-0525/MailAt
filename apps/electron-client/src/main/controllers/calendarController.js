import { ipcMain } from "electron";
import calendarService from "../services/calendarService.js";

export const initCalendarController = () => {
  ipcMain.handle("calendar:getEvents", async (event, { accountId, year, month }) => {
    try {
      if (accountId === undefined || year === undefined || month === undefined) {
        throw new Error("accountId, year, month는 필수 파라미터입니다.");
      }
      const events = await calendarService.getCalendarEventsForMonth({ accountId, year, month });
      return { success: true, data: events };
    } catch (error) {
      console.error("캘린더 이벤트 조회 컨트롤러 오류:", error);
      return { success: false, message: error.message, error: error.toString() };
    }
  });
};