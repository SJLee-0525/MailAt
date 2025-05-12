import { useState, useEffect } from "react";

import { getEmailsByThreadId } from "@apis/emailApi";

import { AllEmails, EmailDetail } from "@/types/emailTypes";

import ChatHeader from "@components/chat/components/ChatHeader";
import ChatContents from "@components/chat/components/ChatContents";

const Chat = ({
  selectedMail,
  onClose,
}: {
  selectedMail: AllEmails | null;
  onClose: () => void;
}) => {
  const [chatData, setChatData] = useState<EmailDetail[]>([]);

  if (selectedMail === null) return null;

  async function fetchChatData(threadId: string) {
    try {
      const response = await getEmailsByThreadId({ threadId });
      setChatData(response);
      return;
    } catch (error) {
      console.error("Error fetching chat data:", error);
    }
  }

  useEffect(() => {
    if (selectedMail) {
      fetchChatData(selectedMail.threadId);
    }
  }, [selectedMail]);

  return (
    <div className="absolute z-10 flex flex-col w-md min-w-md h-full max-h-full bg-light1 rounded-xl">
      <ChatHeader onClose={onClose} />
      <div className="w-full h-full px-1 pb-1 bg-light1 rounded-b-xl overflow-y-auto">
        <ChatContents chatData={chatData} />
      </div>
    </div>
  );
};

export default Chat;
