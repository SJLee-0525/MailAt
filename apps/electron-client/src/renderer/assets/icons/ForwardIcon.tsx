import { IconProps } from "@/types/iconProps";

const ForwardIcon = ({
  width = 24,
  height = 24,
  strokeColor = "#7D7983",
  className,
  onClick,
}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      onClick={onClick}
      className={className}
    >
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
