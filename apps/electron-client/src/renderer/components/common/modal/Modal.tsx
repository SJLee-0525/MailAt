import "@components/common/modal/Modal.css";

import { useRef, useEffect } from "react";

import useModalStore from "@stores/modalStore.ts";

const Modal = () => {
  const { isOpen, isClosing, modalContent, closeModal } = useModalStore();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isClosing) return; // 모달이 닫히는 중이면 아무것도 하지 않음

    if (isOpen && dialog.current) {
      dialog.current.showModal(); // 모달 열기
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && dialog.current) {
      dialog.current.close(); // 모달 닫기 (isClosing 애니메이션 후)
    }
  }, [isOpen]);

  function handleBackdropClick(
    event: React.MouseEvent<HTMLDialogElement, MouseEvent>
  ) {
    if (dialog.current && event.target === dialog.current) {
      closeModal();
    }
  }

  return (
    <dialog
      ref={dialog}
      onClick={handleBackdropClick}
      onClose={closeModal}
      className={`fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-1/4 min-w-[480px] h-fit max-h-full rounded-b-xl bg-transparent ${isClosing ? "is-closing" : ""}`}
    >
      {modalContent}
    </dialog>
  );
};

export default Modal;
