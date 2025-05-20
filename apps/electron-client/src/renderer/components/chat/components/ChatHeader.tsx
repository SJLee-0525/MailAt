import { Contact } from "@/types/emailTypes";

const ChatHeader = ({ contact }: { contact: Contact | null }) => {
  return (
    <div className="flex items-center justify-between w-full h-15 min-h-15 px-4 bg-header rounded-t-xl">
      <div>
        <h1 className="text-xl text-text font-pre-bold">
          {contact ? contact.name : "기록"}
        </h1>
      </div>
    </div>
  );
};

export default ChatHeader;
