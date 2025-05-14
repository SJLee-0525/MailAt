import { useInView } from "react-intersection-observer";
import { useId, useEffect } from "react";

import { AllEmails } from "@/types/emailTypes";

import { markEmailAsRead } from "@apis/emailApi";

import { useInfiniteEmails } from "@hooks/useGetConversations";

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

  const { fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteEmails();

  // 바닥 감시용 sentinel
  const { ref: bottomRef, inView } = useInView({
    rootMargin: "20px", // 200px 전에 미리 로드
  });

  // sentinel 이 화면에 들어오면 다음 페이지 요청
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

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

          {/* 무한 스크롤 sentinel */}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};

export default InboxContents;
