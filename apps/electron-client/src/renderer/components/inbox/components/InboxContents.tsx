import { useInView } from "react-intersection-observer";
import { useId, useEffect } from "react";

import { AllEmails } from "@/types/emailTypes";

import { decodeImapModifiedUtf7Segment } from "@utils/getEmailData";

import {
  useInfiniteEmails,
  useMarkEmailAsRead,
} from "@hooks/useGetConversations";

import useConservationsStore from "@stores/conversationsStore";
import userProgressStore from "@stores/userProgressStore";

import InboxContent from "@components/inbox/components/InboxContent";

const InboxFolders = ({ folders }: { folders: Record<string, string[]> }) => {
  const id = useId();

  const { selectedFolder, setSelectedFolder } = useConservationsStore();

  return (
    <div className="flex w-full h-fit px-2.5 pb-2 gap-2 bg-white overflow-x-auto hide-scrollbar shadow-[0_2px_3px_-1px_rgba(0,0,0.1,0.1)]">
      {folders &&
        Object.keys(folders).map((folder) => {
          // 폴더 이름을 UTF-7로 디코딩
          const decodedFolder = decodeImapModifiedUtf7Segment(folder);

          return (
            <span
              key={`${id}-${folder}`}
              className={`flex justify-center items-center px-2.5 py-0.5 rounded-md text-center transition-all duration-200 ${folder === selectedFolder ? folders[folder][1] : folders[folder][0]}`}
              onClick={
                folder === selectedFolder
                  ? () => setSelectedFolder(null)
                  : () => setSelectedFolder(folder)
              }
            >
              <p className="text-sm font-pre-semi-bold whitespace-nowrap">
                {decodedFolder}
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

  const { fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteEmails();
  const { mutateAsync: markEmailAsRead } = useMarkEmailAsRead();

  // 바닥 감시용 sentinel
  const { ref: bottomRef, inView } = useInView({
    rootMargin: "200px", // 200px 전에 미리 로드
  });

  // sentinel 이 화면에 들어오면 다음 페이지 요청
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      console.log("[InboxContents] Fetching next page...");
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  async function openDetailEmail(email: AllEmails) {
    if (email.isRead) {
      setSelectedMail({
        messageId: email.messageId,
        fromEmail: email.fromEmail,
      });
      return;
    }

    try {
      const response = await markEmailAsRead({
        messageId: email.messageId,
        isRead: true,
      });

      if (response.success) {
        setSelectedMail({
          messageId: email.messageId,
          fromEmail: email.fromEmail,
        });
      }
    } catch (error) {
      console.error("Error marking email as read:", error);
    }
  }

  console.log("[InboxContents] conversations", conversations);
  // if (!conversations) return null; // 기존 null 체크 제거

  // conversations가 배열이고, 각 요소가 null이나 undefined가 아닌 경우만 필터링합니다.
  // 이렇게 하면 conversations가 [undefined]와 같은 형태로 들어와도 안전하게 빈 배열로 처리됩니다.
  const validConversations = Array.isArray(conversations)
    ? conversations.filter((email) => email != null)
    : [];

  return (
    <div className="flex flex-col items-center justify-between w-full h-full pb-1.5 gap-1 bg-white rounded-lg">
      {folders && <InboxFolders folders={folders} />}

      {/* validConversations를 사용하여 항상 list container를 렌더링합니다. 내용이 없으면 비어있게 됩니다. */}
      <div className="flex flex-col items-start w-full h-full px-2 gap-2 bg-white rounded-lg overflow-y-auto hide-scrollbar">
        {validConversations.map((email) => {
          return (
            <InboxContent
              key={email.messageId} // email이 null/undefined가 아니므로 messageId 접근이 비교적 안전해집니다.
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
        <div ref={bottomRef} className="min-h-1 max-h-1" />
      </div>
    </div>
  );
};

export default InboxContents;
