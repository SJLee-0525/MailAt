import clsx from "clsx";

import { Outlet } from "react-router-dom";

import useAuthenticateStore from "@stores/authenticateStore";
import useUserProgressStore from "@stores/userProgressStore";

import { useGetAccounts } from "@hooks/useGetUser";
import { useGetEmailFolders } from "@hooks/useGetConversations";

import HoverZone from "@layouts/HoverZone";
import SideNav from "@components/common/nav/SideNav";

import Calendar from "@components/calendar/Calendar";
import AttachmentViewer from "@/components/attachment/AttachmentViewer";

import GraphInbox from "@pages/emailGraph/components/GraphInbox";

import Inbox from "@components/inbox/Inbox";
import DetailEmail from "@components/detailEmail/DetailEmail";

const PopUpLayout = () => {
  const {
    inboxIsOpen,
    graphInboxIsOpen,
    calendarIsOpen,
    selectedMail,
    isReplying,
    attachmentViewerIsOpen,
  } = useUserProgressStore();

  if (calendarIsOpen) {
    return (
      <div className="absolute top-0 right-0 flex flex-row-reverse w-full h-full pointer-events-none">
        <Calendar />
      </div>
    );
  }

  if (attachmentViewerIsOpen) {
    return (
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none z-50">
        <div className="w-full h-full pointer-events-auto">
          <AttachmentViewer />
        </div>
      </div>
    );
  }

  if (graphInboxIsOpen) {
    return (
      <div className="absolute top-0 right-0 flex flex-row-reverse w-full h-full pointer-events-none">
        {!isReplying && <GraphInbox />}
        {selectedMail !== null && <DetailEmail />}
      </div>
    );
  }

  return (
    <div className="absolute top-0 right-0 flex flex-row-reverse w-full h-full pointer-events-none">
      {inboxIsOpen && !isReplying && <Inbox />}
      {selectedMail !== null && <DetailEmail />}
    </div>
  );
};

const MainLayout = () => {
  const { user, authUsers } = useAuthenticateStore();
  const { inboxIsOpen, graphInboxIsOpen } = useUserProgressStore();

  useGetAccounts();

  // 폴더 목록 조회
  useGetEmailFolders();

  // const { user } = useAuthenticateStore();

  // const { mutate: syncEmail } = useSyncEmail();

  // useEffect(() => {
  //   if (user?.userId) {
  //     syncEmail({ accountId: user.userId });
  //   }

  //   // 5분마다 이메일 동기화
  //   const intervalId = setInterval(
  //     () => {
  //       if (user?.userId) {
  //         console.log("Syncing email periodically...");
  //         syncEmail({ accountId: user.userId }); // Assuming default folderName and limit are handled in useSyncEmail
  //       }
  //     },
  //     5 * 60 * 1000
  //   );

  //   // 컴포넌트 언마운트 시 interval 정리
  //   return () => clearInterval(intervalId);
  // }, [syncEmail, user?.userId]);

  const sidePaneClass = clsx(
    "transition-[width,min-width] h-full duration-300 ease-in-out",
    "overflow-hidden", // 내용 잘림 방지
    inboxIsOpen || graphInboxIsOpen
      ? "w-md min-w-md" // 열렸을 때
      : "w-0 min-w-0" // 닫혔을 때
  );

  return (
    <div className="flex w-full h-full font-pre-regular">
      <SideNav />
      <main className="relative flex-1 overflow-hidden">
        <div className="flex w-full h-full transition-all duration-300 ease-in-out">
          <Outlet />
          <PopUpLayout />

          <div className={sidePaneClass} />
        </div>

        {user && authUsers.length > 0 && <HoverZone />}
      </main>
    </div>
  );
};

export default MainLayout;
