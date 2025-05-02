const SenderList = ({ sender }: { sender: string[] }) => {
  return (
    <div className="flex w-full py-1 mb-1 gap-2 overflow-x-auto hide-scrollbar">
      {sender.map((person) => (
        <span
          key={person}
          className="flex items-center justify-center px-3 py-1 rounded-full bg-disable text-sm"
        >
          {person}
        </span>
      ))}
    </div>
  );
};

export default SenderList;
