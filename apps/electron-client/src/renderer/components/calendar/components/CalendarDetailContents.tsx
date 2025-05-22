interface Schedule {
  id: string;
  task: string;
}

const CalendarDetailContents = ({
  schedulesForDate,
}: {
  schedulesForDate: Schedule[];
}) => {
  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-2 gap-1 bg-white rounded-lg font-pre-bold ">
      {schedulesForDate && schedulesForDate.length > 0 ? (
        schedulesForDate.map((schedule) => (
          <div
            key={schedule.id}
            className="flex items-center justify-between w-full p-2 bg-gray-100 rounded-lg shadow-sm"
          >
            <span className="text-lg font-semibold">{schedule.task}</span>
          </div>
        ))
      ) : (
        <div className="flex items-center justify-center w-full h-full text-gray-500">
          일정이 없습니다.
        </div>
      )}
    </div>
  );
};

export default CalendarDetailContents;
