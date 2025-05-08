import { IconProps } from "@/types/iconProps";

const SendIcon = ({
  width = 24,
  height = 24,
  strokeColor = "white",
  onClick,
}: IconProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path
        d="M3 20V4L22 12L3 20ZM5 17L16.85 12L5 7V10.5L11 12L5 13.5V17ZM5 17V12V7V10.5V13.5V17Z"
        fill={strokeColor}
      />
    </svg>
  );
};

export default SendIcon;
