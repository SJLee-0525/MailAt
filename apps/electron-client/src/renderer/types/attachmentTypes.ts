export interface AttachmentInfo {
  attachmentId: number;
  messageId: number;
  filename: string;
  mimeType: string;
  path: string | null;
  size: number;
}
