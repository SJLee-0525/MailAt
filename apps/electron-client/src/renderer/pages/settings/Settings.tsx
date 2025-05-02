import SettingsHeader from "@pages/settings/components/SettingsHeader";
import SettingsContent from "@pages/settings/components/SettingsContent";

const Settings = () => {
  return (
    <div className="flex flex-col w-full h-full bg-light1 rounded-xl">
      <SettingsHeader />
      <div className="w-full h-full px-1 pb-1 bg-light1 rounded-b-xl">
        <SettingsContent />
      </div>
    </div>
  );
};

export default Settings;
