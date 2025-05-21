import { create } from "zustand";

interface UserProgressStore {
  isLoading: boolean;
  loadingMessage: string | null;
  bottomNavProgress: "search" | null;
  mailFormIsOpen: boolean;
  mailFormIsClosing: boolean;
  calendarIsOpen: boolean;
  calendarIsClosing: boolean;
  inboxIsOpen: boolean;
  inboxIsClosing: boolean;
  attachmentViewerIsOpen: boolean;
  attachmentViewerIsClosing: boolean; // 닫기 애니메이션 상태 추가
  graphInboxIsOpen: boolean;
  graphInboxIsClosing: boolean;
  selectedMail: { messageId: number; fromEmail: string } | null;
  selectedMailIsClosing: boolean;
  isReplying: boolean;
  chattingIsOpen: boolean;
  chattingIsClosing: boolean;
  setLoading: (isLoading: boolean) => void;
  setLoadingMessage: (loadingMessage: string | null) => void;
  setCloseLoadingMessage: () => void;
  setBottomNavProgress: (progress: "search" | null) => void;
  setMailFormIsOpen: (isOpen: boolean) => void;
  setInboxIsOpen: (isOpen: boolean) => void;
  setGraphInboxIsOpen: (isOpen: boolean) => void;
  setCalendarIsOpen: (isOpen: boolean) => void;
  setAttachmentViewerIsOpen: (isOpen: boolean) => void;
  setSelectedMail: (
    email: { messageId: number; fromEmail: string } | null
  ) => void;
  setIsReplying: (isReplying: boolean) => void;
  setChattingIsOpen: (isOpen: boolean) => void;
}

const useUserProgressStore = create<UserProgressStore>((set, get) => ({
  isLoading: false,
  loadingMessage: null,
  bottomNavProgress: null,
  mailFormIsOpen: false,
  mailFormIsClosing: false,
  inboxIsOpen: false,
  inboxIsClosing: false,
  graphInboxIsOpen: false,
  graphInboxIsClosing: false,
  calendarIsOpen: false,
  calendarIsClosing: false,
  attachmentViewerIsOpen: false,
  attachmentViewerIsClosing: false, // 닫기 애니메이션 상태 추가
  selectedMail: null,
  selectedMailIsClosing: false,
  isReplying: false,
  chattingIsOpen: false,
  chattingIsClosing: false,
  setLoading: (isLoading) => set({ isLoading }),
  setLoadingMessage: (loadingMessage) => set({ loadingMessage }),
  setCloseLoadingMessage: () => {
    setTimeout(() => {
      if (!get().isLoading) {
        set({ loadingMessage: null });
      }
    }, 3000);
  },
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
  setGraphInboxIsOpen: (isOpen) => {
    if (isOpen) {
      set({ graphInboxIsOpen: isOpen });
    } else {
      set({ graphInboxIsClosing: true });

      setTimeout(() => {
        set({ graphInboxIsOpen: false, graphInboxIsClosing: false });
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
  setAttachmentViewerIsOpen: (isOpen) => {
    if (isOpen) {
      set({ attachmentViewerIsOpen: isOpen });
    } else {
      set({ attachmentViewerIsClosing: true });

      setTimeout(() => {
        set({
          attachmentViewerIsOpen: false,
          attachmentViewerIsClosing: false,
        });
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
