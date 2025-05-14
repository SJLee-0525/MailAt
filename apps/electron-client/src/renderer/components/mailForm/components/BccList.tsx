import { useState } from "react";

import ArrowUpIcon from "@assets/icons/ArrowUpIcon";
import CloseIcon from "@assets/icons/CloseIcon";

interface BccListProps {
  bcc: string[];
  deleteBcc: (email: string) => void;
}

const ExpandedBccList = ({ bcc, deleteBcc }: BccListProps) => {
  return (
    <div className="absolute flex flex-wrap gap-2 top-10 left-0 z-50 w-full max-h-40 p-2 mb-1 overflow-y-auto hide-scrollbar bg-white rounded-b-lg shadow-lg">
      {bcc.map((person) => (
        <span
          key={person}
          className="flex items-center justify-center px-2.5 py-0.5 gap-2 rounded-full bg-disable text-sm"
        >
          <p>{person}</p>
          <CloseIcon
            className="ml-1 cursor-pointer"
            width={12}
            height={12}
            strokeColor="black"
            strokeWidth={2}
            onClick={() => deleteBcc(person)}
          />
        </span>
      ))}
    </div>
  );
};

const SenderList = ({ bcc, deleteBcc }: BccListProps) => {
  const [isOpen, setIsOpen] = useState(false);

  function toggleSenderList() {
    setIsOpen((prev) => !prev);
  }

  return (
    <div className="flex w-full h-8 py-0.5 gap-2 overflow-x-auto hide-scrollbar">
      <span className="flex w-full h-full gap-2 overflow-x-auto hide-scrollbar">
        {bcc.map((person) => (
          <span
            key={person}
            className="flex items-center justify-center px-2.5 py-0.5 gap-2 rounded-full bg-disable text-sm"
          >
            <p>{person}</p>
            <CloseIcon
              className="ml-1 cursor-pointer"
              width={12}
              height={12}
              strokeColor="black"
              strokeWidth={2}
              onClick={() => deleteBcc(person)}
            />
          </span>
        ))}
      </span>
      {bcc.length > 0 && (
        <span
          className="flex justify-center items-center h-full aspect-[1/1] rounded-full bg-blue-500 font-pre-bold text-white text-xs"
          onClick={toggleSenderList}
        >
          {isOpen ? (
            <ArrowUpIcon width={18} height={18} strokeColor="white" />
          ) : (
            bcc.length
          )}
        </span>
      )}
      {isOpen && <ExpandedBccList bcc={bcc} deleteBcc={deleteBcc} />}
    </div>
  );
};

export default SenderList;
