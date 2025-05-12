import { useId } from "react";

import useConservationsStore from "@stores/conversationsStore";
import userProgressStore from "@stores/userProgressStore";

import InboxContent from "@components/inbox/components/InboxContent";

const InboxFolders = ({ folders }: { folders: Record<string, string[]> }) => {
  const id = useId();

  const { selectedFolder, setSelectedFolder } = useConservationsStore();

  return (
    <div className="flex w-full p-1 gap-1 bg-white rounded-lg font-pre-bold overflow-y-auto hide-scrollbar">
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
  const { folders, conversations } = useConservationsStore();
  const { selectedMail, setSelectedMail } = userProgressStore();

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-2 gap-1 bg-white rounded-lg font-pre-bold overflow-y-auto hide-scrollbar">
      {folders && <InboxFolders folders={folders} />}
      {conversations && (
        <div className="flex flex-col w-full h-full p-2 gap-1 bg-white rounded-lg font-pre-bold overflow-y-auto hide-scrollbar">
          {conversations.map((email) => {
            return (
              <InboxContent
                key={email.id}
                email={email}
                isSelected={
                  selectedMail !== null && selectedMail.id === email.id
                }
                onClick={() => setSelectedMail(email)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InboxContents;
