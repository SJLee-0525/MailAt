import { useState, useEffect } from "react";

import useAuthenticateStore from "@stores/authenticateStore";

import { getEmailsByThreadId } from "@apis/emailApi";

import { AllEmails, EmailDetailByThreadId } from "@/types/emailTypes";

import ChatHeader from "@components/chat/components/ChatHeader";
import ChatContents from "@components/chat/components/ChatContents";

const Chat = ({
  selectedMail,
  onClose,
}: {
  selectedMail: AllEmails | null;
  onClose: () => void;
}) => {
  const { user } = useAuthenticateStore();

  const [chatData, setChatData] = useState<EmailDetailByThreadId | null>(null);

  if (selectedMail === null) return null;

  async function fetchChatData() {
    if (!user || !selectedMail) return;

    try {
      const response = await getEmailsByThreadId({
        accountId: user.userId,
        email: selectedMail.fromEmail,
      });
      setChatData(response);
      return;
    } catch (error) {
      console.error("Error fetching chat data:", error);
    }
  }

  useEffect(() => {
    if (selectedMail) {
      fetchChatData();
    }
  }, [selectedMail]);

  return (
    <div className="absolute z-10 flex flex-col w-md min-w-md h-full max-h-full bg-light1 rounded-xl">
      <ChatHeader
        contact={chatData ? chatData.contact : null}
        onClose={onClose}
      />
      <div className="w-full h-full px-1 pb-1 bg-light1 rounded-b-xl overflow-y-auto">
        <ChatContents
          contactEmail={chatData ? chatData.contact.email : null}
          chatData={chatData ? chatData.messages : []}
        />
      </div>
    </div>
  );
};

export default Chat;
