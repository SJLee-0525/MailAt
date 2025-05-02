import { create } from "zustand";

import { AuthUser } from "@/types/authType";

interface AuthenticateStore {
  authUsers: AuthUser[];
  setAuthUsers: (authUsers: AuthUser) => void;
  selectedUser: AuthUser | null;
  setSelectedUser: (user: AuthUser | null) => void;
}

const useAuthenticateStore = create<AuthenticateStore>((set) => ({
  authUsers: [
    { id: 1, email: "hong.jiwoo@example.com", name: "홍지우" },
    { id: 2, email: "hong.2iwoo@example.com", name: "홍2우" },
  ],
  setAuthUsers: (newUser) =>
    set((state) => ({ authUsers: [...state.authUsers, newUser] })),
  selectedUser: { id: 1, email: "hong.jiwoo@example.com", name: "홍지우" },
  setSelectedUser: (user) => set({ selectedUser: user !== null ? user : null }),
}));

export default useAuthenticateStore;
