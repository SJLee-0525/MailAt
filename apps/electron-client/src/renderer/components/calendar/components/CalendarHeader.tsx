const CalendarHeader = ({
  currentDate: { year, month },
  dispatch: {
    // handlePrevYear,
    // handleNextYear,
    handlePrevMonth,
    handleNextMonth,
  },
  // onClose,
}: {
  currentDate: {
    year: string;
    month: string;
    day: string;
  };
  dispatch: {
    handlePrevYear: () => void;
    handleNextYear: () => void;
    handlePrevMonth: () => void;
    handleNextMonth: () => void;
  };
  onClose: () => void;
}) => {
  return (
    <div className="flex items-center justify-start w-full h-16 min-h-16 px-4 font-pre-bold text-xl text-text">
      <div className="flex items-center gap-2">
        <button onClick={handlePrevMonth} className="p-1">
          &lsaquo;
        </button>
        <h2>{`${year}.${month}`}</h2>
        <button onClick={handleNextMonth} className="p-1">
          &rsaquo;
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;
