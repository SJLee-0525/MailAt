import { IconProps } from "@/types/iconProps";

const MinimizeIcon = ({
  width = 24,
  height = 24,
  strokeColor = "white",
  strokeWidth = 2,
  className,
  onClick,
}: IconProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
    >
      <path
        d="M6 12H18"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default MinimizeIcon;
