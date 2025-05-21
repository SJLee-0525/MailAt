import { useState } from "react";

import { User } from "@/types/authType";

import { updateUser, deleteUser } from "@apis/userApi";

import useAuthenticateStore from "@stores/authenticateStore";
import useUserProgressStore from "@stores/userProgressStore";
import useModalStore from "@stores/modalStore";

import Button from "@components/common/button/Button";

import SettingsName from "@pages/settings/components/SettingsName";

import defaultProfile from "@assets/images/defaultProfile.png";
import logo from "@assets/images/logo.png";

import IconButton from "@components/common/button/IconButton";
import DeleteIcon from "@assets/icons/DeleteIcon";
import EditIcon from "@assets/icons/EditIcon";

const SettingsWelcome = ({
  user,
  onDelete,
}: {
  user: User | null;
  onDelete: () => void;
}) => {
  const { setUserName } = useAuthenticateStore();
  const { setLoading, setLoadingMessage, setCloseLoadingMessage } =
    useUserProgressStore();
  const { openAlertModal } = useModalStore();

  const [isNameEdit, setIsNameEdit] = useState(false);
  const [isExistNameEdit, setIsExistNameEdit] = useState(false);

  async function handleUpdateUserName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

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

    setLoading(true);
    setLoadingMessage("사용자 이름 수정 중...");

    try {
      const response = await updateUser(user.userId, name);
      // console.log(response);

      setLoading(false);
      setLoadingMessage("사용자 이름 수정 성공");
      setIsExistNameEdit(false);
      setUserName(response);
      openAlertModal({
        title: "사용자 이름 수정 성공",
        content: `${name}님 환영합니다!`,
      });
    } catch (error) {
      console.error("사용자 이름 수정 실패:", error);

      setLoading(false);
      setLoadingMessage("사용자 이름 수정 실패");
      openAlertModal({
        title: "사용자 이름 수정 실패",
        content: "이름 수정에 실패했습니다. 다시 시도해주세요.",
      });
    } finally {
      setCloseLoadingMessage();
    }
  }
  async function handleDeleteUser(userId: number) {
    setLoading(true);
    setLoadingMessage("사용자 삭제 중...");

    try {
      await deleteUser(userId);
      // 사용자 삭제 후 추가적인 작업 수행 (예: 상태 업데이트, UI 변경 등)
      onDelete(); // 사용자 삭제 후 상태 업데이트
      // console.log("사용자 삭제 성공");

      setLoading(false);
      setLoadingMessage("사용자 삭제 성공");
    } catch (error) {
      console.error("사용자 삭제 실패:", error);

      setLoading(false);
      setLoadingMessage("사용자 삭제 실패");
    } finally {
      setCloseLoadingMessage();
    }
  }

  return (
    <>
      {user && user.username ? (
        <div className="flex flex-col items-center justify-center w-full h-fit py-1 text-center font-pre-bold">
          <div className="flex items-center justify-end w-full h-7 gap-0.5">
            {!isExistNameEdit && (
              <>
                <IconButton
                  type="button"
                  icon={<EditIcon width={20} height={20} />}
                  className="p-2 transition-all duration-200 ease-in-out hover:bg-light2"
                  onClick={() => setIsExistNameEdit(true)}
                />
                <IconButton
                  type="button"
                  icon={<DeleteIcon width={20} height={20} />}
                  className="p-2 transition-all duration-200 ease-in-out hover:bg-light2"
                  onClick={() => handleDeleteUser(user.userId)}
                />
              </>
            )}
          </div>

          <div className="flex flex-col items-center justify-between w-full h-72 gap-8 py-4">
            <img
              src={defaultProfile}
              alt="1"
              className="w-40 h-40 aspect-[1/1] rounded-full object-cover"
            />
            {!isExistNameEdit ? (
              <h2 className="font-pre-extra-bold text-xl">
                안녕하세요!
                <br />
                {user.username}님!
              </h2>
            ) : (
              <form
                className="flex items-center justify-between px-1.5 w-4/5 h-12 bg-header text-text rounded-full"
                onSubmit={handleUpdateUserName}
              >
                <input
                  type="text"
                  name="name"
                  className="font-pre-regular w-full h-full px-4 py-auto border-none rounded-full focus:outline-none text-icon"
                  placeholder="수정할 이름을 입력하세요."
                />
                <IconButton
                  type="submit"
                  icon={<EditIcon width={20} height={20} />}
                  className="p-2 transition-all duration-200 ease-in-out hover:bg-warning"
                  onClick={() => setIsExistNameEdit(true)}
                />
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-fit gap-3 p-4 text-center font-pre-bold">
          <img
            src={logo}
            alt="1"
            className="w-40 h-40 rounded-full object-cover"
          />
          <h2 className="font-pre-extra-bold text-xl text-center">
            MAIL@에 오신 것을 환영합니다!
          </h2>
          <div className="flex justify-center items-center w-fit h-20">
            {!isNameEdit ? (
              <Button
                type="button"
                content="시작하기"
                className="mt-4 h-10 bg-theme text-white rounded-full"
                onAction={() => {
                  setIsNameEdit(true);
                }}
              />
            ) : (
              <SettingsName />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsWelcome;
