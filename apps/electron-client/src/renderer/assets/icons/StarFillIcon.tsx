import { IconProps } from "@/types/iconProps";

import useAuthenticateStore from "@stores/authenticateStore";

const StarFillIcon = ({
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
        d="M11 15.8308L16.665 19.2499L15.1616 12.8058L20.1666 8.46992L13.5758 7.91075L11 1.83325L8.42415 7.91075L1.83331 8.46992L6.83831 12.8058L5.33498 19.2499L11 15.8308Z"
        fill={strokeColor}
      />
    </svg>
  );
};

export default StarFillIcon;
