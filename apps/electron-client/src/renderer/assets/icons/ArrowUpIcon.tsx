import { IconProps } from "@/types/iconProps";

import useAuthenticateStore from "@stores/authenticateStore";

const ArrowUpIcon = ({
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
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path
        d="M6.7925 14.1259L11 9.92754L15.2075 14.1259L16.5 12.8334L11 7.33337L5.5 12.8334L6.7925 14.1259Z"
        fill={strokeColor}
      />
    </svg>
  );
};

export default ArrowUpIcon;
