import { useState, useEffect } from "react";

import { getSyncEmail } from "@apis/emailApi";

import useAuthenticateStore from "@stores/authenticateStore";
import useConversationsStore from "@stores/conversationsStore";
import useModalStore from "@stores/modalStore";
import useUserProgressStore from "@stores/userProgressStore";

import { decodeImapModifiedUtf7Segment } from "@utils/getEmailData";

import IconButton from "@components/common/button/IconButton";
import ReloadIcon from "@assets/icons/ReloadIcon";
import LightIcon from "@assets/icons/LightIcon";
import NightIcon from "@assets/icons/NightIcon";

const THEMES = [
  { name: "Light", class: "" },
  { name: "Night", class: "theme-night" },
];

const SettingsHeader = () => {
  const {
    user,
    currentTheme,
    setCurrentTheme: setCurrentThemeInStore,
  } = useAuthenticateStore();
  const { folders } = useConversationsStore();
  const { openAlertModal } = useModalStore();
  const { setLoading, setLoadingMessage, setCloseLoadingMessage } =
    useUserProgressStore();

  const [isOpenSync, setIsOpenSync] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme && storedTheme !== currentTheme) {
      setCurrentThemeInStore(storedTheme);
    } else if (!storedTheme && currentTheme === "") {
      setCurrentThemeInStore("");
    }
    document.documentElement.className = currentTheme;
  }, [currentTheme, setCurrentThemeInStore]);

  function handleThemeChange(themeClass: string) {
    setCurrentThemeInStore(themeClass);
    localStorage.setItem("theme", themeClass);
  }

  async function handleSyncEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    const fd = new FormData(event.currentTarget);
    const data = Object.fromEntries(fd.entries());

    const accountId = user.userId;
    const folderName = data.folderName as string;
    const limit = parseInt(data.limit as string, 10);

    if (isNaN(limit) || limit <= 0) {
      openAlertModal({
        title: "오류",
        content: "개수는 1 이상의 숫자여야 합니다.",
      });
      return;
    } else if (folderName === "") {
      openAlertModal({
        title: "오류",
        content: "폴더를 선택하세요.",
      });
      return;
    }

    setLoading(true);
    setLoadingMessage("이메일 동기화 중...");

    try {
      const response = await getSyncEmail({
        accountId,
        folderName,
        limit,
      });

      if (response.success) {
        setLoading(false);
        setLoadingMessage("이메일 동기화 완료");

        openAlertModal({
          title: "동기화 성공",
          content: `${response.data.syncedCount}개의 이메일이 동기화되었습니다.`,
        });
      } else {
        setLoading(false);
        setLoadingMessage("이메일 동기화 실패");

        openAlertModal({
          title: "동기화 실패",
          content: "이메일 동기화에 실패했습니다.",
        });
      }
    } catch (error) {
      setLoading(false);
      setLoadingMessage("이메일 동기화 실패");

      openAlertModal({
        title: "오류",
        content: "이메일 동기화 중 오류가 발생했습니다.",
      });
    } finally {
      setCloseLoadingMessage();
    }
  }

  return (
    <div className="flex items-center justify-between w-full h-16 min-h-16 px-4">
      <h3 className="font-pre-bold text-xl text-text">설정</h3>
      <div className="relative flex items-center justify-center gap-4">
        <IconButton
          type="button"
          icon={<ReloadIcon width={20} height={20} />}
          className="p-2 transition-all duration-200 ease-in-out hover:bg-light2"
          onClick={() => setIsOpenSync(!isOpenSync)}
        />

        {currentTheme === THEMES[0].class ? (
          <IconButton
            type="button"
            icon={<NightIcon width={24} height={24} />}
            className="p-1.5 transition-all duration-200 ease-in-out hover:bg-light2"
            onClick={() => handleThemeChange(THEMES[1].class)}
          />
        ) : (
          <IconButton
            type="button"
            icon={<LightIcon width={24} height={24} />}
            className="p-1.5 transition-all duration-200 ease-in-out hover:bg-light2"
            onClick={() => handleThemeChange(THEMES[0].class)}
          />
        )}

        {isOpenSync && (
          <div className="absolute top-10 right-0 flex flex-col z-10 w-72 p-2.5 bg-white border border-disable rounded shadow-lg">
            <form
              className="flex flex-col items-center justify-center w-full h-fit gap-4 p-4 text-center font-pre-bold"
              onSubmit={handleSyncEmail}
            >
              <div className="flex w-full h-fit justify-between items-start">
                <p className="font-pre-bold text-text px-1">수동 동기화</p>
                <button
                  type="submit"
                  className="w-fit px-3 py-1.5 text-sm font-pre-bold text-[#fff] bg-theme rounded-full hover:theme-dark focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  동기화
                </button>
              </div>

              <div className="flex flex-col items-center justify-center w-full h-fit gap-4 text-center font-pre-bold">
                <div className="flex flex-col items-start w-full h-fit gap-1">
                  <label className="font-pre-bold text-xs px-1">폴더</label>
                  <select
                    name="folderName"
                    className="w-full h-10 px-2 text-sm bg-light1 rounded-lg"
                  >
                    {Object.keys(folders).map((folder) => {
                      const decodedFolder =
                        decodeImapModifiedUtf7Segment(folder);

                      return (
                        <option
                          key={folder}
                          value={folder}
                          className="w-full h-10 px-2 text-sm bg-light1 rounded-lg"
                        >
                          {decodedFolder}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex flex-col items-start w-full h-fit gap-1">
                  <label className="font-pre-bold text-xs px-1">개수</label>
                  <input
                    type="number"
                    name="limit"
                    className="w-full h-10 px-2 text-sm bg-light1 rounded-lg"
                  />
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsHeader;
