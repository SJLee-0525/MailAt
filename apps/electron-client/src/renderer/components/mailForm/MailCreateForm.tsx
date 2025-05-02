import { useState, useRef } from "react";

import useUserProgressStore from "@stores/userProgressStore";

import MailFormHeader from "@components/mailForm/components/MailFormHeader";
import MailForm from "@components/mailForm/components/MailForm";

const MailCreateForm = () => {
  const { setMailFormIsOpen } = useUserProgressStore();

  const [sender, setSender] = useState<string[]>([]);
  const [html, setHtml] = useState<string>("");

  const titleRef = useRef<HTMLInputElement | null>(null);

  function handleAddSender(e: React.FormEvent) {
    e.preventDefault();

    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const input = Object.fromEntries(fd.entries()).sender as string;

    if (!input) return;

    const value = input.trim();
    // @앞에는 공백 없는 문자, @ 뒤에는 도메인
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|kr|org)$/i;

    if (!emailRegex.test(value)) {
      alert(
        "유효한 이메일 형식이 아닙니다. 예) user@example.com 또는 user@domain.net"
      );
      return;
    }

    if (!sender.includes(value)) {
      setSender((prev) => [...prev, value]);
      form.reset();
    }
  }

  // 실제 제출 핸들러
  function handleSubmit() {
    console.log("받는 사람:", sender);
    console.log("제목:", titleRef.current?.value);
    console.log("본문:", html);

    if (sender.length === 0) {
      alert("받는 사람을 입력하세요.");
      return;
    } else if (titleRef.current?.value.trim() === "") {
      alert("제목을 입력하세요.");
      return;
    } else if (html.trim() === "") {
      alert("메일 내용을 입력하세요.");
      return;
    }

    setSender([]); // 보낸 사람 초기화
    titleRef.current!.value = ""; // 제목 초기화
    setHtml(""); // HTML 초기화
  }

  return (
    <div className="flex flex-col w-full h-full bg-light1 rounded-xl">
      <MailFormHeader
        closeForm={setMailFormIsOpen}
        handleSubmit={handleSubmit}
      />
      <div className="w-full h-full px-1 pb-1 bg-light1 rounded-b-xl">
        <MailForm
          ref={titleRef}
          sender={sender}
          addSender={handleAddSender}
          setHtml={setHtml}
        />
      </div>
    </div>
  );
};

export default MailCreateForm;
