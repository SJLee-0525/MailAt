import { EmailDetail } from "@/types/emailTypes";

import { formatDate } from "@utils/getFormattedDate";

import { useMarkEmailAsRead } from "@hooks/useGetConversations";

import userProgressStore from "@stores/userProgressStore";

import ClipIcon from "@assets/icons/ClipIcon";

const FromChatContent = ({
  subject,
  body,
  date,
  hasAttachments,
}: {
  subject: string;
  body: string;
  date: string;
  hasAttachments?: boolean;
}) => {
  return (
    <div className="flex flex-col justify-start items-end w-full h-fit p-2 gap-1">
      <div className="flex items-center justify-start w-full h-6 gap-1">
        <p className="w-fit text-sm font-pre-bold whitespace-nowrap overflow-hidden text-ellipsis">
          {subject}
        </p>
        {hasAttachments && (
          <div className="flex items-center h-full aspect-[1/1]">
            <ClipIcon width={18} height={18} />
          </div>
        )}
        <p className="text-sm font-pre-regular">{body}</p>
      </div>
      <p className="text-xs font-pre-regular pe-2 text-icon">{date}</p>
    </div>
  );
};

const ToChatContent = ({
  subject,
  body,
  date,
  hasAttachments,
}: {
  subject: string;
  body: string;
  date: string;
  hasAttachments?: boolean;
}) => {
  return (
    <div className="flex flex-col justify-start items-start w-full h-fit p-2 gap-1">
      <span className="flex flex-col w-4/5 h-fit gap-1 bg-light1 text-text rounded-b-2xl rounded-tr-2xl py-3 px-4">
        <div className="flex items-center justify-start w-full h-6 gap-1">
          <p className="w-fit text-sm font-pre-bold whitespace-nowrap overflow-hidden text-ellipsis">
            {subject}
          </p>
          {hasAttachments && (
            <div className="flex items-center h-full aspect-[1/1]">
              <ClipIcon width={18} height={18} />
            </div>
          )}
          <p className="text-sm font-pre-regular">{body}</p>
        </div>
      </span>
      <p className="text-xs font-pre-regular ps-2 text-icon">{date}</p>
    </div>
  );
};

const ChatContents = ({
  contactEmail,
  chatData,
}: {
  contactEmail: string | null;
  chatData: EmailDetail[];
}) => {
  const { selectedMail, setSelectedMail } = userProgressStore();

  const { mutateAsync: markEmailAsRead } = useMarkEmailAsRead();

  async function openDetailEmail(messageId: number) {
    try {
      const response = await markEmailAsRead({
        messageId,
        isRead: true,
      });

      if (response.success && selectedMail) {
        setSelectedMail({
          ...selectedMail, // 기존 selectedMail 유지
          messageId,
        });
      }
    } catch (error) {
      console.error("Error marking email as read:", error);
    }
  }

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-2 gap-1 bg-white rounded-lg font-pre-bold overflow-y-auto hide-scrollbar">
      {chatData && chatData.length === 0 && (
        <div className="flex items-center justify-center w-full h-full p-2 text-sm font-pre-bold text-gray-500">
          대화 내용이 없습니다.
        </div>
      )}

      {chatData && chatData.length > 0 && (
        <div className="flex flex-col w-full h-full py-2 gap-2.5 bg-white rounded-lg font-pre-bold overflow-y-auto hide-scrollbar">
          {chatData.map((chat) => {
            const isFromMe = chat.fromEmail === contactEmail;
            const formattedDate = formatDate(chat.receivedAt, "dateTime");

            return (
              <div
                key={chat.messageId}
                onClick={() => openDetailEmail(chat.messageId)}
                className={`flex items-center w-full h-fit ${isFromMe ? "justify-end" : "justify-start"}`}
              >
                {isFromMe ? (
                  <ToChatContent
                    subject={chat.subject}
                    body={chat.summary ? chat.summary : chat.bodyText}
                    date={formattedDate}
                    hasAttachments={chat.hasAttachments}
                  />
                ) : (
                  <FromChatContent
                    subject={chat.subject}
                    body={chat.summary ? chat.summary : chat.bodyText}
                    date={formattedDate}
                    hasAttachments={chat.hasAttachments}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatContents;
