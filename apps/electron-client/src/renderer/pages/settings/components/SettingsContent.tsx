import useAuthenticateStore from "@stores/authenticateStore";

import SettingsWelcome from "@pages/settings/components/SettingsWelcome";
import SettingConnectedEmail from "@pages/settings/components/SettingsConnectedEmail";

const SettingsContent = () => {
  const { authUsers, selectedUser } = useAuthenticateStore();

  return (
    <div className="flex flex-col w-full h-full gap-1 rounded-lg bg-bg p-2 font-pre-bold">
      <SettingsWelcome user={selectedUser} />
      {authUsers.length > 0 && (
        <hr className="border-t border-light3 w-full my-4" />
      )}
      <SettingConnectedEmail />
    </div>
  );
};

export default SettingsContent;
