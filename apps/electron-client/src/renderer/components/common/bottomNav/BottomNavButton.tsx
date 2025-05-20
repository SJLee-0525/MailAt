const BottomNavButton = ({
  icon,
  onClick,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center p-4 rounded-full transition-all duration-300 bg-bg hover:bg-bg-dark hover:-translate-y-1.5"
    >
      {icon}
    </button>
  );
};

export default BottomNavButton;
