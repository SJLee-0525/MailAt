import instance from "./instance";

import {
  AllEmails,
  EmailDetail,
  EmailSendRequestData,
} from "@/types/emailTypes";

const { VITE_DEV_API_URL } = import.meta.env;

// 이메일 전체 조회
export const getEmailsData = async (userId: string): Promise<AllEmails[]> => {
  try {
    const response = await instance.get(`/emails?accountId=${userId}`);
    console.log(`[GET] ${VITE_DEV_API_URL}/emails?accountId=${userId}`);
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
export const deleteEmail = async (
  emailId: number
): Promise<{ success: boolean }> => {
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
