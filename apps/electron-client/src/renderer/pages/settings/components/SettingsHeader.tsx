import { useEffect } from "react";

import LightIcon from "@assets/icons/LightIcon";
import NightIcon from "@assets/icons/NightIcon";
import useAuthenticateStore from "@stores/authenticateStore";

const THEMES = [
  { name: "Light", class: "" },
  { name: "Night", class: "theme-night" },
];

const SettingsHeader = () => {
  const currentTheme = useAuthenticateStore((state) => state.currentTheme);
  const setCurrentThemeInStore = useAuthenticateStore(
    (state) => state.setCurrentTheme
  );

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme && storedTheme !== currentTheme) {
      setCurrentThemeInStore(storedTheme);
    } else if (!storedTheme && currentTheme === "") {
      setCurrentThemeInStore("");
    }
    document.documentElement.className = currentTheme;
  }, [currentTheme, setCurrentThemeInStore]);

  function handleThemeChange(themeClass: string) {
    setCurrentThemeInStore(themeClass);
    localStorage.setItem("theme", themeClass);
  }

  return (
    <div className="flex items-center justify-between w-full h-16 min-h-16  px-4">
      <h3 className="font-pre-bold text-xl text-text">설정</h3>
      <div className="flex items-center justify-center">
        {currentTheme === THEMES[0].class ? (
          <NightIcon
            width={24}
            height={24}
            strokeColor="#000000"
            strokeWidth={2}
            onClick={() => handleThemeChange(THEMES[1].class)}
          />
        ) : (
          <LightIcon
            width={24}
            height={24}
            strokeColor="#ffffff"
            strokeWidth={2}
            onClick={() => handleThemeChange(THEMES[0].class)}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsHeader;
