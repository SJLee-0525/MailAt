import { formatDate } from "@utils/getFormattedDate";

const CalendarDetailHeader = ({ selectedDate }: { selectedDate: string }) => {
  const formattedDate = formatDate(selectedDate, "date");

  return (
    <div className="flex items-center justify-start w-full h-16 min-h-16 px-4 bg-header rounded-t-xl font-pre-bold text-xl text-text">
      {formattedDate ? formattedDate : selectedDate}
    </div>
  );
};

export default CalendarDetailHeader;
