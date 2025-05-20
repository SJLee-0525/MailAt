// import { useId } from "react";

import { AllEmails } from "@/types/emailTypes";

import defaultProfile from "@assets/images/defaultProfile.png";

// import { parseEmailFromName } from "@utils/getEmailData";
import { formatDate } from "@utils/getFormattedDate";

const FromName = ({
  isRead,
  fromName,
  fromEmail,
}: {
  isRead: boolean;
  fromName: string;
  fromEmail: string;
}) => {
  return (
    <>
      <h2
        className={`m-0 font-pre-semi-bold text-[15px] ${isRead ? "text-icon" : "text-text"}`}
      >
        {fromName}
      </h2>
      <div className="absolute top-0 left-0 w-full h-full opacity-0 hover:opacity-100 transition-opacity duration-200">
        <div className="absolute top-6 left-0 bg-black text-white font-pre-regular text-[14px] rounded py-1 px-2 whitespace-nowrap">
          {fromEmail}
        </div>
      </div>
    </>
  );
};

// const Attachment = ({ fileName }: { fileName: string }) => {
//   return (
//     <span className="flex items-center justify-center px-3 py-1 rounded-full bg-disable">
//       <p className="font-pre-medium text-sm m-0 line-clamp-1">{fileName}</p>
//     </span>
//   );
// };

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
          {email.snippet}
        </p>

        {/* 첨부파일 관련해서 생각한 번 해야할 듯 */}
        {/* {email.attachments && email.attachments.length > 0 && (
          <div className="flex w-full py-1 mb-1 gap-2 overflow-x-auto hide-scrollbar">
            {email.attachments.map((attachment, index) => (
              <Attachment
                key={`${idBase}-${index}`}
                fileName={attachment.filename}
              />
            ))}
          </div>
        )} */}
      </div>
    </div>
  );
};

export default InboxContent;
