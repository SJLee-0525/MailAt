import "@components/inbox/Inbox.css";

import useAuthenticateStore from "@stores/authenticateStore";
import useUserProgressStore from "@stores/userProgressStore";

import InboxHeader from "@components/inbox/components/InboxHeader";
import InboxContents from "@components/inbox/components/InboxContents";
import Chat from "@components/chat/Chat";

const Inbox = () => {
  const { user, authUsers } = useAuthenticateStore();
  const { inboxIsClosing, selectedMail, chattingIsOpen } =
    useUserProgressStore();

  if (!user || authUsers.length === 0) return null;

  return (
    <div
      className={`relative flex flex-col w-md min-w-md h-full max-h-full pointer-events-auto ${inboxIsClosing ? "inbox-is-closing" : "inbox-is-open"}`}
    >
      <div className="flex flex-col w-full h-full bg-white shadow-[-1px_0px_5px_-3px_rgba(0,0,0,0.1),_-1px_0px_5px_-4px_rgba(0,0,0,0.1)]">
        <InboxHeader />
        <div className="flex-1 w-full h-full px-1 pb-1 bg-white overflow-y-auto">
          <InboxContents />
        </div>
      </div>

      {chattingIsOpen && <Chat selectedMail={selectedMail} />}
    </div>
  );
};

export default Inbox;
