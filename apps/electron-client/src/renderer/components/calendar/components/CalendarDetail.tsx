import CalendarDetailHeader from "@components/calendar/components/CalendarDetailHeader";
import CalendarDetailContents from "@components/calendar/components/CalendarDetailContents";

const CalendarDetail = ({ selectedDate }: { selectedDate: string }) => {
  return (
    <div className="flex flex-col w-md min-w-md h-full max-h-ful bg-light1 rounded-xl pointer-events-auto">
      <CalendarDetailHeader selectedDate={selectedDate} />
      <div className="w-full h-full px-1 pb-1 bg-light1 rounded-b-xl overflow-y-auto">
        <CalendarDetailContents />
      </div>
    </div>
  );
};

export default CalendarDetail;
