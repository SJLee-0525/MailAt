import useUserProgressStore from "@stores/userProgressStore";

import IconButton from "@components/common/button/IconButton";

import CloseIcon from "@assets/icons/CloseIcon";
import UndoIcon from "@assets/icons/UndoIcon";

const DetailEmailHeader = ({ onClose }: { onClose: () => void }) => {
  const { chattingIsOpen, setChattingIsOpen } = useUserProgressStore();

  return (
    <div className="flex items-center justify-between w-full h-15 min-h-15 px-4 bg-header">
      <IconButton
        type="button"
        icon={<CloseIcon width={20} height={20} />}
        className="p-2 transition-all duration-300 bg-default hover:bg-error"
        onClick={onClose}
      />

      {chattingIsOpen && (
        <IconButton
          type="button"
          icon={<UndoIcon width={20} height={20} />}
          className="p-2 transition-all duration-300 bg-default hover:bg-warning"
          onClick={() => {
            setChattingIsOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default DetailEmailHeader;
