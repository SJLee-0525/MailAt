const DetailEmailInfo = ({ to }: { to: string }) => {
  // console.log("DetailEmailInfo", isRead, to);

  return (
    <div className="flex items-center justify-start h-fit ps-8 gap-2">
      {/* <h3 className="font-pre-semi-bold font-sm whitespace-nowrap"></h3> */}
      <span className="flex items-center justify-center px-3 py-1 rounded-full bg-light3 text-white font-pre-medium text-sm">
        {to}
      </span>
    </div>
  );
};

export default DetailEmailInfo;
