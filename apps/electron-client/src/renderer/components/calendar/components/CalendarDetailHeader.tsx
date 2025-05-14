import { formatDate } from "@utils/getFormattedDate";

const CalendarDetailHeader = ({ selectedDate }: { selectedDate: string }) => {
  const formattedDate = formatDate(selectedDate, "date");

  return (
    <div className="flex items-center justify-start w-full h-16 min-h-16 px-4 bg-light1 rounded-t-xl font-pre-bold text-xl">
      {formattedDate ? formattedDate : selectedDate}
    </div>
  );
};

export default CalendarDetailHeader;
