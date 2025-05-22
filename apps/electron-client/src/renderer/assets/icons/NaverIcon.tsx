import { IconProps } from "@/types/iconProps";

const NaverIcon = ({
  width = 20,
  height = 20,
  strokeColor = "#03C75A",
  onClick,
}: IconProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path
        d="
          M2 2
          L2 18
          L6 18
          L6 8
          L14 18
          L18 18
          L18 2
          L14 2
          L14 12
          L6 2
          Z
        "
        fill={strokeColor}
      />
    </svg>
  );
};

export default NaverIcon;
