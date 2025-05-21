import "@components/detailEmail/DetailEmail.css";

import { useEffect, useState } from "react";

import { ReplyData, EmailDetail } from "@/types/emailTypes";
import {
  defaultEmailConversation,
  defaultReplyData,
} from "@data/EMAIL_CONSERVATIONS";

import useUserProgressStore from "@stores/userProgressStore";
import { getDetailEmail } from "@apis/emailApi";

import DetailEmailHeader from "@components/detailEmail/components/DetailEmailHeader";
import DetailEmailContents from "@components/detailEmail/components/DetailEmailContents";
import MailReplyForm from "@components/mailForm/MailReplyForm";

const DetailEmail = () => {
  const {
    selectedMail,
    selectedMailIsClosing,
    isReplying,
    chattingIsOpen,
    setLoading,
    setLoadingMessage,
    setCloseLoadingMessage,
    setSelectedMail,
    setIsReplying,
    setChattingIsOpen,
  } = useUserProgressStore();

  const [detailEmail, setDetailEmail] = useState<EmailDetail>(
    defaultEmailConversation
  );
  const [replyData, setReplyData] = useState<ReplyData>(defaultReplyData);

  useEffect(() => {
    if (selectedMail === null) return;

    async function fetchDetailEmail(emailId: number) {
      setLoading(true);
      setLoadingMessage("이메일을 불러오는 중입니다.");

      try {
        const response = await getDetailEmail(emailId);

        setDetailEmail(response);
        setLoading(false);
        setLoadingMessage("이메일 불러오기 완료");
      } catch (error) {
        console.error("Error fetching detail email:", error);
        setLoading(false);
        setLoadingMessage("이메일 불러오기 실패");
      } finally {
        setCloseLoadingMessage();
      }
    }

    fetchDetailEmail(selectedMail.messageId);
  }, [selectedMail]);

  function changeIsRead(isRead: boolean) {
    setDetailEmail((prev) => ({
      ...prev,
      isRead: isRead,
    }));
  }

  function handleClose() {
    // 순서 중요
    setChattingIsOpen(false);
    setSelectedMail(null);
    setIsReplying(false);
  }

  return (
    <div className="flex flex-row-reverse w-full h-full pointer-events-none">
      {isReplying && (
        <MailReplyForm
          replyData={replyData}
          threadId={detailEmail.threadId}
          replyId={detailEmail.messageId} // 이 값 보내는 게 맞는지 확인 필요
        />
      )}

      <div
        className={`flex flex-col w-full min-w-96 h-full bg-white transition-all duration-300 ease-in-out pointer-events-auto border-r border-header shadow-md ${selectedMailIsClosing ? "detail-email-is-closing" : "detail-email-is-open "}`}
      >
        <DetailEmailHeader onClose={handleClose} />
        <div className="flex flex-col w-full h-full px-1 pb-1 bg-white overflow-y-auto">
          <DetailEmailContents
            detailEmail={detailEmail}
            onChangeIsRead={changeIsRead}
            openChat={() => setChattingIsOpen(!chattingIsOpen)}
            onReply={setReplyData}
          />
        </div>
      </div>
    </div>
  );
};

export default DetailEmail;
