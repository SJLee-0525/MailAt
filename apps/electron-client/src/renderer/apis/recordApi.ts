import instance from "./instance";

import { EmailConversation } from "@/types/emailTypes";

const { VITE_DEV_API_URL } = import.meta.env;

export const getUserRecordList = async (
  userId: string
): Promise<EmailConversation[]> => {
  try {
    const response = await instance.get(`/record/users/${userId}`);
    console.log(`${VITE_DEV_API_URL}/record/users/${userId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

export const getDetailEmail = async (
  emailId: number
): Promise<EmailConversation> => {
  try {
    const response = await instance.get(`/record/email/${emailId}`);
    console.log(`${VITE_DEV_API_URL}/record/email/${emailId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};
