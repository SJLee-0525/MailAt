// import Button from "@components/common/button/Button";
import IconButton from "@components/common/button/IconButton";

import CloseIcon from "@assets/icons/CloseIcon";
import TimerIcon from "@assets/icons/TimerIcon";
import SendIcon from "@assets/icons/SendIcon";

const MailFormHeader = ({
  closeForm,
  handleSubmit,
}: {
  closeForm: (isOpen: boolean) => void;
  handleSubmit: () => void;
}) => {
  return (
    <div className="flex items-center justify-between w-full h-15 min-h-15 px-4">
      <nav>
        <IconButton
          type="button"
          icon={<CloseIcon width={20} height={20} />}
          className="p-2 transition-all duration-300 bg-default hover:bg-error"
          onClick={() => closeForm(false)}
        />
      </nav>

      <nav className="flex items-center gap-2">
        {/* <Button
          type="button"
          content="임시"
          className="bg-default text-white"
        /> */}
        <IconButton
          type="button"
          icon={<TimerIcon width={20} height={20} />}
          className="p-2 transition-all duration-300 bg-accept hover:bg-theme"
        />
        <IconButton
          type="button"
          icon={<SendIcon width={20} height={20} />}
          className="p-2 transition-all duration-300 bg-theme hover:bg-theme-dark"
          onClick={handleSubmit}
        />
      </nav>
    </div>
  );
};

export default MailFormHeader;
