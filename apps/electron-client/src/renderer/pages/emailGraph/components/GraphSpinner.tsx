import "@/styles/animations.css";

const GraphSpinner = ({
  theme = "theme-night",
  size = 16,
}: {
  theme?: string;
  size?: number;
}) => {
  const nightColors = ["#556c99", "#7689b0", "#ffab90", "#ffe79a"];
  const lightColors = ["#022d48", "#0a5685", "#e76f51", "#ffb45c"];
  const colors = theme === "theme-night" ? nightColors : lightColors;

  return (
    <div className="flex items-end gap-2 h-8">
      {colors.map((c, i) => (
        <span
          key={c}
          className="dot-bounce"
          style={{
            width: size,
            height: size,
            backgroundColor: c,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
};

export default GraphSpinner;
