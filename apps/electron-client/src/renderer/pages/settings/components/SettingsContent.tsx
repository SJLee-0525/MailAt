import useAuthenticateStore from "@stores/authenticateStore";

import SettingsWelcome from "@pages/settings/components/SettingsWelcome";
import SettingConnectedEmail from "@pages/settings/components/SettingsConnectedEmail";

const SettingsContent = () => {
  const { user } = useAuthenticateStore();

  return (
    <div className="flex flex-col w-full h-full gap-1 rounded-lg bg-bg p-2 font-pre-bold">
      <SettingsWelcome userName={user ? user.username : null} />
      <SettingConnectedEmail />
    </div>
  );
};

export default SettingsContent;
