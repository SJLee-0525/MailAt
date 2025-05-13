import { Outlet } from "react-router-dom";

import useUserProgressStore from "@stores/userProgressStore";

import { useGetAllEmails } from "@hooks/useGetConversations";

import HoverZone from "@layouts/HoverZone";
import SideNav from "@components/common/nav/SideNav";
import Inbox from "@components/inbox/Inbox";
// import Chat from "@components/chat/Chat";
import DetailEmail from "@components/detailEmail/DetailEmail";

const PopUpLayout = () => {
  const {
    inboxIsOpen,
    selectedMail,
    isReplying,
    // chattingIsOpen,
    // setChattingIsOpen,
  } = useUserProgressStore();

  return (
    <div className="absolute top-0 right-0 flex flex-row-reverse p-1 gap-1.5 w-full h-full">
      {inboxIsOpen && !isReplying && <Inbox />}
      {/* {inboxIsOpen && chattingIsOpen && (
        <Chat onClose={() => setChattingIsOpen(false)} />
      )} */}

      {selectedMail !== null && <DetailEmail />}
    </div>
  );
};

const MainLayout = () => {
  const { refetch } = useGetAllEmails();

  return (
    <div className="flex w-screen h-screen">
      <SideNav />
      <main className="relative flex-1 overflow-auto">
        <div className="flex w-full h-full">
          <Outlet />
          <PopUpLayout />
        </div>

        <HoverZone />
      </main>
    </div>
  );
};

export default MainLayout;
