import { create } from "zustand";

import { AllEmails } from "@/types/emailTypes";

interface UserProgressStore {
  bottomNavProgress: "search" | null;
  mailFormIsOpen: boolean;
  mailFormIsClosing: boolean;
  inboxIsOpen: boolean;
  inboxIsClosing: boolean;
  selectedMail: AllEmails | null;
  isReplying: boolean;
  chattingIsOpen: boolean;
  setBottomNavProgress: (progress: "search" | null) => void;
  setMailFormIsOpen: (isOpen: boolean) => void;
  setInboxIsOpen: (isOpen: boolean) => void;
  setSelectedMail: (email: AllEmails | null) => void;
  setIsReplying: (isReplying: boolean) => void;
  setChattingIsOpen: (isOpen: boolean) => void;
}

const useUserProgressStore = create<UserProgressStore>((set) => ({
  bottomNavProgress: null,
  mailFormIsOpen: false,
  mailFormIsClosing: false,
  inboxIsOpen: false,
  inboxIsClosing: false,
  selectedMail: null,
  isReplying: false,
  chattingIsOpen: false,
  setBottomNavProgress: (progress) => set({ bottomNavProgress: progress }),
  setMailFormIsOpen: (isOpen) => {
    if (isOpen) {
      set({ mailFormIsOpen: isOpen });
    } else {
      set({ mailFormIsClosing: true });

      setTimeout(() => {
        set({ mailFormIsOpen: false, mailFormIsClosing: false });
      }, 300);
    }
  },
  setInboxIsOpen: (isOpen) => {
    if (isOpen) {
      set({ inboxIsOpen: isOpen });
    } else {
      set({ inboxIsClosing: true });

      setTimeout(() => {
        set({ inboxIsOpen: false, inboxIsClosing: false, selectedMail: null });
      }, 300);
    }
  },
  setSelectedMail: (mailId) => {
    set({ selectedMail: mailId !== null ? mailId : null });
  },
  setIsReplying: (isReplying) => set({ isReplying: isReplying }),
  setChattingIsOpen: (isOpen) => set({ chattingIsOpen: isOpen }),
}));

export default useUserProgressStore;
