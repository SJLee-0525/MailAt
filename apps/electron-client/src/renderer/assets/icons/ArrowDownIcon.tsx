import { IconProps } from "@/types/iconProps";

import useAuthenticateStore from "@stores/authenticateStore";

const ArrowDownIcon = ({
  width = 22,
  height = 22,
  strokeColor,
  onClick,
}: IconProps) => {
  const { currentTheme } = useAuthenticateStore();

  if (!strokeColor) {
    strokeColor = currentTheme === "theme-night" ? "#e9e9e9" : "#7d7983";
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 22 22"
      fill={strokeColor}
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path
        d="M6.7925 7.87427L11 12.0726L15.2075 7.87427L16.5 9.16677L11 14.6668L5.5 9.16677L6.7925 7.87427Z"
        fill={strokeColor}
      />
    </svg>
  );
};

export default ArrowDownIcon;
