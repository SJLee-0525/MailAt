interface LoadingSpinnerProps {
  isLoading: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  isLoading,
  className = "",
}) => {
  if (!isLoading) return null;

  return (
    <div
      className={`rounded-full border-t-transparent animate-spin ${className}`}
    />
  );
};

export default LoadingSpinner;
