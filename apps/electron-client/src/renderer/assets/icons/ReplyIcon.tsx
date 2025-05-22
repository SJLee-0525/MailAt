import { IconProps } from "@/types/iconProps";

import useAuthenticateStore from "@stores/authenticateStore";

const ReplyIcon = ({
  width = 28,
  height = 28,
  strokeColor,
  className,
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
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
      aria-label="답장"
    >
      <title>답장</title>

      <g clipPath="url(#clip0_127_9192)">
        <path
          d="M10 9V5L3 12L10 19V14.9C15 14.9 18.5 16.5 21 20C20 15 17 10 10 9Z"
          fill={strokeColor}
        />
      </g>
      <defs>
        <clipPath id="clip0_127_9192">
          <rect width={width} height={height} fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default ReplyIcon;
