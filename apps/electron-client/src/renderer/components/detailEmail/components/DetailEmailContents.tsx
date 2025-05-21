import { ReplyData, EmailDetail } from "@/types/emailTypes";

import DetailEmailTitle from "@components/detailEmail/components/DetailEmailTitle";
import DetailEmailContent from "@components/detailEmail/components/DetailEmailContent";
import DetailAttachments from "@components/detailEmail/components/DetailAttachments";

const DetailEmailContents = ({
  detailEmail,
  onChangeIsRead,
  openChat,
  onReply,
}: {
  detailEmail: EmailDetail;
  onChangeIsRead: (isRead: boolean) => void;
  openChat: () => void;
  onReply: (replyData: ReplyData) => void;
}) => {
  return (
    <div className="flex flex-col w-full h-full p-2 gap-1 bg-white rounded-lg font-pre-bold overflow-y-auto hide-scrollbar">
      <DetailEmailTitle
        id={detailEmail.messageId}
        subject={detailEmail.subject}
        date={detailEmail.sentAt}
        fromName={detailEmail.fromName}
        fromEmail={detailEmail.fromEmail}
        body={detailEmail.bodyHtml}
        attachments={detailEmail.attachments ? detailEmail.attachments : []}
        isFlagged={detailEmail.isFlagged}
        isRead={detailEmail.isRead}
        onChangeIsRead={onChangeIsRead}
        openChat={openChat}
        onReply={onReply}
      />
      <hr className="border-t border-light3 my-0.5" />
      <DetailEmailContent body={detailEmail.bodyHtml} />
      <hr className="border-t border-light3 my-0.5" />
      <DetailAttachments
        attachments={detailEmail.attachments ? detailEmail.attachments : []}
      />
    </div>
  );
};

export default DetailEmailContents;
