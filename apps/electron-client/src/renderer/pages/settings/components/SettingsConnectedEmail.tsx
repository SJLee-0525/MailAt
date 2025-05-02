import useAuthenticateStore from "@stores/authenticateStore";

import SettingsMailList from "@pages/settings/components/SettingsMailList";

import Button from "@components/common/button/Button";

const SettingConnectedEmail = () => {
  const { authUsers } = useAuthenticateStore();

  return (
    <>
      {authUsers.length > 0 && (
        <div className="flex flex-col w-full h-fit gap-2 p-2 font-pre-bold">
          <div className="flex items-center justify-between w-full h-fit px-1.5 text-center font-pre-bold">
            <h2 className="font-pre-bold font-bold text-lg">연결된 계정</h2>
            <Button
              type="button"
              content="추가"
              className="bg-theme text-white rounded-full text-xs"
              onAction={() => {
                console.log("계정 추가 클릭");
              }}
            />
          </div>
          <SettingsMailList users={authUsers} />
        </div>
      )}
    </>
  );
};

export default SettingConnectedEmail;
