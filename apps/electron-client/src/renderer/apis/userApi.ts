import instance from "./instance";

import {
  User,
  AccountsResponse,
  CreateAccountRequest,
  CreateAccountResponse,
} from "@/types/authType";

const { VITE_DEV_API_URL } = import.meta.env;

// 사용자 추가
export const createUser = async (username: string): Promise<User> => {
  try {
    // const response = await instance.post(`/user`, {
    //   username,
    // });

    const reponsne = await window.electronAPI.account.create({
      username,
    });
    console.log(`[POST] ${VITE_DEV_API_URL}/user`, username);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 사용자 조회
export const getUser = async (userId: string): Promise<User> => {
  try {
    const response = await instance.get(`/user/${userId}`);
    console.log(`[GET] ${VITE_DEV_API_URL}/user/${userId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 사용자 수정
export const updateUser = async (
  userId: string,
  username: string
): Promise<User> => {
  try {
    const response = await instance.patch(`/user/${userId}`, {
      username,
    });
    console.log(`[PATCH] ${VITE_DEV_API_URL}/user/${userId}`, username);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 사용자 삭제
export const deleteUser = async (
  userId: string
): Promise<{ success: boolean }> => {
  try {
    const response = await instance.delete(`/user/${userId}`);
    console.log(`[DELETE] ${VITE_DEV_API_URL}/user/${userId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 계정 추가
export const createAccount = async (
  payload: CreateAccountRequest
): Promise<CreateAccountResponse> => {
  try {
    const response = await instance.post(`/accounts`, payload);
    console.log(`[POST] ${VITE_DEV_API_URL}/accounts`, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 계정 목록 조회
export const getAccounts = async (): Promise<AccountsResponse[]> => {
  try {
    const response = await instance.get(`/accounts`);
    console.log(`[GET] ${VITE_DEV_API_URL}/accounts`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 계정 삭제
export const deleteAccount = async ({
  accountId,
}: {
  accountId: number;
}): Promise<{ success: boolean }> => {
  try {
    const response = await instance.delete(`/accounts/${accountId}`);
    console.log(`[DELETE] ${VITE_DEV_API_URL}/accounts/${accountId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};
