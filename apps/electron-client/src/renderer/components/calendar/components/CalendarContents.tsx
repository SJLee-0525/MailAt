// import clsx from "clsx";

interface Schedule {
  id: string;
  task: string;
}

interface Schedules {
  [date: string]: Schedule[];
}

const WEEKDAYS = [
  ["SUN", "text-error"],
  ["MON", "text-content"],
  ["TUE", "text-content"],
  ["WED", "text-content"],
  ["THU", "text-content"],
  ["FRI", "text-content"],
  ["SAT", "text-success"],
];

const CalendarContents = ({
  daysInMonth,
  selectedDate: { date: currentSelectedDate, selectDate },
  schedules,
}: {
  daysInMonth: {
    date: string;
    year: string;
    month: string;
    day: string;
    dayIndexOfWeek: number;
  }[];
  selectedDate: {
    date: string;
    selectDate: (date: string) => void;
  };
  schedules: Schedules;
}) => {
  const month =
    daysInMonth.length > 0
      ? daysInMonth[Math.floor(daysInMonth.length / 2)].month
      : "";

  return (
    <div className="flex flex-col w-full h-full bg-white rounded-lg overflow-y-auto hide-scrollbar">
      <section className="flex flex-col items-center justify-between w-full h-full select-none">
        {/* 요일 */}
        <div className="w-full h-fit">
          <div className="grid grid-cols-7 text-center text-xs font-pre-regular">
            {WEEKDAYS.map((d, i) => (
              <span
                key={d[0]}
                className={`py-1.5 ${d[1]} border-light border-b ${
                  i > 0 ? "border-l " : ""
                }`}
              >
                {d[0]}
              </span>
            ))}
          </div>
        </div>

        {/* 날짜 */}
        <div className="w-full h-full">
          <div className="grid grid-cols-7 w-full h-full overflow-hidden">
            {daysInMonth.map((dayObj, i) => {
              const isCurrentMonth = dayObj.month === month;
              const isSelected = dayObj.date === currentSelectedDate;
              const daySchedules = schedules[dayObj.date] || [];

              let className = "font-pre-semi-bold text-sm ";
              if (isCurrentMonth) {
                className += isSelected ? "text-text bg-header " : "text-text ";
                // 주말 색상 적용 (현재 달에만)
                if (dayObj.dayIndexOfWeek === 0) className += "text-error ";
                if (dayObj.dayIndexOfWeek === 6) className += "text-success ";
              } else {
                className += "text-content bg-calendardisalbed ";
              }

              let borderClassName = "border-light ";
              if (Math.floor(i / 7) > 0) borderClassName += "border-t ";
              if (i % 7 > 0) borderClassName += " border-l ";

              return (
                <button
                  key={dayObj.date}
                  onClick={() => selectDate(dayObj.date)}
                  className={`w-full h-full p-1 flex flex-col items-start justify-start ${className} ${borderClassName} hover:bg-header focus:outline-none focus:z-10`}
                >
                  <div>{Number(dayObj.day)}</div>
                  <div className="flex flex-col gap-0.5 w-full h-fit mt-1 overflow-y-auto scrollbar-hide">
                    {daySchedules.slice(0, 2).map((scheduleItem) => (
                      <span
                        key={scheduleItem.id}
                        className="w-full text-left text-xs bg-blue-400 text-white rounded-sm px-1 py-0.5 truncate"
                        title={scheduleItem.task}
                      >
                        {scheduleItem.task}
                      </span>
                    ))}
                    {daySchedules.length > 2 && (
                      <span className="text-xs text-gray-500 mt-0.5 self-center">
                        + {daySchedules.length - 2}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CalendarContents;
