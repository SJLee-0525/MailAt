import useConservationsStore from "@stores/conversationsStore";
import userProgressStore from "@stores/userProgressStore";

import InboxContent from "@components/inbox/components/InboxContent";

const InboxContents = () => {
  const { conversations } = useConservationsStore();
  const { selectedMail, setSelectedMail } = userProgressStore();

  return (
    <div className="flex flex-col w-full h-full p-2 gap-1 bg-white rounded-lg font-pre-bold overflow-y-auto hide-scrollbar">
      {conversations &&
        conversations.map((email, index) => {
          return (
            <InboxContent
              key={email.id}
              email={email}
              isSelected={selectedMail === index}
              onClick={() => setSelectedMail(index)}
            />
          );
        })}
    </div>
  );
};

export default InboxContents;
