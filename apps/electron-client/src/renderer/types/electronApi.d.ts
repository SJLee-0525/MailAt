export {}; // ← 이 파일을 모듈로 취급하게 함

import { User } from "@/types/user"; // User 타입을 가져옵니다.

// ① 전역으로 노출할 API 시그니처를 기술
interface ElectronAPI {
  user: {
    create({
      username,
    }: {
      username: string;
    }): Promise<{ success: boolean; data: User }>;
    get(userId: number): Promise<{ success: boolean; data: User }>;
    update(
      userId: number,
      { username }: { username: string }
    ): Promise<{
      success: boolean;
      data: User;
    }>;
    delete(userId: number): Promise<{ success: boolean }>;
    // 필요하면 read / update / delete 등 계속 추가
  };
  // 계좌 · SMTP 등 다른 네임스페이스도 추가 가능
}

// ② Window 타입 보강
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
