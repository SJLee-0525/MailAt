import "@components/calendar/Calendar.css";

import useUserProgressStore from "@stores/userProgressStore";

import { useCalendar } from "@hooks/useCalendarHook"; // 훅 import

import CalendarHeader from "./components/CalendarHeader";
import CalendarContents from "./components/CalendarContents";
import CalendarDetail from "./components/CalendarDetail"; // CalendarDetail import 추가

const Calendar = () => {
  const { calendarIsClosing } = useUserProgressStore();

  // useCalendar 훅 사용
  const {
    currentDateInfo,
    daysInMonth,
    dispatch,
    selectedDateInfo,
    schedulesData, // schedulesData 전체를 가져옴
  } = useCalendar();

  return (
    <>
      {/* 선택된 날짜가 있을 때 상세 정보 표시 */}
      {selectedDateInfo.date && (
        <CalendarDetail
          selectedDate={selectedDateInfo.date}
          isClosing={calendarIsClosing} // 이 prop이 필요한지 확인
          // 해당 날짜의 일정을 전달 (schedulesData.schedules는 "yyyy-MM-dd"를 키로 가짐)
          schedulesForDate={
            schedulesData.schedules[selectedDateInfo.date] || []
          }
        />
      )}
      <div
        className={`flex flex-col w-full min-w-96 h-full bg-header transition-all duration-300 ease-in-out pointer-events-auto ${
          calendarIsClosing ? "calendar-is-closing" : "calendar-is-open"
        }`}
      >
        <CalendarHeader
          currentDate={currentDateInfo} // currentDateInfo 객체 전달
          dispatch={dispatch}
          onClose={() => {
            /* 캘린더 닫기 로직 */
          }}
        />
        <div className="flex flex-col w-full h-full px-1 pb-1 bg-header overflow-y-auto">
          {/* 로딩 및 에러 상태 처리 */}
          {schedulesData.isLoading && (
            <div className="p-4 text-center">캘린더 정보를 불러오는 중...</div>
          )}
          {schedulesData.error && (
            <div className="p-4 text-center text-error">
              오류: {schedulesData.error.message}
            </div>
          )}
          {/* 로딩 중이 아니고 에러도 없을 때 캘린더 내용 표시 */}
          {!schedulesData.isLoading && !schedulesData.error && (
            <CalendarContents
              daysInMonth={daysInMonth}
              selectedDate={selectedDateInfo} // selectedDateInfo 객체 전달
              schedules={schedulesData.schedules} // schedules 객체 전달
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Calendar;
