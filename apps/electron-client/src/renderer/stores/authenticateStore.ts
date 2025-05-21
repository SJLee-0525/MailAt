import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware"; // StateStorage 추가

import { User, CreateAccountResponse } from "@/types/authType";

interface AuthenticateStore {
  user: User | null;
  setUserName: (userData: User | null) => void;
  deleteUser: () => void;
  authUsers: CreateAccountResponse[];
  setAuthUsers: (authUsers: CreateAccountResponse[]) => void;
  deleteAuthUser: (authUsers: CreateAccountResponse | null) => void;
  selectedUser: CreateAccountResponse | null;
  setSelectedUser: (user: CreateAccountResponse | null) => void;
  currentTheme: string;
  setCurrentTheme: (themeClass: string) => void;
}

// 실제로 persist될 상태의 타입 정의
type PersistedAuthState = Pick<AuthenticateStore, "user" | "currentTheme">;

const useAuthenticateStore = create<AuthenticateStore>()(
  persist(
    (set) => ({
      user: null, // 초기값
      setUserName: (userData: User | null) => set({ user: userData }),
      deleteUser: () => {
        set({ user: null });
        localStorage.removeItem("authenticate-storage"); // 로컬 스토리지에서 키를 완전히 제거
      },
      authUsers: [],
      setAuthUsers: (users) => set({ authUsers: users }),
      selectedUser: null,
      deleteAuthUser: (user) =>
        set((state) => ({
          authUsers: state.authUsers.filter(
            (authUser) => authUser.accountId !== user?.accountId
          ),
        })),
      setSelectedUser: (user) =>
        set({ selectedUser: user !== null ? user : null }),
      currentTheme: "", // Default to light theme (empty class string)
      setCurrentTheme: (themeClass: string) => {
        set({ currentTheme: themeClass });
        document.documentElement.className = themeClass;
      },
    }),
    {
      name: "authenticate-storage", // 로컬 스토리지에 저장될 키 이름
      storage: createJSONStorage(() => localStorage), // 사용할 스토리지
      // partialize 함수의 반환 타입을 명시적으로 지정
      partialize: (state): PersistedAuthState => ({
        user: state.user, // persist할 상태
        currentTheme: state.currentTheme,
      }),
    }
  )
);

export default useAuthenticateStore;
