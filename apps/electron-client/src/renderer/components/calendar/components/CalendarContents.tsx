// import clsx from "clsx";

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
  selectedDate: { date: selectedDate, selectDate },
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
}) => {
  const month = daysInMonth[Math.floor(daysInMonth.length / 2)].month;

  return (
    <div className="flex flex-col w-full h-full bg-white rounded-lg overflow-y-auto hide-scrollbar">
      <section className="flex flex-col items-center justify-between w-full h-full select-none">
        {/* 요일 */}
        <div className="w-full h-fit">
          <div className="grid grid-cols-7 text-center text-xs font-pre-regular">
            {WEEKDAYS.map((d, i) => (
              <span
                key={d[0]}
                className={`py-1.5 ${d[1]} border-light border-b ${i > 0 ? "border-l " : ""}`}
              >
                {d[0]}
              </span>
            ))}
          </div>
        </div>

        {/* 날짜 */}
        <div className="w-full h-full">
          <div className="grid grid-cols-7 w-full h-full overflow-hidden">
            {daysInMonth.map((day, i) => {
              const isCurrentMonth = day.month === month;
              const isSelected = day.date === selectedDate;

              let className = "font-pre-semi-bold text-sm ";
              if (isCurrentMonth) {
                className += isSelected
                  ? "text-black bg-[#E7F0F6]"
                  : "text-black";
              } else {
                className += "text-content bg-bg";
              }

              let borderClassName = "border-light ";
              if (Math.floor(i / 7) > 0) borderClassName += " border-t";
              if (i % 7 > 0) borderClassName += " border-l";

              return (
                <button
                  key={day.date}
                  onClick={() => selectDate(day.date)}
                  className={`w-full h-full p-1 flex flex-col items-start justify-between ${className} ${borderClassName}`}
                >
                  <div>{Number(day.day)}</div>
                  <div className="flex flex-col gap-0.5 w-full h-fit">
                    {/* <span className="w-fit h-fitp p-1 text-xs bg-blue-300 text-white rounded-md">
                      밥 먹기
                    </span>
                    <span className="w-fit h-fitp p-1 text-xs bg-blue-300 text-white rounded-md">
                      밥 먹기
                    </span> */}
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
