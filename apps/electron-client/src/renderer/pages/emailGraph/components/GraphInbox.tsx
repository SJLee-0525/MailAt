import "@components/inbox/Inbox.css";

import useAuthenticateStore from "@stores/authenticateStore";
import useUserProgressStore from "@stores/userProgressStore";

import GraphInboxContents from "@pages/emailGraph/components/GraphInboxContents";

import IconButton from "@components/common/button/IconButton";
import CloseIcon from "@assets/icons/CloseIcon";

import Chat from "@components/chat/Chat";

const GraphInbox = () => {
  const { user, authUsers } = useAuthenticateStore();
  const {
    graphInboxIsClosing,
    selectedMail,
    chattingIsOpen,
    setGraphInboxIsOpen,
    setSelectedMail,
  } = useUserProgressStore();

  if (!user || authUsers.length === 0) return null;

  return (
    <div
      className={`relative flex flex-col w-md min-w-md h-full max-h-full pointer-events-auto ${graphInboxIsClosing ? "inbox-is-closing" : "inbox-is-open"}`}
    >
      <div className="flex flex-col w-full h-full bg-white shadow-[-1px_0px_5px_-3px_rgba(0,0,0,0.1),_-1px_0px_5px_-4px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between w-full h-16 min-h-16 px-4 bg-white rounded-t-xl">
          <h1 className="text-2xl font-pre-semi-bold">Inbox</h1>
          <nav className="flex items-center gap-2">
            <IconButton
              type="button"
              icon={<CloseIcon strokeColor="white" width={20} height={20} />}
              className="p-2 bg-theme hover:bg-warning"
              onClick={() => {
                setGraphInboxIsOpen(false);
                setSelectedMail(null);
              }}
            />
          </nav>
        </div>
        <div className="flex-1 w-full h-full px-1 pb-1 bg-white overflow-y-auto">
          <GraphInboxContents />
        </div>
      </div>

      {chattingIsOpen && <Chat selectedMail={selectedMail} />}
    </div>
  );
};

export default GraphInbox;
