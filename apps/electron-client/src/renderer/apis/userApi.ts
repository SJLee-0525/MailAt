// import instance from "./instance";

import {
  User,
  // AccountsResponse,
  CreateAccountRequest,
  CreateAccountResponse,
} from "@/types/authType";

// const { VITE_DEV_API_URL } = import.meta.env;

// 사용자 추가
export const createUser = async (username: string): Promise<User> => {
  try {
    const response = await window.electronAPI.user.create({
      username,
    });
    // console.log(`[POST] window.electronAPI.user.create(${username})`, response);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 사용자 조회
export const getUser = async (
  userId: number
): Promise<{ success: boolean; data: User }> => {
  try {
    const response = await window.electronAPI.user.get(userId);
    // console.log(`[GET] window.electronAPI.user.get(${userId})`, response);
    return response;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 사용자 수정
export const updateUser = async (
  userId: number,
  username: string
): Promise<User> => {
  try {
    const response = await window.electronAPI.user.update(userId, {
      username,
    });
    // console.log(
    //   `[PUT] window.electronAPI.user.update(${userId}, ${username})`,
    //   response
    // );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 사용자 삭제
export const deleteUser = async (
  userId: number
): Promise<{ success: boolean }> => {
  try {
    const response = await window.electronAPI.user.delete(userId);
    // console.log(`[DELETE] window.electronAPI.user.delete(${userId})`, response);
    return response;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 이메일 계정 등록
export const createAccount = async (
  accountData: CreateAccountRequest
): Promise<{ success: boolean; data: CreateAccountResponse[] }> => {
  try {
    const response = await window.electronAPI.account.create(accountData);
    // console.log(
    //   `[POST] window.electronAPI.account.create(${JSON.stringify(
    //     accountData
    //   )})`,
    //   response
    // );
    return response;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 등록된 이메일 계정 목록 조회
export const getAccounts = async (): Promise<CreateAccountResponse[]> => {
  try {
    const response = await window.electronAPI.account.getAll();
    // console.log(`[GET] window.electronAPI.account.getAll()`, response);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};

// 등록된 이메일 계정 삭제
export const deleteAccount = async ({
  accountId,
}: {
  accountId: number;
}): Promise<{ success: boolean }> => {
  try {
    const response = await window.electronAPI.account.delete(accountId);
    // console.log(
    //   `[DELETE] window.electronAPI.account.delete(${accountId})`,
    //   response
    // );
    return response;
  } catch (error: unknown) {
    throw new Error(error as string);
  }
};
