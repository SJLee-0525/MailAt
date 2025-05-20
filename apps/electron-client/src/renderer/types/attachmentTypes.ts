// src/types/attachmentTypes.ts
export interface AttachmentInfo {
  attachmentId: number;
  messageId: number;
  filename: string;
  mimeType: string;
  path: string;
  size: number;
  createdAt?: string;
  messageSubject?: string;
  fromEmail?: string;
  fromName?: string;
  contactName?: string;
  contactEmail?: string;
  folderName?: string;
}

export interface Attachment {
  id: number | string;
  filename: string;
  mimeType: string;
  size: number;
  path?: string | null;
  contactName: string;
  contactEmail: string;
  messageSubject: string;
  messageId: number;
  createdAt: string;
}

export interface DateGroup {
  date: string;
  attachments: Attachment[];
}

export interface ContactGroup {
  contactName: string;
  contactEmail: string;
  attachments: Attachment[];
}

export interface FileTypeGroup {
  type: string;
  label: string;
  attachments: Attachment[];
}
