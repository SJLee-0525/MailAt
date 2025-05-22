import "@components/common/modal/Alert.css";

import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";

import useModalStore from "@stores/modalStore.ts";

const Alert = () => {
  const { alertIsOpen, alertIsClosing, alertModalContent, closeAlertModal } =
    useModalStore();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (alertIsClosing) return; // 모달이 닫히는 중이면 아무것도 하지 않음

    if (alertIsOpen && dialog.current) {
      dialog.current.showModal(); // 모달 열기
    }
  }, [alertIsOpen]);

  useEffect(() => {
    if (!alertIsOpen && dialog.current) {
      dialog.current.close(); // 모달 닫기 (isClosing 애니메이션 후)
    }
  }, [alertIsOpen]);

  if (!alertIsOpen || !alertModalContent) return null; // 모달이 열려있지 않으면 아무것도 렌더링하지 않음

  function handleBackdropClick(
    event: React.MouseEvent<HTMLDialogElement, MouseEvent>
  ) {
    if (dialog.current && event.target === dialog.current) {
      closeAlertModal();
    }
  }

  return createPortal(
    <dialog
      id="alert"
      ref={dialog}
      onClick={handleBackdropClick}
      onClose={closeAlertModal}
      className={`left-1/2 -translate-x-1/2 -translate-y-1/2 m-0 w-[480px] h-fit rounded-b-xl bg-transparent ${alertIsClosing ? "alert-is-closing" : ""}`}
    >
      <div className="flex flex-col items-start justify-center w-full h-full gap-4 p-6 bg-white rounded-lg shadow-lg text-text">
        <h2 className="text-xl font-pre-bold">{alertModalContent.title}</h2>
        <p className="font-pre-regular text-content whitespace-pre-line">
          {alertModalContent.content}
        </p>

        <div className="flex items-center justify-end w-full h-fit">
          <button
            className="px-4 py-2 text-sm font-semibold text-[#fff] bg-theme rounded-md hover:bg-theme-dark focus:outline-none"
            onClick={closeAlertModal}
          >
            확인
          </button>
        </div>
      </div>
    </dialog>,
    document.getElementById("alert") as HTMLElement
  );
};

export default Alert;
