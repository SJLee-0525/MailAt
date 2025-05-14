import { Contact } from "@/types/emailTypes";

import IconButton from "@components/common/button/IconButton";
import CloseIcon from "@assets/icons/CloseIcon";

const ChatHeader = ({
  contact,
  onClose,
}: {
  contact: Contact | null;
  onClose: () => void;
}) => {
  return (
    <div className="flex items-center justify-between w-full h-16 min-h-16 px-4 bg-light1 rounded-t-xl">
      <div>
        <h1 className="text-2xl font-pre-medium">
          {contact ? contact.name : "기록"}
        </h1>
      </div>

      <nav className="flex items-center gap-2">
        <IconButton
          type="button"
          icon={<CloseIcon width={20} height={20} />}
          className="p-2.5 transition-all duration-300 bg-default hover:bg-error"
          onClick={onClose}
        />
      </nav>
    </div>
  );
};

export default ChatHeader;
