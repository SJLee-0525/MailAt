import { IconButtonProps } from "@/types/commonTypes";

const IconButton = ({
  onClick,
  icon,
  type = "button",
  className = "",
}: IconButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-full transition-all ${className}`}
    >
      {icon}
    </button>
  );
};

export default IconButton;
