import instance from "./instance";

import {
  AllEmails,
  EmailDetail,
  EmailSendRequestData,
  EmailSearchFilters,
} from "@/types/emailTypes";

import { buildFilterQueryString } from "@utils/getEmailData";

const { VITE_DEV_API_URL } = import.meta.env;

// 폴더 목록 조회
export const getFolders = async ({
  accountId,
}: {
  accountId: number | null;
}): Promise<string[]> => {
  if (!accountId) {
    throw new Error("Account ID is required to fetch folders.");
  }

  try {
    const response = await instance.get<string[]>(`/folders/${accountId}`);
    console.log(`[GET] ${VITE_DEV_API_URL}/folders/${accountId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 이메일 전체 조회
export const getEmailsData = async ({
  userId,
  filters,
}: {
  userId: number | null;
  filters: EmailSearchFilters;
}): Promise<AllEmails[]> => {
  if (!userId) {
    throw new Error("User ID is required to fetch emails.");
  }

  const qs = buildFilterQueryString(userId, filters);
  const url = `/emails?${qs}`;

  try {
    const response = await instance.get<AllEmails[]>(url);
    console.log(`[GET] ${VITE_DEV_API_URL}${url}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 이메일 상세 조회
export const getDetailEmail = async (emailId: number): Promise<EmailDetail> => {
  try {
    const response = await instance.get(`/emails/${emailId}`);
    console.log(`[GET] ${VITE_DEV_API_URL}/emails/${emailId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 이메일 삭제
export const deleteEmail = async ({
  emailId,
}: {
  emailId: string;
}): Promise<{ success: boolean }> => {
  try {
    const response = await instance.delete(`/emails/${emailId}`);
    console.log(`[DELETE] ${VITE_DEV_API_URL}/emails/${emailId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 읽음 표시
export const markEmailAsRead = async (
  emailId: number,
  isRead: boolean
): Promise<{ success: boolean }> => {
  try {
    const response = await instance.patch(`/emails/${emailId}/read`, {
      isRead,
    });
    console.log(`[PATCH] ${VITE_DEV_API_URL}/emails/${emailId}/read`, isRead);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 이메일 전송
export const sendEmail = async (
  emailData: EmailSendRequestData
): Promise<{ success: boolean; messageId: string }> => {
  try {
    const response = await instance.post(`/emails/send`, emailData);
    console.log(`[POST] ${VITE_DEV_API_URL}/emails/send`, emailData);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};
