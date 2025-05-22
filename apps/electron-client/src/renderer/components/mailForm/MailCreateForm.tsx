import { useState, useRef } from "react";

import { EmailSendRequestData } from "@/types/emailTypes";

import { sendEmail } from "@apis/emailApi";

import useModalStore from "@stores/modalStore";
import useUserProgressStore from "@stores/userProgressStore";
import useAuthenticateStore from "@stores/authenticateStore";

import MailFormHeader from "@components/mailForm/components/MailFormHeader";
import MailFormWithAI from "@components/mailForm/MailFormWithAI";

const MailCreateForm = () => {
  const {
    setLoading,
    setLoadingMessage,
    setCloseLoadingMessage,
    setMailFormIsOpen,
  } = useUserProgressStore();
  const { user } = useAuthenticateStore();
  const { openAlertModal } = useModalStore();

  const [sender, setSender] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
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
      openAlertModal({
        title: "이메일 형식 오류",
        content:
          "유효한 이메일 형식이 아닙니다.\n예) user@example.com 또는 user@domain.net",
      });
      return;
    }

    if (!sender.includes(value)) {
      setSender((prev) => [...prev, value]);
    }

    form.reset();
  }

  function handleDeleteSender(email: string) {
    setSender((prev) => prev.filter((item) => item !== email));
  }

  function handleAddCc(e: React.FormEvent) {
    e.preventDefault();

    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const input = Object.fromEntries(fd.entries()).cc as string;

    if (!input) return;

    const value = input.trim();
    // @앞에는 공백 없는 문자, @ 뒤에는 도메인
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|kr|org)$/i;

    if (!emailRegex.test(value)) {
      openAlertModal({
        title: "이메일 형식 오류",
        content:
          "유효한 이메일 형식이 아닙니다. 예) user@example.com 또는 user@domain.net",
      });
      return;
    }

    if (!cc.includes(value)) {
      setCc((prev) => [...prev, value]);
    }

    form.reset();
  }

  function handleDeleteCc(email: string) {
    setCc((prev) => prev.filter((item) => item !== email));
  }

  function handleAddBcc(e: React.FormEvent) {
    e.preventDefault();

    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const input = Object.fromEntries(fd.entries()).bcc as string;

    if (!input) return;

    const value = input.trim();
    // @앞에는 공백 없는 문자, @ 뒤에는 도메인
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|kr|org)$/i;

    if (!emailRegex.test(value)) {
      openAlertModal({
        title: "이메일 형식 오류",
        content:
          "유효한 이메일 형식이 아닙니다. 예) user@example.com 또는 user@domain.net",
      });
      return;
    }

    if (!bcc.includes(value)) {
      setBcc((prev) => [...prev, value]);
    }

    form.reset();
  }

  function handleDeleteBcc(email: string) {
    setBcc((prev) => prev.filter((item) => item !== email));
  }

  // 실제 제출 핸들러
  async function handleSubmit() {
    // console.log("받는 사람:", sender);
    // console.log("제목:", titleRef.current?.value);
    // console.log("본문:", html);

    if (!user) return;

    if (sender.length === 0) {
      openAlertModal({
        title: "받는 사람 입력 오류",
        content: "받는 사람을 입력하세요.",
      });
      return;
    } else if (titleRef.current?.value.trim() === "") {
      openAlertModal({
        title: "제목 입력 오류",
        content: "제목을 입력하세요.",
      });
      return;
    } else if (html.trim() === "") {
      openAlertModal({
        title: "메일 내용 입력 오류",
        content: "메일 내용을 입력하세요.",
      });
      return;
    }

    // 이메일 전송 요청
    setLoading(true);
    setLoadingMessage("이메일 전송 중...");

    const emailData = {
      accountId: user.userId,
      to: sender,
      cc: cc, // 참조인
      bcc: bcc, // 숨은 참조인
      title: titleRef.current?.value,
      body: html,
      attachments: [], // 첨부파일
      threadId: null, // 답장할 이메일의 스레드 ID
      inReplyTo: null, // 답장할 이메일의 ID (Message-ID 헤더)
      references: [], // References 헤더에 포함할 Message-ID 목록
    };

    try {
      const response = await sendEmail(emailData as EmailSendRequestData);

      if (response.success) {
        // console.log("이메일 전송 성공:", response.messageId);

        setLoading(false);
        setLoadingMessage("이메일 전송 성공");

        setSender([]); // 보낸 사람 초기화
        titleRef.current!.value = ""; // 제목 초기화
        setHtml(""); // HTML 초기화
        setMailFormIsOpen(false); // 메일 폼 닫기
      }
    } catch (error) {
      openAlertModal({
        title: "이메일 전송 오류",
        content: "이메일 전송에 실패했습니다.",
      });

      setLoading(false);
      setLoadingMessage("이메일 전송 실패");

      console.error("Error sending email:", error);
    } finally {
      setCloseLoadingMessage();
    }
  }

  return (
    <div className="flex flex-col w-full h-full bg-white rounded-xl shadow-xl overflow-hidden">
      <MailFormHeader
        closeForm={setMailFormIsOpen}
        handleSubmit={handleSubmit}
      />
      <div className="w-full h-full px-3 pb-3 bg-white overflow-y-auto">
        <MailFormWithAI
          ref={titleRef}
          sender={sender}
          addSender={handleAddSender}
          deleteSender={handleDeleteSender}
          cc={cc}
          addCc={handleAddCc}
          deleteCc={handleDeleteCc}
          bcc={bcc}
          addBcc={handleAddBcc}
          deleteBcc={handleDeleteBcc}
          setHtml={setHtml}
          initialHtml={html}
        />
      </div>
    </div>
  );
};

export default MailCreateForm;
