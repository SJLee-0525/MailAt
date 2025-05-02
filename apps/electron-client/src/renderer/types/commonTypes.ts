export interface ButtonProps {
  type: "button" | "submit" | "reset";
  content: string;
  onAction?:
    | ((e: React.MouseEvent) => void)
    | ((e: React.FormEvent) => void)
    | (() => void);
  className?: string;
}

export interface IconButtonProps {
  onClick?:
    | ((e: React.MouseEvent) => void)
    | ((e: React.FormEvent) => void)
    | (() => void);
  icon: React.ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
}
