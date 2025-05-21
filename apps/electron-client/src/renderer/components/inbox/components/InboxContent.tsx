import { AllEmails } from "@/types/emailTypes";

import defaultProfile from "@assets/images/defaultProfile.png";
import ClipIcon from "@assets/icons/ClipIcon";

import { formatDate } from "@utils/getFormattedDate";

const FromName = ({
  isRead,
  fromName,
  fromEmail,
  hasAttachments,
}: {
  isRead: boolean;
  fromName: string;
  fromEmail: string;
  hasAttachments: boolean;
}) => {
  return (
    <>
      <div className="flex justify-start items-center gap-1 w-3/5 max-w-3/5 h-6">
        <h2
          className={`w-fit m-0 font-pre-semi-bold text-[15px] whitespace-nowrap overflow-hidden text-ellipsis ${isRead ? "text-icon" : "text-text"}`}
        >
          {fromName}
        </h2>
        {hasAttachments && (
          <div className="flex items-center h-full aspect-[1/1]">
            <ClipIcon width={18} height={18} />
          </div>
        )}
      </div>
      <div className="absolute top-0 left-0 w-full h-full opacity-0 hover:opacity-100 transition-opacity duration-200">
        <div className="absolute top-6 left-0 bg-text text-white font-pre-regular text-[14px] rounded py-1 px-2 whitespace-nowrap">
          {fromEmail}
        </div>
      </div>
    </>
  );
};

const InboxContent = ({
  email,
  isSelected,
  onClick,
}: {
  email: AllEmails;
  isSelected: boolean;
  onClick: () => void;
}) => {
  // const idBase = useId();

  // 수신 시간으로 할 지, 발송 시간으로 할 지 고민 중
  const formattedDate = formatDate(email.sentAt, "date");

  return (
    <div
      className={`flex justify-between p-2.5 gap-1.5 w-full h-fit rounded-lg ${isSelected ? "bg-light1" : "transition-all duration-300 hover:bg-light"}`}
      onClick={onClick}
    >
      <div className="flex flex-col justify-start items-center w-fit py-2">
        <img
          src={defaultProfile}
          alt="Sender Profile"
          className="w-10 aspect-[1/1] rounded-full object-cover"
        />
      </div>

      <div className="flex flex-col max-w-[85%] w-[85%] h-fit max-h-30">
        <div className="relative flex justify-between items-start w-full h-fit">
          <FromName
            isRead={email.isRead}
            fromName={email.fromName}
            fromEmail={email.fromEmail}
            hasAttachments={email.hasAttachments}
          />

          {formattedDate && (
            <p className="m-0 font-pre-medium text-[12px] text-content">
              {formattedDate}
            </p>
          )}
        </div>
        <h3 className="m-0 font-pre-regular text-[14px] text-content whitespace-nowrap overflow-hidden text-ellipsis">
          {email.subject}
        </h3>
        <p className="m-0 font-pre-regular text-[14px] text-content whitespace-nowrap overflow-hidden text-ellipsis">
          {email.summary ? email.summary : email.snippet}
        </p>
      </div>
    </div>
  );
};

export default InboxContent;
