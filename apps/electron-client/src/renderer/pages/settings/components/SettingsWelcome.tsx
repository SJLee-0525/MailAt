import { useState } from "react";

import { User } from "@/types/authType";

import { deleteUser } from "@/apis/userApi";

import Button from "@components/common/button/Button";

import SettingsName from "@pages/settings/components/SettingsName";

import defaultProfile from "@assets/images/defaultProfile.png";
import logo from "@assets/images/logo.png";

const SettingsWelcome = ({
  user,
  onDelete,
}: {
  user: User | null;
  onDelete: () => void;
}) => {
  const [isNameEdit, setIsNameEdit] = useState(false);

  async function handleDeleteUser(userId: number) {
    try {
      await deleteUser(userId);
      // 사용자 삭제 후 추가적인 작업 수행 (예: 상태 업데이트, UI 변경 등)
      onDelete(); // 사용자 삭제 후 상태 업데이트
      console.log("사용자 삭제 성공");
    } catch (error) {
      console.error("사용자 삭제 실패:", error);
    }
  }

  return (
    <>
      {user && user.username ? (
        <div className="flex flex-col items-center justify-center w-full h-fit gap-8 p-4 text-center font-pre-bold">
          <img
            src={defaultProfile}
            alt="1"
            className="w-40 h-40 aspect-[1/1] rounded-full object-cover"
          />
          <h2 className="font-pre-extra-bold text-xl">
            안녕하세요!
            <br />
            {user.username}님!
          </h2>
          {/* <button onClick={() => handleDeleteUser(user.userId)}>삭제</button> */}
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
