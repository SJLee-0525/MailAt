import InboxHeader from "@components/inbox/components/InboxHeader";
import InboxContents from "@components/inbox/components/InboxContents";

const Inbox = () => {
  return (
    <div className="flex flex-col w-md min-w-md h-full max-h-full bg-light1 rounded-xl">
      <InboxHeader />
      <div className="w-full h-full px-1 pb-1 bg-light1 rounded-b-xl overflow-y-auto">
        <InboxContents />
      </div>
    </div>
  );
};

export default Inbox;
