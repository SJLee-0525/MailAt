import { useEffect } from "react";

import useAuthenticateStore from "@stores/authenticateStore";
import useUserProgressStore from "@stores/userProgressStore";
import useConversationsStore from "@stores/conversationsStore";

// import { getEmailsData } from "@apis/emailApi";

import {
  useGetEmailFolders,
  useGetAllEmails,
} from "@hooks/useGetConversations";

import InboxHeader from "@components/inbox/components/InboxHeader";
import InboxContents from "@components/inbox/components/InboxContents";
import Chat from "@components/chat/Chat";

const Inbox = () => {
  const { user } = useAuthenticateStore();
  const { selectedMail, chattingIsOpen, setChattingIsOpen } =
    useUserProgressStore();
  const { selectedFolder, filters, setConversations } = useConversationsStore();

  if (!user) return null;

  // 폴더 목록 조회
  useGetEmailFolders();

  // 이메일 목록 조회
  const { refetch: refetchEmails } = useGetAllEmails();

  useEffect(() => {
    if (!user) return;

    refetchEmails();
  }, [user.userId, selectedFolder, filters, setConversations]);

  return (
    <div className="relative flex flex-col w-md min-w-md h-full max-h-full">
      <div className="flex flex-col w-full h-full bg-light1 rounded-xl">
        <InboxHeader />
        <div className="w-full h-full px-1 pb-1 bg-light1 rounded-b-xl overflow-y-auto">
          <InboxContents />
        </div>
      </div>

      {chattingIsOpen && (
        <Chat
          selectedMail={selectedMail}
          onClose={() => setChattingIsOpen(false)}
        />
      )}
    </div>
  );
};

export default Inbox;
