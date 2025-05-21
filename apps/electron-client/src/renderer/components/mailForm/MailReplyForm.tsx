import { useState, useRef, useEffect } from "react";

import { ReplyData, EmailSendRequestData } from "@/types/emailTypes";

import useUserProgressStore from "@stores/userProgressStore";
import useAuthenticateStore from "@stores/authenticateStore";
import useModalStore from "@stores/modalStore";

import { sendEmail } from "@apis/emailApi";

import MailFormHeader from "@components/mailForm/components/MailFormHeader";
import MailFormWithAI from "@components/mailForm/MailFormWithAI";

const MailReplyForm = ({
  replyData,
  threadId,
  replyId,
}: {
  replyData: ReplyData;
  threadId: string;
  replyId: number;
}) => {
  const {
    setLoading,
    setLoadingMessage,
    setCloseLoadingMessage,
    setIsReplying,
  } = useUserProgressStore();
  const { user } = useAuthenticateStore();
  const { openAlertModal } = useModalStore();

  const [sender, setSender] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [html, setHtml] = useState<string>("");

  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (replyData.to) {
      setSender([replyData.to]);
    }
    if (replyData.title) {
      titleRef.current!.value = replyData.title;
    }
    if (replyData.body) {
      setHtml(replyData.body);
    }
  }, [replyData]);

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
          "유효한 이메일 형식이 아닙니다. 예) user@example.com 또는 user@domain.net",
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
        title: "받는 사람 없음",
        content: "받는 사람을 입력하세요.",
      });
      return;
    } else if (titleRef.current?.value.trim() === "") {
      openAlertModal({
        title: "제목 없음",
        content: "제목을 입력하세요.",
      });
      return;
    } else if (html.trim() === "") {
      openAlertModal({
        title: "본문 없음",
        content: "본문을 입력하세요.",
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
      threadId: threadId, // 답장할 이메일의 스레드 ID
      inReplyTo: String(replyId), // 답장할 이메일의 ID (Message-ID 헤더)
      references: [], // References 헤더에 포함할 Message-ID 목록
    };

    try {
      const response = await sendEmail(emailData as EmailSendRequestData);

      if (response.success) {
        // console.log("이메일 전송 성공:", response.messageId);

        setLoading(false);
        setLoadingMessage("이메일 전송 완료");

        setSender([]); // 보낸 사람 초기화
        titleRef.current!.value = ""; // 제목 초기화
        setHtml(""); // HTML 초기화
        setIsReplying(false); // 메일 작성 폼 닫기
      }
    } catch (error) {
      openAlertModal({
        title: "이메일 전송 실패",
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
    <div className="flex flex-col w-full max-w-1/2 h-full bg-header shadow-md pointer-events-auto">
      <MailFormHeader closeForm={setIsReplying} handleSubmit={handleSubmit} />
      <div className="w-full h-full px-1 pb-1 bg-white overflow-y-auto">
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
          initialHtml={html}
          setHtml={setHtml}
        />
      </div>
    </div>
  );
};

export default MailReplyForm;
