export interface EmailSyncResponse {
  success: boolean;
  syncedCount: number; // 실제로 연동되어 DB저장에 성공한 동기화 이메일 수
  totalAvailable: number;
  processedCount: number; //처리를 시도한 동기화 이메일 수
  skippedCount: number;
  folderName: string;
  folderId: number;
  errors: undefined;
  skippedMessages: undefined;
}

export interface FolderResponse {
  folderId: number; // 폴더 ID
  accountId: number; // 계정 ID
  name: string; // 폴더 이름
  type: "system" | "custom"; // 폴더 타입(system 또는 custom)
  messagesTotal: number; // 총 메시지 수
  createdAt: string; // 생성 시간
}

export interface Folder {
  name: string;
  color: string;
}

export interface ReplyData {
  to: string | null;
  title: string | null;
  body: string | null;
  attachments: DetailAttachment[] | null;
}

export interface Attachment {
  filename: string;
  mimeType: string;
}

export interface DetailAttachment {
  attachmentId: number; // 첨부파일 ID
  messageId: number; // 메시지 ID
  filename: string; // 파일명
  mimeType: string; // MIME 타입
  path: string; // 저장 경로
  size: number; // 파일 크기(바이트)
  createdAt: string; // 저장 시간
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

export interface EmailSearchFiltersParams {
  accountId: number;
  folderName: string;
  from?: string[]; // 선택: 보낸 사람 필터링
  to?: string[]; // 선택: 받는 사람 필터링
  subject?: string[]; // 선택: 제목 필터링
  includeKeywords?: string[]; // 선택: 본문에서 포함할 키워드
  excludeKeywords?: string[]; // 선택: 본문에서 제외할 키워드
  startDate?: string; // 선택: 조회 시작 날짜
  endDate?: string; // 선택: 조회 종료 날짜
  limit: number; // 선택: 조회 개수 제한 (기본값: 50)
  offset: number; // 선택: 조회 시작 위치 (기본값: 0)
  sort: "sent_at" | "created_at"; // 선택: 정렬 기준 (기본값: "sent_at")
  order: "DESC" | "ASC"; // 선택: 정렬 방향 (기본값: "DESC")
}

export interface AllEmails {
  messageId: number; // 메시지 ID
  externalMessageId: string; // 외부 메시지 ID
  threadId: string; // 스레드 ID
  accountId: number; // 계정 ID
  folderId: number; // 폴더 ID
  folderName: string; // 폴더 이름
  fromEmail: string; // 발신자 이메일
  fromName: string; // 발신자 이름
  subject: string; // 제목
  snippet: string; // 내용 미리보기
  sentAt: string; // 발송 시간
  receivedAt: string; // 수신 시간
  isRead: boolean; // 읽음 상태
  isFlagged: boolean; // 플래그 상태
  hasAttachments: boolean; // 첨부파일 여부
  attachmentCount: number; // 첨부파일 개수
  summary?: string; // 요약 정보
}

export interface EmailSummary {
  id: number;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  attachments: { filename: string; mimeType: string }[];
  isRead: boolean;
  labelIds: string[];
}

export interface EmailDetail {
  messageId: number; // 메시지 ID
  externalMessageId: string; // 외부 메시지 ID
  threadId: string; // 스레드 ID
  accountId: number; // 계정 ID
  folderId: number; // 폴더 ID
  folderName: string; // 폴더 이름
  fromEmail: string; // 발신자 이메일
  fromName: string; // 발신자 이름
  subject: string; // 제목
  snippet: string; // 내용 미리보기
  bodyText: string; // 본문 텍스트 (HTML이 아닌 일반 텍스트)
  bodyHtml: string; // 본문 HTML (HTML 형식)
  sentAt: string; // 발송 시간
  receivedAt: string; // 수신 시간
  isRead: boolean; // 읽음 상태 (상세 조회 시 자동으로 true로 변경)
  isFlagged: boolean; // 플래그 상태
  hasAttachments: boolean; // 첨부파일 여부
  summary?: string; // 요약 정보
  contacts?: Contact[]; // 연락처 정보 (선택적)
  attachments?: DetailAttachment[]; // 첨부파일 정보 (선택적)
}

export interface Contact {
  contactId: number;
  email: string;
  name: string;
  createdAt: string;
  lastSeenAt: string;
}

// 임시로 상세 메일로 변경
export interface EmailDetailByThreadId {
  contact: Contact;
  messages: EmailDetail[];
}

export interface EmailSendRequestData {
  accountId: number;
  to: string[]; // 받는 사람 이메일 주소 배열
  cc: string[]; // 참조 이메일 주소 배열
  bcc: string[]; // 숨은 참조 이메일 주소 배열
  title: string;
  body: string;
  attachments: DetailAttachment[];
  threadId: string | null; // 답장 시 원본 이메일의 threadId  새 메일 작성 시에는 null
  inReplyTo: string | null; // 답장 시 원본 이메일의 id (Message-ID 헤더)  새 메일 작성 시에는 null
  references: string[]; // References 헤더에 포함할 Message-ID 목록  (이전 대화 스레드 추적용)
}

export interface GenerateEmailContentRequest {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    topK: number;
    topP: number;
  };
}

export interface MailFormWithAIProps {
  sender: string[];
  addSender: (e: React.FormEvent) => void;
  deleteSender: (email: string) => void;
  cc: string[];
  addCc: (e: React.FormEvent) => void;
  deleteCc: (email: string) => void;
  bcc: string[];
  addBcc: (e: React.FormEvent) => void;
  deleteBcc: (email: string) => void;
  initialHtml: string;
  setHtml: (html: string) => void;
}
