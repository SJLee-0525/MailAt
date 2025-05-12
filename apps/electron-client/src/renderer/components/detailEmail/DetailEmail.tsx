import { useEffect, useState } from "react";

import { ReplyData, EmailDetail } from "@/types/emailTypes";
import {
  defaultEmailConversation,
  defaultReplyData,
} from "@data/EMAIL_CONSERVATIONS";

import useUserProgressStore from "@stores/userProgressStore";
import { getDetailEmail, markEmailAsRead } from "@apis/emailApi";

import DetailEmailHeader from "@components/detailEmail/components/DetailEmailHeader";
import DetailEmailContents from "@components/detailEmail/components/DetailEmailContents";
import MailReplyForm from "@components/mailForm/MailReplyForm";

const DetailEmail = () => {
  const {
    selectedMail,
    isReplying,
    chattingIsOpen,
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
      try {
        const response = await getDetailEmail(emailId);
        setDetailEmail(response);

        await markEmailAsRead(emailId, true);
      } catch (error) {
        console.error("Error fetching detail email:", error);
      }
    }

    fetchDetailEmail(selectedMail.id);
  }, [selectedMail]);

  function handleClose() {
    setSelectedMail(null);
    setIsReplying(false);
  }

  return (
    <>
      {isReplying && (
        <MailReplyForm
          replyData={replyData}
          threadId={detailEmail.threadId}
          replyId={detailEmail.id}
        />
      )}

      <div className="flex flex-col w-full min-w-96 h-full bg-light1 rounded-xl transition-all duration-300 ease-in-out">
        <DetailEmailHeader onClose={handleClose} />
        <div className="flex flex-col w-full h-full px-1 pb-1 bg-light1 rounded-b-xl overflow-y-auto">
          <DetailEmailContents
            detailEmail={detailEmail}
            openChat={() => setChattingIsOpen(!chattingIsOpen)}
            onReply={setReplyData}
          />
        </div>
      </div>
    </>
  );
};

export default DetailEmail;
