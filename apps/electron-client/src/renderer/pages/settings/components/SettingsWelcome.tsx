import { useState } from "react";

import Button from "@components/common/button/Button";

import SettingsName from "@pages/settings/components/SettingsName";

import defaultProfile from "@assets/images/defaultProfile.png";
import logo from "@assets/images/logo.png";

const SettingsWelcome = ({ userName }: { userName: string | null }) => {
  const [isNameEdit, setIsNameEdit] = useState(false);

  return (
    <>
      {userName ? (
        <div className="flex flex-col items-center justify-center w-full h-fit gap-3 p-4 text-center font-pre-bold">
          <img
            src={defaultProfile}
            alt="1"
            className="w-40 h-40 aspect-[1/1] rounded-full object-cover"
          />
          <h2 className="font-pre-extra-bold font-bold text-xl">
            안녕하세요! {userName}님!
          </h2>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-fit gap-3 p-4 text-center font-pre-bold">
          <img
            src={logo}
            alt="1"
            className="w-40 h-40 rounded-full object-cover"
          />
          <h2 className="font-pre-extra-bold font-bold text-xl text-center">
            MAIL@에 오신 것을 환영합니다!
          </h2>
          {!isNameEdit ? (
            <Button
              type="button"
              content="시작하기"
              className="h-10 bg-blue-500 text-white rounded-full"
              onAction={() => {
                setIsNameEdit(true);
              }}
            />
          ) : (
            <SettingsName />
          )}
        </div>
      )}
    </>
  );
};

export default SettingsWelcome;
