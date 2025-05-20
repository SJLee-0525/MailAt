import { IconProps } from "@/types/iconProps";

import useAuthenticateStore from "@stores/authenticateStore";

const StarIcon = ({
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
      viewBox="0 0 24 24"
      fill={strokeColor}
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path
        d="M8.85 17.825L12 15.925L15.15 17.85L14.325 14.25L17.1 11.85L13.45 11.525L12 8.125L10.55 11.5L6.9 11.825L9.675 14.25L8.85 17.825ZM5.825 22L7.45 14.975L2 10.25L9.2 9.625L12 3L14.8 9.625L22 10.25L16.55 14.975L18.175 22L12 18.275L5.825 22Z"
        fill={strokeColor}
      />
    </svg>
  );
};

export default StarIcon;
