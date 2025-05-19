import { EmailDetail } from "@/types/emailTypes";

import { formatDate } from "@utils/getFormattedDate";

import { useMarkEmailAsRead } from "@hooks/useGetConversations";

import userProgressStore from "@stores/userProgressStore";

const FromChatContent = ({
  subject,
  body,
  date,
}: {
  subject: string;
  body: string;
  date: string;
}) => {
  return (
    <div className="flex flex-col justify-start items-end w-full h-fit p-2 gap-1">
      <span className="flex flex-col w-4/5 h-fit gap-1 bg-theme text-white rounded-b-2xl rounded-tl-2xl py-3 px-4">
        <p className="text-sm font-pre-bold">{subject}</p>
        <p className="text-sm font-pre-regular">{body}</p>
      </span>
      <p className="text-xs font-pre-regular pe-2">{date}</p>
    </div>
  );
};

const ToChatContent = ({
  subject,
  body,
  date,
}: {
  subject: string;
  body: string;
  date: string;
}) => {
  return (
    <div className="flex flex-col justify-start items-start w-full h-fit p-2 gap-1">
      <span className="flex flex-col w-4/5 h-fit gap-1 bg-light1 rounded-b-2xl rounded-tr-2xl py-3 px-4">
        <p className="text-sm font-pre-bold">{subject}</p>
        <p className="text-sm font-pre-regular">{body}</p>
      </span>
      <p className="text-xs font-pre-regular ps-2">{date}</p>
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
                    body={chat.bodyText}
                    date={formattedDate}
                  />
                ) : (
                  <FromChatContent
                    subject={chat.subject}
                    body={chat.bodyText}
                    date={formattedDate}
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
