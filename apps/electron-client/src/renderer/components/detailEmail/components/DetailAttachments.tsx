import { DetailAttachment as DetailAttachmentType } from "@/types/emailTypes";

const DetailAttachment = ({
  attachment,
}: {
  attachment: DetailAttachmentType;
}) => {
  return (
    <div className="flex flex-col w-32 min-w-32 h-fit rounded-lg border border-light3">
      <div className="px-1.5 py-1 w-full rounded-t-lg bg-light3">
        <h3 className="font-pre-semi-bold text-xs text-text line-clamp-1">
          {attachment.filename}
        </h3>
      </div>
      <div className="flex justify-center items-center w-full h-20 rounded-b-lg bg-white">
        {/* */}
      </div>
    </div>
  );
};

const DetailAttachments = ({
  attachments,
}: {
  attachments: DetailAttachmentType[];
}) => {
  if (attachments && attachments.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col h-fit w-full gap-2.5 p-3">
      <h3 className="font-pre-semi-bold font-sm text-text">첨부파일</h3>
      <div className="flex w-full h-fit py-1 mb-1 gap-2 overflow-x-auto hide-scrollbar">
        {attachments &&
          attachments.map((attachment) => (
            <DetailAttachment
              key={attachment.attachmentId}
              attachment={attachment}
            />
          ))}
      </div>
    </div>
  );
};

export default DetailAttachments;
