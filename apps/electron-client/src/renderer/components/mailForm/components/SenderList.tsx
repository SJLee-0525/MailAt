import { useState } from "react";

import ArrowUpIcon from "@assets/icons/ArrowUpIcon";
import CloseIcon from "@assets/icons/CloseIcon";

interface SenderListProps {
  sender: string[];
  deleteSender: (email: string) => void;
  cc: string[];
  deleteCc: (email: string) => void;
  bcc: string[];
  deleteBcc: (email: string) => void;
}

const ExpandedSenderList = ({
  sender,
  deleteSender,
  cc,
  deleteCc,
  bcc,
  deleteBcc,
}: SenderListProps) => {
  return (
    <div className="absolute flex flex-col gap-2 top-10 left-0 z-50 w-full max-h-40 p-2 mb-1 overflow-y-auto hide-scrollbar bg-white shadow-lg">
      {sender.length > 0 && (
        <>
          <p className="font-pre-bold text-xs">수신자</p>
          <span className="flex flex-wrap gap-2 w-full h-fit">
            {sender.map((person) => (
              <span
                key={person}
                className="flex items-center justify-center px-2.5 py-0.5 gap-2 rounded-full bg-blue-200 text-sm text-black whitespace-nowrap"
              >
                <p>{person}</p>
                <CloseIcon
                  className="ml-1 cursor-pointer"
                  width={12}
                  height={12}
                  strokeColor="black"
                  strokeWidth={2}
                  onClick={() => deleteSender(person)}
                />
              </span>
            ))}
          </span>
        </>
      )}

      {cc.length > 0 && (
        <>
          <p className="font-pre-bold text-xs">참조</p>
          <span className="flex flex-wrap gap-2 w-full h-fit">
            {cc.map((person) => (
              <span
                key={person}
                className="flex items-center justify-center px-2.5 py-0.5 gap-2 rounded-full bg-orange-200 text-sm text-black whitespace-nowrap"
              >
                <p>{person}</p>
                <CloseIcon
                  className="ml-1 cursor-pointer"
                  width={12}
                  height={12}
                  strokeColor="black"
                  strokeWidth={2}
                  onClick={() => deleteCc(person)}
                />
              </span>
            ))}
          </span>
        </>
      )}

      {bcc.length > 0 && (
        <>
          <p className="font-pre-bold text-xs">숨은 참조</p>
          <span className="flex flex-wrap gap-2 w-full h-fit">
            {bcc.map((person) => (
              <span
                key={person}
                className="flex items-center justify-center px-2.5 py-0.5 gap-2 rounded-full bg-red-200 text-sm text-black whitespace-nowrap"
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
        </>
      )}
    </div>
  );
};

const SenderList = ({
  sender,
  deleteSender,
  cc,
  deleteCc,
  bcc,
  deleteBcc,
}: SenderListProps) => {
  const [isOpen, setIsOpen] = useState(false);

  function toggleSenderList() {
    setIsOpen((prev) => !prev);
  }

  /* 요소 검사기에서는 나타나고 사라지는 것이 확인되지만 화면에는 보이지 않는다면, 
  부모 요소의 overflow 속성 때문에 잘리고 있을 가능성이 매우 큽니다.*/
  return (
    <div className="relative flex w-full h-8 py-0.5 gap-2 hide-scrollbar">
      {/* overflow-x-auto 제거 */}
      <span className="flex w-full h-full gap-2 overflow-x-auto hide-scrollbar">
        {sender.map((person) => (
          <span
            key={person}
            className="flex items-center justify-center px-2.5 py-0.5 gap-2 rounded-full bg-blue-200 text-black text-sm whitespace-nowrap"
          >
            <p>{person}</p>
            <CloseIcon
              className="ml-1 cursor-pointer"
              width={12}
              height={12}
              strokeColor="black"
              strokeWidth={2}
              onClick={() => deleteSender(person)}
            />
          </span>
        ))}

        {cc.map((person) => (
          <span
            key={person}
            className="flex items-center justify-center px-2.5 py-0.5 gap-2 rounded-full bg-orange-200 text-black text-sm whitespace-nowrap"
          >
            <p className="whitespace-nowrap">참조: {person}</p>
            <CloseIcon
              className="ml-1 cursor-pointer"
              width={12}
              height={12}
              strokeColor="black"
              strokeWidth={2}
              onClick={() => deleteCc(person)}
            />
          </span>
        ))}

        {bcc.map((person) => (
          <span
            key={person}
            className="flex items-center justify-center px-2.5 py-0.5 gap-2 rounded-full bg-red-200 text-black text-sm whitespace-nowrap"
          >
            <p className="whitespace-nowrap">숨은 참조: {person}</p>
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
      {(sender.length > 0 || cc.length > 0 || bcc.length > 0) && (
        <span
          className="flex justify-center items-center h-full aspect-[1/1] rounded-full bg-blue-500 font-pre-bold text-white text-xs"
          onClick={toggleSenderList}
        >
          {isOpen ? (
            <ArrowUpIcon width={18} height={18} strokeColor="white" />
          ) : (
            sender.length + cc.length + bcc.length
          )}
        </span>
      )}
      {isOpen && (
        <ExpandedSenderList
          sender={sender}
          deleteSender={deleteSender}
          cc={cc}
          deleteCc={deleteCc}
          bcc={bcc}
          deleteBcc={deleteBcc}
        />
      )}
    </div>
  );
};

export default SenderList;
