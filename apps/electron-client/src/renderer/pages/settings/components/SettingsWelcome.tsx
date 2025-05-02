import { AuthUser } from "@/types/authType";

import Button from "@components/common/button/Button";

import defaultProfile from "@assets/images/defaultProfile.png";
import logo from "@assets/images/logo.png";

const SettingsWelcome = ({ user }: { user: AuthUser | null }) => {
  return (
    <>
      {user ? (
        <div className="flex flex-col items-center justify-center w-full h-fit gap-3 p-4 text-center font-pre-bold">
          <img
            src={defaultProfile}
            alt="1"
            className="w-40 h-40 aspect-[1/1] rounded-full object-cover"
          />
          <h2 className="font-pre-extra-bold font-bold text-xl">
            안녕하세요! {user.name}님!
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
            로그인이 필요합니다.
          </h2>
          <Button
            type="button"
            content="계정 추가"
            className="h-10 bg-blue-500 text-white rounded-full"
            onAction={() => {
              console.log("계정 추가 클릭");
            }}
          />
        </div>
      )}
    </>
  );
};

export default SettingsWelcome;
