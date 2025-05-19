import { useEffect, useState } from "react";
import useAuthenticateStore from "@stores/authenticateStore";

import SettingsWelcome from "@pages/settings/components/SettingsWelcome";
import SettingConnectedEmail from "@pages/settings/components/SettingsConnectedEmail";

const themes = [
  { name: "Default", class: "" },
  { name: "Blue Dark", class: "theme-blue-dark" },
  { name: "Orange Warm", class: "theme-orange-warm" },
];

const SettingsContent = () => {
  const { user, deleteUser } = useAuthenticateStore();
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem("theme") || "";
  });

  useEffect(() => {
    document.documentElement.className = currentTheme;
    localStorage.setItem("theme", currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (themeClass: string) => {
    setCurrentTheme(themeClass);
  };

  return (
    <div className="flex flex-col w-full h-full gap-1 rounded-lg bg-white p-2 font-pre-bold">
      <SettingsWelcome user={user ? user : null} onDelete={deleteUser} />
      <SettingConnectedEmail />
      <div className="p-4 border-t border-gray-200 mt-4">
        <h3 className="text-lg font-semibold mb-2 text-color-title">
          Theme Settings
        </h3>
        <div className="flex gap-2">
          {themes.map((theme) => (
            <button
              key={theme.name}
              onClick={() => handleThemeChange(theme.class)}
              className={`px-4 py-2 rounded-md text-sm font-medium
                ${currentTheme === theme.class ? "bg-color-theme text-white" : "bg-color-light hover:bg-color-light2 text-color-content"}`}
            >
              {theme.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsContent;
