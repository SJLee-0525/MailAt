import { IconProps } from "@/types/iconProps";

const MenuIcon = ({
  width = 25,
  height = 24,
  strokeColor = "#7D7983",
  onClick,
}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 25 24"
      fill="none"
      onClick={onClick}
    >
      <circle cx="6.5" cy="6" r="2" fill={strokeColor} />
      <circle cx="6.5" cy="12" r="2" fill={strokeColor} />
      <circle cx="6.5" cy="18" r="2" fill={strokeColor} />
      <circle cx="18.5" cy="6" r="2" fill={strokeColor} />
      <circle cx="18.5" cy="12" r="2" fill={strokeColor} />
      <circle cx="18.5" cy="18" r="2" fill={strokeColor} />
      <circle cx="12.5" cy="6" r="2" fill={strokeColor} />
      <circle cx="12.5" cy="12" r="2" fill={strokeColor} />
      <circle cx="12.5" cy="18" r="2" fill={strokeColor} />
    </svg>
  );
};

export default MenuIcon;
