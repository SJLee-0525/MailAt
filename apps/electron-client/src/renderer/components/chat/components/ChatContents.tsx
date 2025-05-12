import { EmailDetail } from "@/types/emailTypes";

import { formatDate } from "@utils/getFormattedDate";

// import useAuthenticateStore from "@stores/authenticateStore";

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
      <span className="flex flex-col w-4/5 h-fit gap-1 bg-theme text-white rounded-b-3xl rounded-tl-3xl py-3 px-4">
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
      <span className="flex flex-col w-4/5 h-fit gap-1 bg-light1 rounded-b-3xl rounded-tr-3xl py-3 px-4">
        <p className="text-sm font-pre-bold">{subject}</p>
        <p className="text-sm font-pre-regular">{body}</p>
      </span>
      <p className="text-xs font-pre-regular ps-2">{date}</p>
    </div>
  );
};

const ChatContents = ({ chatData }: { chatData: EmailDetail[] }) => {
  const ME = "me@example.com";

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-2 gap-1 bg-white rounded-lg font-pre-bold overflow-y-auto hide-scrollbar">
      {chatData && chatData.length === 0 && (
        <div className="flex items-center justify-center w-full h-full p-2 text-sm font-pre-bold text-gray-500">
          대화 내용이 없습니다.
        </div>
      )}

      {chatData && chatData.length > 0 && (
        <div className="flex flex-col w-full h-full py-2 gap-1 bg-white rounded-lg font-pre-bold overflow-y-auto hide-scrollbar">
          {chatData.map((chat) => {
            const isFromMe = chat.from === ME;
            const formattedDate = formatDate(chat.date, "dateTime");

            return (
              <div
                key={chat.id}
                className={`flex items-center w-full h-fit ${isFromMe ? "justify-end" : "justify-start"}`}
              >
                {isFromMe ? (
                  <ToChatContent
                    subject={chat.subject}
                    body={chat.body}
                    date={formattedDate}
                  />
                ) : (
                  <FromChatContent
                    subject={chat.subject}
                    body={chat.body}
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
