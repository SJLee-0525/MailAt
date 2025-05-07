import instance from "./instance";

import { AllEmails, EmailConversation } from "@/types/emailTypes";

const { VITE_DEV_API_URL } = import.meta.env;

export const getEmailsData = async (userId: string): Promise<AllEmails[]> => {
  try {
    const response = await instance.get(`/emails?accountId=${userId}`);
    console.log(`${VITE_DEV_API_URL}/emails?accountId=${userId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

export const getDetailEmail = async (
  emailId: number
): Promise<EmailConversation> => {
  try {
    const response = await instance.get(`/emails/${emailId}`);
    console.log(`${VITE_DEV_API_URL}/emails/${emailId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};
