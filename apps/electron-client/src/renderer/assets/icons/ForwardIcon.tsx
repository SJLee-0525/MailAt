import { IconProps } from "@/types/iconProps";

import useAuthenticateStore from "@stores/authenticateStore";

const ForwardIcon = ({
  width = 24,
  height = 24,
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
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      onClick={onClick}
      className={className}
      aria-label="전달"
    >
      <title>전달</title>
      <g clipPath="url(#clip0_127_9193)">
        <path d="M12 8V4L20 12L12 20V16H4V8H12Z" fill={strokeColor} />
      </g>
      <defs>
        <clipPath id="clip0_127_9193">
          <rect width={width} height={height} fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default ForwardIcon;
