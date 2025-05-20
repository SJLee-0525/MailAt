import SettingsHeader from "@pages/settings/components/SettingsHeader";
import SettingsContent from "@pages/settings/components/SettingsContent";

const Settings = () => {
  return (
    <div className="relative flex flex-col w-full h-fit bg-header rounded-xl text-text">
      <SettingsHeader />
      <div className="w-full h-full px-1 pb-1 bg-header rounded-b-xl">
        <SettingsContent />
      </div>
    </div>
  );
};

export default Settings;
