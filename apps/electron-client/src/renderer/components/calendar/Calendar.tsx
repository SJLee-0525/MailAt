import { useCalendar } from "@hooks/useCalendarHook";

import CalendarHeader from "@components/calendar/components/CalendarHeader";
import CalendarContents from "@components/calendar/components/CalendarContents";
import CalendarDetail from "@components/calendar/components/CalendarDetail";

const Calendar = () => {
  const { currentDate, daysInMonth, dispatch, selectedDate } = useCalendar();

  return (
    <>
      {selectedDate.date && <CalendarDetail selectedDate={selectedDate.date} />}
      <div className="flex flex-col w-full min-w-96 h-full bg-light1 rounded-xl transition-all duration-300 ease-in-out">
        <CalendarHeader
          currentDate={currentDate}
          dispatch={dispatch}
          onClose={() => {}}
        />
        <div className="flex flex-col w-full h-full px-1 pb-1 bg-light1 rounded-b-xl overflow-y-auto">
          <CalendarContents
            daysInMonth={daysInMonth}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </>
  );
};

export default Calendar;
