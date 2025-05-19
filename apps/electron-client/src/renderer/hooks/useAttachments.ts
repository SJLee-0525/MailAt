// src/hooks/useAttachments.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getAllAttachments,
  getMessageAttachments,
  downloadAttachment,
  getAttachmentPreview,
} from "../utils/getAttachmentData";

// 다운로드 매개변수 타입 정의
export interface DownloadParams {
  attachmentId: number;
  filename: string;
}

// 첨부파일 미리보기 결과 타입 정의
export interface PreviewResult {
  content: Buffer;
  mimeType: string;
  filename: string;
}

/**
 * 모든 첨부파일 가져오기 훅
 */
export function useAllAttachments(accountId: number) {
  return useQuery({
    queryKey: ["allAttachments", accountId],
    queryFn: () => getAllAttachments(accountId),
    staleTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: false,
  });
}

/**
 * 특정 메시지의 첨부파일 가져오기 훅
 */
export function useMessageAttachments(messageId: number) {
  return useQuery({
    queryKey: ["messageAttachments", messageId],
    queryFn: () => getMessageAttachments(messageId),
    enabled: !!messageId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 첨부파일 다운로드 훅
 */
export function useDownloadAttachment() {
  return useMutation({
    mutationFn: (params: DownloadParams) =>
      downloadAttachment(params.attachmentId, params.filename),
  });
}

/**
 * 첨부파일 미리보기 훅
 */
export function useAttachmentPreview() {
  return useMutation({
    mutationFn: (attachmentId: number) => getAttachmentPreview(attachmentId),
  });
}
