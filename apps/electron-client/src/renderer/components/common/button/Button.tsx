import { ButtonProps } from "@/types/commonTypes";

const Button = ({ type, content, onAction, className }: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onAction}
      className={`text-center font-pre-semi-bold text-sm rounded-full px-4 py-2 ${className}`}
    >
      <span>{content}</span>
    </button>
  );
};

export default Button;
