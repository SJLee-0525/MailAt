import IconButton from "@components/common/button/IconButton";

import CloseIcon from "@assets/icons/CloseIcon";

const DetailEmailHeader = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="flex items-center justify-start w-full h-16 min-h-16 px-4">
      <div>
        <IconButton
          type="button"
          icon={<CloseIcon width={20} height={20} />}
          className="p-2.5 transition-all duration-300 bg-default hover:bg-error"
          onClick={onClose}
        />
      </div>
    </div>
  );
};

export default DetailEmailHeader;
