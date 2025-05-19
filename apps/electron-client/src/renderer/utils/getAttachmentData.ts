// src/utils/getAttachmentData.ts
import type { Attachment } from "@/types/attachmentTypes";
import { AttachmentInfo } from "@/types/attachmentTypes";

// API에서 가져온 데이터를 UI 컴포넌트에서 사용할 수 있는 형식으로 변환
export function mapApiAttachmentToUi(
  apiAttachment: AttachmentInfo,
  messageDetails: any
): Attachment {
  return {
    id: apiAttachment.attachmentId,
    filename: apiAttachment.filename,
    mimeType: apiAttachment.mimeType,
    size: apiAttachment.size,
    path: apiAttachment.path,
    contactName: messageDetails.fromName || "알 수 없음",
    contactEmail: messageDetails.fromEmail || "unknown@email.com",
    messageSubject: messageDetails.subject || "(제목 없음)",
    messageId: apiAttachment.messageId,
    createdAt: messageDetails.receivedAt || new Date().toISOString(),
  };
}

// 메시지 ID로 모든 첨부파일 가져오기
export async function getMessageAttachments(
  messageId: number
): Promise<Attachment[]> {
  try {
    // 1. 해당 메시지의 첨부파일 목록 조회
    const attachmentsResponse =
      await window.electronAPI.attachment.getByMessage(messageId);

    if (!attachmentsResponse.success || !attachmentsResponse.data.length) {
      return [];
    }

    // 2. 메시지 상세 정보 가져오기
    const messageResponse = await window.electronAPI.email.getDetail(messageId);
    if (!messageResponse.success) {
      console.error("메시지 정보를 가져오는데 실패했습니다.", messageResponse);
      return [];
    }

    const messageDetails = messageResponse.data;

    // 3. 각 첨부파일을 UI에서 사용할 수 있는 형식으로 변환
    return attachmentsResponse.data.map((attachment) =>
      mapApiAttachmentToUi(attachment, messageDetails)
    );
  } catch (error) {
    console.error("첨부파일 가져오기 실패:", error);
    return [];
  }
}

// 모든 메시지에서 첨부파일 가져오기
export async function getAllAttachments(
  accountId: number
): Promise<Attachment[]> {
  try {
    // 1. 모든 폴더 가져오기
    const foldersResponse =
      await window.electronAPI.email.getFolders(accountId);
    if (!foldersResponse.success) {
      throw new Error("폴더 목록을 가져오는데 실패했습니다.");
    }

    const attachments: Attachment[] = [];

    // 2. 각 폴더에서 이메일 가져오기
    for (const folder of foldersResponse.data) {
      const emailsResponse = await window.electronAPI.email.getEmails({
        accountId,
        folderName: folder.name,
        limit: 100,
        offset: 0,
        sort: "sent_at",
        order: "DESC",
      });

      if (!emailsResponse.success) continue;

      // 3. 각 이메일에서 첨부파일 가져오기
      for (const email of emailsResponse.data) {
        if (email.hasAttachments) {
          const messageAttachments = await getMessageAttachments(
            email.messageId
          );
          attachments.push(...messageAttachments);
        }
      }
    }

    return attachments;
  } catch (error) {
    console.error("모든 첨부파일 가져오기 실패:", error);
    return [];
  }
}

// 첨부파일 다운로드
export async function downloadAttachment(
  attachmentId: number,
  filename: string
): Promise<string | null> {
  try {
    // 1. 저장 경로 선택 대화상자 (일렉트론 API를 통해 구현 필요)
    // 이 부분은 일렉트론에서 dialog API를 사용해야 하지만, 지금은 간단하게 만들어둡니다
    const savePath = `/downloads/${filename}`;

    // 2. 다운로드 실행
    const result = await window.electronAPI.attachment.download(
      attachmentId,
      savePath
    );

    if (result.success) {
      return result.data.path;
    }

    return null;
  } catch (error) {
    console.error("첨부파일 다운로드 실패:", error);
    return null;
  }
}

// 첨부파일 미리보기를 위한 콘텐츠 가져오기
export async function getAttachmentPreview(attachmentId: number): Promise<{
  content: Buffer;
  mimeType: string;
  filename: string;
} | null> {
  try {
    const result = await window.electronAPI.attachment.getContent(attachmentId);

    if (result.success) {
      return {
        content: result.data.content,
        mimeType: result.data.mimeType,
        filename: result.data.filename,
      };
    }

    return null;
  } catch (error) {
    console.error("첨부파일 미리보기 가져오기 실패:", error);
    return null;
  }
}

// 첨부파일 검색
export function searchAttachments(
  attachments: Attachment[],
  searchTerm: string
): Attachment[] {
  if (!searchTerm.trim() || !attachments || !Array.isArray(attachments))
    return attachments || [];

  const lowerSearchTerm = searchTerm.toLowerCase();

  return attachments.filter(
    (attachment) =>
      attachment.filename.toLowerCase().includes(lowerSearchTerm) ||
      attachment.contactName.toLowerCase().includes(lowerSearchTerm) ||
      attachment.contactEmail.toLowerCase().includes(lowerSearchTerm) ||
      attachment.messageSubject.toLowerCase().includes(lowerSearchTerm)
  );
}
