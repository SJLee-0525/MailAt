export {}; // ← 이 파일을 모듈로 취급하게 함

import {
  User,
  CreateAccountRequest,
  CreateAccountResponse,
} from "@/types/user";

import {
  EmailSyncResponse,
  FolderResponse,
  EmailSearchFiltersParams,
  AllEmails,
  EmailDetail,
  EmailSendRequestData,
  EmailSearchFilters,
  EmailDetailByThreadId,
} from "@/types/emailTypes";

import { RawNode, GraphEmail, GraphIpcResponse } from "@/types/graphType";

import { AttachmentInfo } from "@/types/attachmentTypes";

// ① 전역으로 노출할 API 시그니처를 기술
interface ElectronAPI {
  // 사용자 관련 API
  user: {
    // 사용자 추가
    create({
      username,
    }: {
      username: string;
    }): Promise<{ success: boolean; data: User }>;

    // 사용자 조회
    get(userId: number): Promise<{ success: boolean; data: User }>;

    // 사용자 수정
    update(
      userId: number,
      { username }: { username: string }
    ): Promise<{
      success: boolean;
      data: User;
    }>;

    // 사용자 삭제
    delete(userId: number): Promise<{ success: boolean }>;
  };

  // 계정 관련 API
  account: {
    // 이메일 계정 등록
    create(
      accountData: CreateAccountRequest
    ): Promise<{ success: boolean; data: CreateAccountResponse[] }>;

    // 등록된 이메일 계정 목록 조회
    getAll(): Promise<{ success: boolean; data: CreateAccountResponse[] }>;

    // 등록된 이메일 계정 삭제
    delete(accountId: number): Promise<{ success: boolean }>;
  };

  // IMAP 관련 API
  imap: {
    // 최신 이메일 동기화
    syncLatest(accountId: number): Promise<{
      success: boolean;
      data: any;
    }>;

    // 특정 폴더 동기화
    syncFolder({
      accountId,
      folderName,
      limit,
    }: {
      accountId: number;
      folderName: string;
      limit?: number;
    }): Promise<{
      success: boolean;
      data: any;
    }>;

    // IMAP 연결 테스트
    test(config: any): Promise<{
      success: boolean;
      data: any;
    }>;
  };

  // 첨부파일 관련 API 추가
  attachment: {
    // 첨부파일 정보 조회
    getInfo(attachmentId: number): Promise<{
      success: boolean;
      data: AttachmentInfo;
    }>;

    // 첨부파일 내용 조회
    getContent(attachmentId: number): Promise<{
      success: boolean;
      data: AttachmentInfo & { content: Buffer };
    }>;

    // 메시지의 모든 첨부파일 목록 조회
    getByMessage(messageId: number): Promise<{
      success: boolean;
      data: AttachmentInfo[];
    }>;

    // 첨부파일 다운로드
    download(
      attachmentId: number,
      savePath: string
    ): Promise<{
      success: boolean;
      data: {
        filename: string;
        size: number;
        path: string;
      };
    }>;

    // 본문 내용으로 첨부파일 검색
    searchByContent(params: {
      accountId: number;
      keyword: string;
      limit?: number;
      offset?: number;
    }): Promise<{
      success: boolean;
      data?: {
        keyword: string;
        count: number;
        attachments: AttachmentInfo[];
      };
      message?: string;
    }>;
  };

  // 이메일 관련 API
  email: {
    // 폴더 목록 조회
    getFolders(accountId: number): Promise<{
      success: boolean;
      data: FolderResponse[];
    }>;

    // 이메일 전체 조회
    getEmails(params: EmailSearchFiltersParams): Promise<{
      success: boolean;
      data: AllEmails[];
    }>;

    // 이메일 상세 조회
    getDetail(messageId: number): Promise<{
      success: boolean;
      data: EmailDetail;
    }>;

    // 나와 상대간의 전체 이메일 스레드 요약 조회
    getThreads(params: {
      contactId: number;
      limit: number;
      offset: number;
    }): Promise<{
      success: boolean;
      data: EmailDetailByThreadId[];
    }>;

    // 스레드 id로 이메일 전체 조회
    getThreadsByEmail(params: {
      accountId: number | null;
      email: string | null;
      limit?: number;
      offset?: number;
    }): Promise<{
      success: boolean;
      data: EmailDetailByThreadId;
    }>;

    // 이메일 삭제
    delete(messageId: number): Promise<{
      success: boolean;
      data: { success: boolean; messageId: number };
    }>;

    // 읽음 표시
    markAsRead({
      messageId,
      isRead,
    }: {
      messageId: number;
      isRead: boolean;
    }): Promise<{
      success: boolean;
      data: { success: boolean; messageId: number; isRead: boolean };
    }>;
  };

  // 이메일 싱크
  imap: {
    // 이메일 싱크
    syncFolder({
      accountId,
      folderName,
      limit,
    }: {
      accountId: number;
      folderName: string;
      limit?: number;
    }): Promise<{ success: boolean; data: EmailSyncResponse }>;
  };

  // 그래프 관련
  graph: {
    // 그래프 노드 조회
    readNodePy(params: {
      C_ID: number;
      C_type: number;
      IO_type: number;
    }): Promise<{
      status: "success" | "fail";
      message: string;
      result: {
        nodes: RawNode[];
      };
    }>;

    // 그래프 메일 조회 (preload.cjs와 일치시키기 위해 readMessagePy로 변경 권장)
    readMessagePy(json_obj: {
      C_ID: number;
      C_type: number;
      IO_type: number;
      In: string[];
    }): Promise<{
      status: "success" | "fail";
      message: string;
      result: {
        emails: GraphEmail[];
      };
    }>;

    // 그래프 노드 생성
    createNodePy(json_obj: {
      C_name: string; // 새로운 카테고리 이름
    }): Promise<{ status: "success" | "fail"; message: string }>;

    // 그래프 노드 삭제
    deleteNodePy(json_obj: {
      C_ID: number; // 삭제할 노드 ID
      C_type: number; // 삭제할 노드 타입
    }): Promise<GraphIpcResponse>;

    // 그래프 노드 이름 수정
    renameNodePy(json_obj: {
      C_ID: number; // 노드 ID
      C_type: number; // 노드 타입
      after_name: string; // 노드 새 이름
    }): Promise<GraphIpcResponse>;

    // 그래프 노드 병합
    mergeNodePy(json_obj: {
      C_ID1: number;
      C_type1: number;
      C_ID2: number;
      C_type2: number;
      after_name: string;
    }): Promise<GraphIpcResponse>;

    // 그래프 메일 삭제
    deleteMailPy(json_obj: {
      message_id: number; // 삭제할 메일의 ID
    }): Promise<GraphIpcResponse>;

    // 그래프 메일 이동
    moveMailPy(json_obj: {
      message_id: number;
      category_id: number;
      sub_category_id: number;
    }): Promise<GraphIpcResponse>;

    // 그래프 노드 검색
    searchByKeywordPy(json_obj: {
      keyword: string; // 검색할 키워드
    }): Promise<{
      status: "success" | "fail";
      message: string;
      result: {
        nodes: RawNode[];
      };
    }>;
  };

  calendar: {
    // 캘린더 이벤트 조회
    getEvents(params: {
      accountId: number;
      year: number;
      month: number;
    }): Promise<{
      success: boolean;
      data: CalendarEventFromAPI[];
    }>;
  };

  // 이메일 전송
  sendEmail(emailData: EmailSendRequestData): Promise<{
    success: boolean;
    messageId: number;
  }>;

  // 창 제어 API
  reloadWindow(): void;
  minimizeWindow(): void;
  toggleMaximizeWindow(): void;
  closeWindow(): void;
}

// ② Window 타입 보강
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
