import React from "react";
import { create } from "zustand";

interface ModalState {
  // isOpen: 모달이 열려있는지 여부, isClosing: 모달이 닫히는 중인지 여부, modalContent: 모달에 렌더링할 컴포넌트트, openModal: 모달 열기 함수, closeModal: 모달 닫기 함수
  isOpen: boolean;
  isClosing: boolean;
  modalContent: React.ReactNode | null;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
}

const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  isClosing: false,
  modalContent: null,
  openModal: (content) => set({ isOpen: true, modalContent: content }),
  closeModal: () => {
    set({ isClosing: true });

    setTimeout(() => {
      set({ isClosing: false, isOpen: false, modalContent: null });
    }, 300);
  },
}));

export default useModalStore;
