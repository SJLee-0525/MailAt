// import instance from "./instance";

import {
  FolderResponse,
  AllEmails,
  // EmailSummary,
  EmailDetail,
  EmailSendRequestData,
  EmailSearchFilters,
  EmailDetailByThreadId,
} from "@/types/emailTypes";

import {
  // buildFilterQueryString,
  getEmailParams,
} from "@utils/getEmailData";

// const { VITE_DEV_API_URL } = import.meta.env;

// 폴더 목록 조회
export const getFolders = async ({
  accountId,
}: {
  accountId: number | null;
}): Promise<FolderResponse[]> => {
  if (!accountId) {
    throw new Error("Account ID is required to fetch folders.");
  }

  try {
    const response = await window.electronAPI.email.getFolders(accountId);
    console.log(
      `[GET] window.electronAPI.email.getFolders(${accountId})`,
      response
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 이메일 전체 조회
export const getEmailsData = async ({
  userId,
  folderName,
  filters,
  limit,
  offset,
}: {
  userId: number | null;
  folderName: string | null;
  filters: EmailSearchFilters;
  limit: number;
  offset: number;
}): Promise<AllEmails[]> => {
  if (!userId) {
    throw new Error("User ID is required to fetch emails.");
  }

  const params = getEmailParams({
    userId,
    folderName: folderName || "INBOX",
    filters,
    limit,
    offset,
  });

  // const qs = buildFilterQueryString(userId, folderName, filters);
  // const url = `/emails?${qs}`;

  try {
    const response = await window.electronAPI.email.getEmails(params);
    console.log(
      `[GET] window.electronAPI.email.getEmails(${params})`,
      response
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 이메일 상세 조회
export const getDetailEmail = async (
  messageId: number
): Promise<EmailDetail> => {
  try {
    const response = await window.electronAPI.email.getDetail(messageId);
    console.log(
      `[GET] window.electronAPI.email.getDetail(${messageId})`,
      response
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 나와 상대간의 전체 이메일 스레드 요약 조회
export const getEmailSummaryByThreadId = async ({
  contactId,
  limit = 20,
  offset = 0,
}: {
  contactId: number | null;
  limit?: number;
  offset?: number;
}): Promise<EmailDetailByThreadId[]> => {
  if (!contactId) {
    throw new Error("Contact ID is required to fetch email thread summary.");
  }

  const params = {
    contactId,
    limit,
    offset,
  };

  try {
    const response = await window.electronAPI.email.getThreads(params);
    console.log(
      `[GET] window.electronAPI.email.getThreads(${params})`,
      response
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 스레드 id로 이메일 전체 조회
export const getEmailsByThreadId = async ({
  accountId,
  email,
  limit = 20,
  offset = 0,
}: {
  accountId: number | null;
  email: string | null;
  limit?: number;
  offset?: number;
}): Promise<EmailDetailByThreadId> => {
  if (!accountId) {
    throw new Error("User ID is required to fetch emails.");
  }

  const params = {
    accountId,
    email: email,
    limit: limit ? limit : 20,
    offset: offset ? offset : 0,
  };

  try {
    const response = await window.electronAPI.email.getThreadsByEmail(params);
    console.log(
      `[GET]121321312 window.electronAPI.email.getThreadsByEmail(${params})`,
      response
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 이메일 삭제
export const deleteEmail = async ({
  messageId,
}: {
  messageId: number;
}): Promise<{ success: boolean; messageId: number }> => {
  try {
    const response = await window.electronAPI.email.delete(messageId);
    console.log(
      `[DELETE] window.electronAPI.email.delete(${messageId})`,
      response
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 읽음 표시
export const markEmailAsRead = async (
  messageId: number,
  isRead: boolean
): Promise<{
  success: boolean;
  messageId: number;
  isRead: boolean;
}> => {
  try {
    const response = await window.electronAPI.email.markAsRead({
      messageId,
      isRead,
    });
    console.log(
      `[PATCH] window.electronAPI.email.markAsRead(${messageId}, ${isRead})`,
      response
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 이메일 전송
export const sendEmail = async (
  emailData: EmailSendRequestData
): Promise<{ success: boolean; messageId: number }> => {
  try {
    const response = await window.electronAPI.sendEmail(emailData);
    console.log(
      `[POST] window.electronAPI.sendEmail(${JSON.stringify(emailData)})`,
      response
    );
    return response;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};
