import "@components/common/modal/Modal.css";

import { useRef, useEffect } from "react";

import useUserProgressStore from "@stores/userProgressStore";

import MailCreateForm from "@components/mailForm/MailCreateForm";

const NewMailFormModal = () => {
  const { mailFormIsOpen, mailFormIsClosing, setMailFormIsOpen } =
    useUserProgressStore();

  const dialog = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (mailFormIsClosing) return;

    if (mailFormIsOpen && dialog.current) {
      dialog.current.showModal();
    } else if (!mailFormIsOpen && dialog.current) {
      dialog.current.close();
    }
  }, [mailFormIsOpen]);

  function handleBackdropClick(
    event: React.MouseEvent<HTMLDialogElement, MouseEvent>
  ) {
    if (dialog.current && event.target === dialog.current) {
      setMailFormIsOpen(false); // 모달 닫기
    }
  }

  return (
    <dialog
      ref={dialog}
      onClick={handleBackdropClick}
      onClose={() => setMailFormIsOpen(false)}
      className={`fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-1/2 min-w-[480px] h-full rounded-xl ${mailFormIsClosing ? "is-closing" : ""}`}
    >
      <MailCreateForm />
    </dialog>
  );
};

export default NewMailFormModal;
