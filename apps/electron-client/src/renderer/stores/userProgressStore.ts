import { create } from "zustand";

import { AllEmails } from "@/types/emailTypes";

interface UserProgressStore {
  bottomNavProgress: "search" | null;
  mailFormIsOpen: boolean;
  mailFormIsClosing: boolean;
  calendarIsOpen: boolean;
  calendarIsClosing: boolean;
  inboxIsOpen: boolean;
  inboxIsClosing: boolean;
  selectedMail: AllEmails | null;
  selectedMailIsClosing: boolean;
  isReplying: boolean;
  chattingIsOpen: boolean;
  chattingIsClosing: boolean;
  setBottomNavProgress: (progress: "search" | null) => void;
  setMailFormIsOpen: (isOpen: boolean) => void;
  setInboxIsOpen: (isOpen: boolean) => void;
  setCalendarIsOpen: (isOpen: boolean) => void;
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
  calendarIsOpen: false,
  calendarIsClosing: false,
  selectedMail: null,
  selectedMailIsClosing: false,
  isReplying: false,
  chattingIsOpen: false,
  chattingIsClosing: false,
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
  setCalendarIsOpen: (isOpen) => {
    if (isOpen) {
      set({ calendarIsOpen: isOpen });
    } else {
      set({ calendarIsClosing: true });

      setTimeout(() => {
        set({ calendarIsOpen: false, calendarIsClosing: false });
      }, 300);
    }
  },
  setSelectedMail: (mailId) => {
    if (mailId) {
      set({ selectedMail: mailId });
    } else {
      set({ selectedMailIsClosing: true });

      setTimeout(() => {
        set({ selectedMail: null, selectedMailIsClosing: false });
      }, 300);
    }
  },
  setIsReplying: (isReplying) => set({ isReplying: isReplying }),
  setChattingIsOpen: (isOpen) => {
    if (isOpen) {
      set({ chattingIsOpen: isOpen });
    } else {
      set({ chattingIsClosing: true });

      setTimeout(() => {
        set({ chattingIsOpen: false, chattingIsClosing: false });
      }, 300);
    }
  },
}));

export default useUserProgressStore;
