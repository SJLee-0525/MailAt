import CalendarDetailHeader from "@components/calendar/components/CalendarDetailHeader";
import CalendarDetailContents from "@components/calendar/components/CalendarDetailContents";

interface Schedule {
  id: string;
  task: string;
}

const CalendarDetail = ({
  selectedDate,
  isClosing,
  schedulesForDate,
}: {
  selectedDate: string;
  isClosing: boolean;
  schedulesForDate: Schedule[];
}) => {
  return (
    <div
      className={`flex flex-col w-md min-w-md h-full max-h-full border-l border-light bg-header pointer-events-auto ${isClosing ? "calendar-is-closing" : "calendar-is-open"}`}
    >
      <CalendarDetailHeader selectedDate={selectedDate} />
      <div className="w-full h-full px-1 pb-1 bg-header overflow-y-auto text-text">
        <CalendarDetailContents schedulesForDate={schedulesForDate} />
      </div>
    </div>
  );
};

export default CalendarDetail;
