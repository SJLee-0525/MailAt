// src/apis/attachmentApi.ts
import { Attachment, AttachmentInfo } from "@/types/attachmentTypes";
import { mapApiAttachmentToUi } from "@/utils/getAttachmentData";

// 검색 파라미터 타입
export interface ContentSearchParams {
  accountId: number;
  keyword: string;
  limit?: number;
  offset?: number;
}

// 검색 결과 타입
export interface ContentSearchResult {
  keyword: string;
  count: number;
  attachments: Attachment[];
}

/**
 * 이메일 본문 내용으로 첨부파일 검색
 */
export const searchAttachmentsByContent = async (
  params: ContentSearchParams
): Promise<ContentSearchResult> => {
  try {
    const response =
      await window.electronAPI.attachment.searchByContent(params);

    if (!response.success || !response.data) {
      throw new Error(response.message || "첨부파일 검색 실패");
    }

    // API 응답을 Attachment 타입으로 변환
    const attachments = response.data.attachments.map((item: AttachmentInfo) =>
      mapApiAttachmentToUi(item, {
        fromName: item.fromName || "",
        fromEmail: item.fromEmail || "",
        subject: item.messageSubject || "",
        receivedAt: item.createdAt || new Date().toISOString(),
      })
    );

    console.log("이메일 본문으로 검색한", attachments);
    return {
      keyword: response.data.keyword,
      count: response.data.count,
      attachments,
    };
  } catch (error) {
    console.error("이메일 본문 검색 실패:", error);
    throw error;
  }
};
