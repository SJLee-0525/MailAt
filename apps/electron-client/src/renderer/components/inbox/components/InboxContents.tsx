import { useId } from "react";

import { AllEmails } from "@/types/emailTypes";

import { markEmailAsRead } from "@apis/emailApi";

import useConservationsStore from "@stores/conversationsStore";
import userProgressStore from "@stores/userProgressStore";

import InboxContent from "@components/inbox/components/InboxContent";

const InboxFolders = ({ folders }: { folders: Record<string, string[]> }) => {
  const id = useId();

  const { selectedFolder, setSelectedFolder } = useConservationsStore();

  return (
    <div className="flex w-full h-fit p-1 gap-1 bg-white rounded-lg font-pre-bold overflow-x-auto hide-scrollbar">
      {folders &&
        Object.keys(folders).map((folder) => {
          return (
            <span
              key={`${id}-${folder}`}
              className={`flex justify-center items-center px-2 py-0.5 rounded-md text-center transition-all duration-200 ${folder === selectedFolder ? folders[folder][1] : folders[folder][0]}`}
              onClick={
                folder === selectedFolder
                  ? () => setSelectedFolder(null)
                  : () => setSelectedFolder(folder)
              }
            >
              <p className="text-sm font-pre-regular whitespace-nowrap">
                {folder}
              </p>
            </span>
          );
        })}
    </div>
  );
};

const InboxContents = () => {
  const { folders, conversations, setConversations } = useConservationsStore();
  const { selectedMail, setSelectedMail } = userProgressStore();

  async function openDetailEmail(email: AllEmails) {
    if (email.isRead) {
      setSelectedMail(email);
      return;
    }

    const response = await markEmailAsRead(email.messageId, true);
    const updatedConversations = conversations.map((item) => {
      if (item.messageId === email.messageId) {
        return { ...item, isRead: true };
      }
      return item;
    });

    if (response.success) {
      setSelectedMail({ ...email, isRead: true });
    } else {
      setSelectedMail(email);
    }

    setConversations(updatedConversations);
  }

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-2 gap-1 bg-white rounded-lg font-pre-bold ">
      {folders && <InboxFolders folders={folders} />}
      {conversations && (
        <div className="flex flex-col items-start w-full h-full p-2 gap-1 bg-white rounded-lg font-pre-bold overflow-y-auto hide-scrollbar">
          {conversations.map((email) => {
            return (
              <InboxContent
                key={email.messageId}
                email={email}
                isSelected={
                  selectedMail !== null &&
                  selectedMail.messageId === email.messageId
                }
                onClick={() => openDetailEmail(email)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InboxContents;
