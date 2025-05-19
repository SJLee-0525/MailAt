export {}; // ← 이 파일을 모듈로 취급하게 함

import {
  User,
  CreateAccountRequest,
  CreateAccountResponse,
} from "@/types/user";

import {
  FolderResponse,
  EmailSearchFiltersParams,
  AllEmails,
  EmailDetail,
  EmailSendRequestData,
  EmailSearchFilters,
  EmailDetailByThreadId,
} from "@/types/emailTypes";

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

  // 이메일 전송
  sendEmail(emailData: EmailSendRequestData): Promise<{
    success: boolean;
    messageId: number;
  }>;
}

// ② Window 타입 보강
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
