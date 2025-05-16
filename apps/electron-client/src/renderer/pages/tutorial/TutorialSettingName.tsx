import "@pages/tutorial/Tutorial.css";

import { useState, useEffect } from "react";

import useModalStore from "@stores/modalStore";

const WELCOME = [
  "환영합니다!", // 한국어
  "Welcome!", // 영어
  "ようこそ！", // 일본어
  "欢迎！", // 중국어 간체
  "Bienvenido!", // 스페인어
  "Bienvenue!", // 프랑스어
  "Willkommen!", // 독일어
  "Benvenuto!", // 이탈리아어
  "Добро пожаловать!", // 러시아어
];

const TutorialSettingName = ({
  setSettingName,
  setNextPage,
}: {
  setSettingName: (name: string) => void;
  setNextPage: () => void;
}) => {
  const { openAlertModal } = useModalStore();

  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isEditing || WELCOME.length === 0) {
      return;
    }

    let fadeTimeoutId: ReturnType<typeof setTimeout>;

    const changeWelcomeMessage = () => {
      setIsFadingOut(true);

      fadeTimeoutId = setTimeout(() => {
        setWelcomeIndex((prevIndex) => (prevIndex + 1) % WELCOME.length);
        setIsFadingOut(false);
      }, 1000);
    };

    const cycleIntervalId = setInterval(changeWelcomeMessage, 5000);

    return () => {
      clearInterval(cycleIntervalId);
      clearTimeout(fadeTimeoutId);
    };
  }, [isEditing]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fd = new FormData(event.currentTarget);
    const name = Object.fromEntries(fd).name as string;

    if (name.trim() === "") {
      openAlertModal({
        title: "입력 오류",
        content: "이름을 입력해주세요.",
      });
      return;
    } else if (/\s/.test(name)) {
      openAlertModal({
        title: "입력 오류",
        content: "이름에 공백을 포함할 수 없습니다.",
      });
      return;
    }

    if (name.length > 10) {
      openAlertModal({
        title: "입력 오류",
        content: "이름은 10자 이하로 입력해주세요.",
      });
      return;
    } else if (name.length < 2) {
      openAlertModal({
        title: "입력 오류",
        content: "이름은 2자 이상으로 입력해주세요.",
      });
      return;
    }

    setSettingName(name);
    setNextPage();
  }

  return (
    <div className="flex flex-col justify-center items-center w-full h-full gap-14 font-pre-regular init-message">
      {!isEditing ? (
        <>
          <h1
            className={`text-7xl text-center font-pre-bold transition-all ease-in-out duration-1000 ${
              isFadingOut ? "opacity-0" : "opacity-100"
            }`}
          >
            {WELCOME[welcomeIndex]}
          </h1>

          <div className="w-fit h-fit flex flex-col items-center justify-center gap-4">
            <button
              className="rounded-full px-7 py-2 bg-theme font-pre-semi-bold text-white text-center text-xl hover:bg-theme-hover active:bg-theme-active focus:bg-theme-focus disabled:bg-theme-disabled disabled:text-theme-disabled-text"
              onClick={() => setIsEditing(true)}
            >
              시작하기
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-7xl font-pre-bold init-message">
            이름을 입력해주세요
          </h1>

          <div className="w-fit h-fit flex flex-col items-center justify-center gap-4 init-message">
            <form
              onSubmit={handleSubmit}
              className="flex items-center justify-center w-fit h-12 p-0.5 gap-4 text-center font-pre-bold rounded-full shadow-light3 shadow-[2px_4px_8px_1px]"
            >
              <input
                type="text"
                name="name"
                className="w-72 h-full px-4 rounded-full bg-white focus:outline-none"
              />

              <button
                type="submit"
                className="w-11 aspect-[1/1] rounded-full text-white text-xs transition-all duration-200 bg-theme hover:bg-theme-dark"
              >
                등록
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default TutorialSettingName;
