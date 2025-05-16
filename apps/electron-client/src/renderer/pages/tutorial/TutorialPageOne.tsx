import "@pages/tutorial/Tutorial.css";

import { useState, useEffect } from "react";

import useAuthenticateStore from "@stores/authenticateStore";
import useModalStore from "@stores/modalStore";

import { createUser } from "@apis/userApi";

const TutorialPageOne = ({
  settingName,
  setNextPage,
}: {
  settingName: string;
  setNextPage: () => void;
}) => {
  const { setUserName } = useAuthenticateStore();
  const { openAlertModal } = useModalStore();

  const [scriptIndex, setScriptIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const script = [
    `${settingName}님`,
    "MAIL@에 오신 것을 환영합니다!",
    "지금 시작해볼까요?",
  ];

  useEffect(() => {
    if (script.length === 0) {
      setIsLoading(false);
      return;
    }

    let fadeTimeoutId: ReturnType<typeof setTimeout>;

    function changeWelcomeMessage() {
      setIsFadingOut(true);

      fadeTimeoutId = setTimeout(() => {
        setScriptIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= script.length) {
            setIsLoading(false);
            return 0;
          }
          return nextIndex;
        });
        setIsFadingOut(false);
      }, 1000);
    }

    const cycleIntervalId = setInterval(changeWelcomeMessage, 2500);

    return () => {
      clearInterval(cycleIntervalId);
      clearTimeout(fadeTimeoutId);
    };
  }, [scriptIndex]);

  async function handleSetUser() {
    // api 호출
    try {
      const response = await createUser(settingName);
      setUserName(response);
      console.log("유저 등록 성공", response);

      window.location.reload();
    } catch (error) {
      console.error("Error creating user:", error);
      openAlertModal({
        title: "오류 발생",
        content: "잠시 후 다시 실행해 주세요.",
      });
      return;
    }
  }

  return (
    <div className="flex flex-col justify-center items-center w-full h-full gap-14 font-pre-regular init-message">
      <h1
        className={`text-7xl text-center font-pre-bold transition-all ease-in-out duration-1000 ${
          isFadingOut ? "opacity-0" : "opacity-100"
        }`}
      >
        {script[scriptIndex]}
      </h1>

      <div
        className={`w-fit h-fit flex flex-col items-center justify-center gap-4 transition-all ease-in-out duration-1000 ${isLoading ? "opacity-0" : "opacity-100"}`}
      >
        <button
          className="rounded-full px-8 py-2 bg-theme font-pre-bold text-white text-center text-lg hover:bg-theme-hover active:bg-theme-dark focus:bg-theme-focus disabled:bg-theme-disabled disabled:text-theme-disabled-text"
          onClick={setNextPage}
        >
          시작하기
        </button>
        <button
          className="rounded-full px-4 py-1 text-theme font-pre-medium init-message transition-all duration-300 ease-in hover:bg-theme hover:text-white"
          onClick={handleSetUser}
        >
          튜토리얼 건너뛰기
        </button>
      </div>
    </div>
  );
};

export default TutorialPageOne;
