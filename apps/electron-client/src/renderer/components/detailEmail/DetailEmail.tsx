import { useEffect, useState } from "react";

import { ReplyData, EmailConversation } from "@/types/emailTypes";
import {
  defaultEmailConversation,
  defaultReplyData,
} from "@data/EMAIL_CONSERVATIONS";

import useUserProgressStore from "@stores/userProgressStore";
import { getDetailEmail } from "@/apis/emailApi";

import DetailEmailHeader from "@components/detailEmail/components/DetailEmailHeader";
import DetailEmailContents from "@components/detailEmail/components/DetailEmailContents";
import MailReplyForm from "@components/mailForm/MailReplyForm";

const DetailEmail = () => {
  const { selectedMail, isReplying, setSelectedMail, setIsReplying } =
    useUserProgressStore();

  const [detailEmail, setDetailEmail] = useState<EmailConversation>(
    defaultEmailConversation
  );
  const [replyData, setReplyData] = useState<ReplyData>(defaultReplyData);

  useEffect(() => {
    if (selectedMail === null) return;

    async function fetchDetailEmail(emailId: number) {
      try {
        const response = await getDetailEmail(emailId);
        setDetailEmail(response);
      } catch (error) {
        console.error("Error fetching detail email:", error);
      }
    }

    fetchDetailEmail(selectedMail);
  }, [selectedMail]);

  function handleClose() {
    setSelectedMail(null);
    setIsReplying(false);
  }

  return (
    <>
      {isReplying && <MailReplyForm replyData={replyData} />}

      <div className="flex flex-col w-full min-w-96 h-full bg-light1 rounded-xl transition-all duration-300 ease-in-out">
        <DetailEmailHeader onClose={handleClose} />
        <div className="flex flex-col w-full h-full px-1 pb-1 bg-light1 rounded-b-xl overflow-y-auto">
          <DetailEmailContents
            detailEmail={detailEmail}
            onReply={setReplyData}
          />
        </div>
      </div>
    </>
  );
};

export default DetailEmail;
