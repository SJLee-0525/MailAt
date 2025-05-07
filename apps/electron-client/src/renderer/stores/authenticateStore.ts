import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware"; // StateStorage 추가

import { AuthUser } from "@/types/authType";

interface AuthenticateStore {
  userName: string | null;
  setUserName: (name: string) => void;
  authUsers: AuthUser[];
  setAuthUsers: (authUsers: AuthUser) => void;
  deleteAuthUser: (authUsers: AuthUser | null) => void;
  selectedUser: AuthUser | null;
  setSelectedUser: (user: AuthUser | null) => void;
}

// 실제로 persist될 상태의 타입 정의
type PersistedAuthState = Pick<AuthenticateStore, "userName">;

const useAuthenticateStore = create<AuthenticateStore>()(
  // create 함수에만 기본 상태 타입 지정
  persist(
    (set) => ({
      userName: null, // 초기값
      setUserName: (name) => set({ userName: name }),
      authUsers: [],
      setAuthUsers: (newUser) =>
        set((state) => ({ authUsers: [...state.authUsers, newUser] })),
      selectedUser: { id: 1, email: "hong.jiwoo@example.com", name: "홍지우" },
      deleteAuthUser: (user) =>
        set((state) => ({
          authUsers: state.authUsers.filter(
            (authUser) => authUser.id !== user?.id
          ),
        })),
      setSelectedUser: (user) =>
        set({ selectedUser: user !== null ? user : null }),
    }),
    {
      name: "authenticate-storage", // 로컬 스토리지에 저장될 키 이름
      storage: createJSONStorage(() => localStorage), // 사용할 스토리지
      // partialize 함수의 반환 타입을 명시적으로 지정
      partialize: (state): PersistedAuthState => ({
        userName: state.userName,
      }),
    }
  )
);

export default useAuthenticateStore;
