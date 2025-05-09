import React, { forwardRef } from "react";

import SenderList from "@components/mailForm/components/SenderList";
import MailTextEditor from "@components/mailForm/components/MailTextEditor";

interface MailFormProps {
  sender: string[];
  addSender: (e: React.FormEvent) => void;
  deleteSender: (email: string) => void;
  initialHtml: string;
  setHtml: (html: string) => void;
}

// 부모로부터 title input ref를 받아서 연동하기 위해 forwardRef 사용
const MailForm = forwardRef<HTMLInputElement, MailFormProps>(
  ({ sender, addSender, deleteSender, initialHtml, setHtml }, titleRef) => {
    return (
      <div className="relative flex flex-col w-full h-full rounded-lg bg-white p-2 font-pre-bold">
        {sender.length > 0 && (
          <SenderList sender={sender} deleteSender={deleteSender} />
        )}

        <form onSubmit={addSender} className="h-fit">
          <input
            name="sender"
            type="text"
            placeholder="받는 사람"
            className="w-full h-9 text-sm border-b-2 border-light1 focus:outline-none focus:bg-gray-100"
          />
        </form>

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
    );
  }
);

export default MailForm;
