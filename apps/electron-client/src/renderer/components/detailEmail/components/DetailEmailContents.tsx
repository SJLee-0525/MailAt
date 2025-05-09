import { ReplyData, EmailDetail } from "@/types/emailTypes";

import DetailEmailTitle from "@components/detailEmail/components/DetailEmailTitle";
import DetailEmailContent from "@components/detailEmail/components/DetailEmailContent";
import DetailAttachments from "@components/detailEmail/components/DetailAttachments";

const DetailEmailContents = ({
  detailEmail,
  onReply,
}: {
  detailEmail: EmailDetail;
  onReply: (replyData: ReplyData) => void;
}) => {
  return (
    <div className="flex flex-col w-full h-full p-2 gap-1 bg-white rounded-lg font-pre-bold overflow-y-auto hide-scrollbar">
      <DetailEmailTitle
        id={detailEmail.id}
        subject={detailEmail.subject}
        date={detailEmail.date}
        from={detailEmail.from}
        to={detailEmail.to}
        body={detailEmail.body}
        attachments={detailEmail.attachments}
        onReply={onReply}
      />
      <hr className="border-t border-light3 my-0.5" />
      <DetailEmailContent body={detailEmail.body} />
      <hr className="border-t border-light3 my-0.5" />
      <DetailAttachments attachments={detailEmail.attachments} />
    </div>
  );
};

export default DetailEmailContents;
