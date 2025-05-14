import { useState } from "react";

import { ReplyData, DetailAttachment } from "@/types/emailTypes";

import useUserProgressStore from "@stores/userProgressStore";

import { markEmailAsRead } from "@apis/emailApi";

import { useDeleteEmail } from "@hooks/useGetConversations";

import { formatDate } from "@utils/getFormattedDate";
// import { parseEmailFromName } from "@utils/getEmailData";

import DetailEmailInfo from "@components/detailEmail/components/DetailEmailInfo";

import StarIcon from "@/assets/icons/StarIcon";
// import StarFillIcon from "@assets/icons/StarFillIcon";
import ArrowDownIcon from "@assets/icons/ArrowDownIcon";
import ArrowUpIcon from "@assets/icons/ArrowUpIcon";
import ReplyIcon from "@assets/icons/ReplyIcon";
import ForwardIcon from "@assets/icons/ForwardIcon";
import DeleteIcon from "@assets/icons/DeleteIcon";

const DetailEmailTitle = ({
  id,
  subject,
  date,
  fromName,
  fromEmail,
  to,
  body,
  attachments,
  isFlagged,
  isRead,
  onChangeIsRead,
  onReply,
  openChat,
}: {
  id: number;
  subject: string;
  date: string;
  fromName: string;
  fromEmail: string;
  to: string;
  body: string;
  attachments: DetailAttachment[];
  isFlagged: boolean;
  isRead: boolean;
  onChangeIsRead: (isRead: boolean) => void;
  onReply: (replyData: ReplyData) => void;
  openChat: () => void;
}) => {
  const { setIsReplying } = useUserProgressStore();

  const { mutateAsync: deleteEmail } = useDeleteEmail();

  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = formatDate(date, "dateTime");
  // const parsedFrom = parseEmailFromName(from);

  async function handleChangeIsRead() {
    try {
      const response = await markEmailAsRead(id, !isRead);
      if (response.success) {
        onChangeIsRead(response.isRead);
      }
    } catch (error) {
      console.error("Error marking email as read:", error);
    }
  }

  async function handleDelete() {
    if (window.confirm("정말로 삭제하시겠습니까?")) {
      const response = await deleteEmail({ messageId: id });

      if (response.success) {
        console.log("삭제 성공");
      } else {
        console.error("삭제 실패");
      }
    }
  }

  return (
    <div className="flex flex-col h-fit w-full gap-3 p-3">
      <div className="flex justify-between items-center w-full h-fit">
        <div className="flex items-center gap-2.5">
          <StarIcon width={22} height={22} />
          <h1 className="font-pre-bold font-bold text-xl">{subject}</h1>
        </div>

        <span className="flex items-center gap-2">
          <button
            className="font-pre-semi-bold px-1.5 py-0.5 rounded-full bg-content text-white text-xs whitespace-nowrap"
            onClick={handleChangeIsRead}
          >
            {isRead ? "읽음" : "읽지 않음"}
          </button>
          <p className="font-pre-medium text-sm text-content">
            {formattedDate}
          </p>
        </span>
      </div>

      <div className="flex justify-between items-start w-full h-fit">
        <div className="flex flex-col w-fit h-fit gap-1.5">
          <div className="flex items-center gap-2.5">
            {isExpanded ? (
              <ArrowUpIcon onClick={() => setIsExpanded(false)} />
            ) : (
              <ArrowDownIcon onClick={() => setIsExpanded(true)} />
            )}
            <div className="flex items-center justify-start gap-2">
              <h3 className="font-pre-semi-bold font-sm font-bold whitespace-nowrap">
                보낸 사람
              </h3>
              <span
                className="flex items-center justify-center px-3 py-1 rounded-full bg-disable font-pre-medium text-sm"
                onClick={openChat}
              >
                {fromName} {fromEmail}
              </span>
            </div>
          </div>
          {isExpanded && <DetailEmailInfo isRead={isRead} to={to} />}
        </div>

        <div className="flex items-center gap-2">
          <ReplyIcon
            width={24}
            height={24}
            onClick={() => {
              setIsReplying(true);
              onReply({
                to: fromEmail,
                title: "Re: " + subject,
                body: null,
                attachments: null,
              });
            }}
            className="transition-all duration-200 rounded-full hover:bg-light2"
          />
          <ForwardIcon
            width={24}
            height={24}
            onClick={() => {
              setIsReplying(true);
              onReply({
                to: null,
                title: "Fwd: " + subject,
                body: body,
                attachments: attachments ? attachments : null,
              });
            }}
            className="transition-all duration-200 rounded-full hover:bg-light2"
          />
          <DeleteIcon
            width={24}
            height={24}
            onClick={handleDelete}
            className="transition-all duration-200 rounded-full hover:bg-light2"
          />
        </div>
      </div>
    </div>
  );
};

export default DetailEmailTitle;
