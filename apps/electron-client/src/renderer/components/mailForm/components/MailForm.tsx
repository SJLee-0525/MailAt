import React, { forwardRef, useState } from "react";

import SenderList from "@components/mailForm/components/SenderList";
// import CcList from "@components/mailForm/components/CcList";
// import BccList from "@components/mailForm/components/BccList";
import MailTextEditor from "@components/mailForm/components/MailTextEditor";

interface MailFormProps {
  sender: string[];
  addSender: (e: React.FormEvent) => void;
  deleteSender: (email: string) => void;
  cc: string[];
  addCc: (e: React.FormEvent) => void;
  deleteCc: (email: string) => void;
  bcc: string[];
  addBcc: (e: React.FormEvent) => void;
  deleteBcc: (email: string) => void;
  initialHtml: string;
  setHtml: (html: string) => void;
}

// 부모로부터 title input ref를 받아서 연동하기 위해 forwardRef 사용
const MailForm = forwardRef<HTMLInputElement, MailFormProps>(
  (
    {
      sender,
      addSender,
      deleteSender,
      cc,
      addCc,
      deleteCc,
      bcc,
      addBcc,
      deleteBcc,
      initialHtml,
      setHtml,
    },
    titleRef
  ) => {
    const [isCcOpen, setIsCcOpen] = useState(false);
    const [isBccOpen, setIsBccOpen] = useState(false);

    return (
      <div className="relative flex flex-col w-full h-full rounded-lg bg-white p-2 font-pre-bold">
        {(sender.length > 0 || cc.length > 0 || bcc.length > 0) && (
          <SenderList
            sender={sender}
            deleteSender={deleteSender}
            cc={cc}
            deleteCc={deleteCc}
            bcc={bcc}
            deleteBcc={deleteBcc}
          />
        )}

        <div className="flex flex-col w-full h-full">
          <form
            onSubmit={addSender}
            className="flex justify-between items-center h-fit border-b-2 border-light1"
          >
            <input
              name="sender"
              type="text"
              placeholder="받는 사람"
              className="w-full h-9 text-sm focus:outline-none focus:bg-gray-100"
            />
            <span className="flex items-center justify-between w-fit h-9 gap-1.5 text-sm">
              <button
                onClick={() => setIsCcOpen(!isCcOpen)}
                className={`font-pre-bold text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${isCcOpen ? "bg-orange-400 text-white" : ""}`}
              >
                참조
              </button>
              <button
                onClick={() => setIsBccOpen(!isBccOpen)}
                className={`font-pre-bold text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${isBccOpen ? "bg-red-500 text-white" : ""}`}
              >
                숨은 참조
              </button>
            </span>
          </form>

          {isCcOpen && (
            <form className="h-fit" onSubmit={addCc}>
              <input
                name="cc"
                type="text"
                placeholder="참조"
                className="w-full h-9 text-sm border-b-2 border-light1 focus:outline-none focus:bg-gray-100"
              />
            </form>
          )}

          {isBccOpen && (
            <form className="h-fit" onSubmit={addBcc}>
              <input
                name="bcc"
                type="text"
                placeholder="숨은 참조"
                className="w-full h-9 text-sm border-b-2 border-light1 focus:outline-none focus:bg-gray-100"
              />
            </form>
          )}

          <input
            ref={titleRef}
            name="title"
            type="text"
            placeholder="제목"
            className="w-full h-10 text-sm border-b-2 border-light1 focus:outline-none focus:bg-gray-100"
          />

          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between w-full h-9 text-sm">
              본문
            </div>
            <MailTextEditor initialHtml={initialHtml} setHtml={setHtml} />
          </div>
        </div>
      </div>
    );
  }
);

export default MailForm;
