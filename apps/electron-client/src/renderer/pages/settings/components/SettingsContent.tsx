import useAuthenticateStore from "@stores/authenticateStore";

import SettingsWelcome from "@pages/settings/components/SettingsWelcome";
import SettingConnectedEmail from "@pages/settings/components/SettingsConnectedEmail";

const SettingsContent = () => {
  const { user, deleteUser } = useAuthenticateStore();

  return (
    <div className="flex flex-col w-full h-full gap-1 rounded-lg bg-white p-2 font-pre-bold">
      <SettingsWelcome user={user ? user : null} onDelete={deleteUser} />
      <SettingConnectedEmail />
    </div>
  );
};

export default SettingsContent;
