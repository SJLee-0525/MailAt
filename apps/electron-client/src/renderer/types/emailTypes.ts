export interface ReplyData {
  to: string | null;
  title: string | null;
  body: string | null;
  attachments: DetailAttachment[] | null;
}

export interface Attachment {
  filename: string;
  mimeType: string;
  size: number;
}

export interface DetailAttachment {
  filename: string;
  mimeType: string;
  size: number; // 바이트 단위
  attachmentId: string; // 필요하면 포함
}

export interface EmailSearchFilters {
  from?: string[]; // 보낸사람 검색 (부분 일치, 대소문자 무시)
  to?: string[]; // 받는사람 검색 (부분 일치)
  subject?: string[]; // 제목 검색 (부분 일치)
  includeKeywords?: string[]; // 본문·제목·발신/수신 모두에서 반드시 포함해야 할 키워드 배열
  excludeKeywords?: string[]; // 본문·제목·발신/수신 모두에서 반드시 제외해야 할 키워드 배열
  attachmentSize?: number; // 첨부파일 중 하나라도 이 크기(바이트) 이상인 이메일만
  startDate?: Date; // 날짜 필터: 이 날짜 이후(포함)
  endDate?: Date; // 날짜 필터: 이 날짜 이전(포함)
}

export interface AllEmails {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  attachments: Attachment[];
  isRead: boolean;
  labelIds: string[];
}

export interface EmailDetail {
  id: string;
  threadId: string;
  labelIds: string[];
  subject: string;
  from: string;
  to: string;
  date: string;
  internalDate: string;
  snippet: string;
  body: string;
  attachments: DetailAttachment[];
}

export interface EmailSendRequestData {
  to: string[];
  cc: string[];
  bcc: string[];
  title: string;
  body: string;
  attachments: DetailAttachment[];
  threadId: string | null; // 답장일 경우 원래 이메일의 threadId
  inReplyTo: string | null; // 답장일 경우 원래 이메일의 id
  references: string[];
}
