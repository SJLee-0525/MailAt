import { IconProps } from "@/types/iconProps";

import useAuthenticateStore from "@stores/authenticateStore";

const DeleteIcon = ({
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
      className={className}
      onClick={onClick}
      aria-label="삭제"
    >
      <title>삭제</title>
      <path
        d="M6.50001 18.4167C6.50001 19.425 7.32501 20.25 8.33334 20.25H15.6667C16.675 20.25 17.5 19.425 17.5 18.4167V7.41667H6.50001V18.4167ZM18.4167 4.66667H15.2083L14.2917 3.75H9.70834L8.79168 4.66667H5.58334V6.5H18.4167V4.66667Z"
        fill={strokeColor}
      />
    </svg>
  );
};

export default DeleteIcon;
