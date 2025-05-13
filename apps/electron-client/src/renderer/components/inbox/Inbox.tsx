import { use, useEffect } from "react";

import useAuthenticateStore from "@stores/authenticateStore";
import useUserProgressStore from "@stores/userProgressStore";
import useConversationsStore from "@stores/conversationsStore";

import { getEmailsData } from "@apis/emailApi";

import { useGetEmailFolders } from "@hooks/useGetConversations";

import InboxHeader from "@components/inbox/components/InboxHeader";
import InboxContents from "@components/inbox/components/InboxContents";
import Chat from "@components/chat/Chat";

const Inbox = () => {
  const { user } = useAuthenticateStore();
  const { selectedMail, chattingIsOpen, setChattingIsOpen } =
    useUserProgressStore();
  const { selectedFolder, filters, setConversations } = useConversationsStore();

  console.log(user, "user");
  if (!user) return null;

  // 폴더 목록 조회
  const { refetch } = useGetEmailFolders();

  useEffect(() => {
    async function fetchEmails() {
      if (!user) return;

      try {
        const response = await getEmailsData({
          userId: user.userId,
          folderName: selectedFolder,
          filters,
        });
        console.log("Fetched emails:", response);
        setConversations(response);
        refetch(); // 폴더 목록을 새로고침
      } catch (error) {
        console.error("Error fetching emails:", error);
      }
    }

    fetchEmails();
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
