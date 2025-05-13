import ReadIcon from "@assets/icons/ReadIcon";
import UnReadIcon from "@assets/icons/UnReadIcon";

const DetailEmailInfo = ({
  isRead,
  to,
  handleChangeIsRead,
}: {
  isRead: boolean;
  to: string;
  handleChangeIsRead: () => void;
}) => {
  return (
    <div className="flex items-center justify-start h-fit gap-2.5">
      {isRead ? (
        <ReadIcon onClick={handleChangeIsRead} />
      ) : (
        <UnReadIcon onClick={handleChangeIsRead} />
      )}

      <h3 className="font-pre-semi-bold font-sm font-bold whitespace-nowrap">
        받은 사람
      </h3>
      <span className="flex items-center justify-center px-3 py-1 rounded-full bg-disable font-pre-medium text-sm">
        {to}
      </span>
    </div>
  );
};

export default DetailEmailInfo;
