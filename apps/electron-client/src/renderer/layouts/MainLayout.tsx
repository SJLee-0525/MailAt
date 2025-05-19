import clsx from "clsx";

import { Outlet } from "react-router-dom";

import useUserProgressStore from "@stores/userProgressStore";

// import { useGetAllEmails } from "@hooks/useGetConversations";

import HoverZone from "@layouts/HoverZone";
import SideNav from "@components/common/nav/SideNav";
import Calendar from "@components/calendar/Calendar";
import Inbox from "@components/inbox/Inbox";
import DetailEmail from "@components/detailEmail/DetailEmail";

const PopUpLayout = () => {
  const { inboxIsOpen, calendarIsOpen, selectedMail, isReplying } =
    useUserProgressStore();

  if (calendarIsOpen) {
    return (
      <div className="absolute top-0 right-0 flex flex-row-reverse p-1 gap-1.5 w-full h-full pointer-events-none">
        <Calendar />
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
  // const { refetch } = useGetAllEmails();

  const { inboxIsOpen } = useUserProgressStore();

  const sidePaneClass = clsx(
    "transition-[width,min-width] h-full duration-300 ease-in-out",
    "overflow-hidden", // 내용 잘림 방지
    inboxIsOpen
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

        <HoverZone />
      </main>
    </div>
  );
};

export default MainLayout;
