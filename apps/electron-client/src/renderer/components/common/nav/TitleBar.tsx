import logo from "@assets/images/logo_white.png";
import ReloadIcon from "@assets/icons/ReloadIcon";
import MinimizeIcon from "@assets/icons/MinimizeIcon";
import MaximizeIcon from "@assets/icons/MaximizeIcon";
import CloseIcon from "@assets/icons/CloseIcon";

const TitleBar = () => {
  function handleReload() {
    if (
      window.electronAPI &&
      typeof window.electronAPI.reloadWindow === "function"
    ) {
      window.electronAPI.reloadWindow();
    } else {
      console.warn("electronAPI.reloadWindow is not available");
    }
  }

  function handleMinimize() {
    if (
      window.electronAPI &&
      typeof window.electronAPI.minimizeWindow === "function"
    ) {
      window.electronAPI.minimizeWindow();
    } else {
      console.warn("electronAPI.minimizeWindow is not available");
    }
  }

  function handleToggleMaximize() {
    if (
      window.electronAPI &&
      typeof window.electronAPI.toggleMaximizeWindow === "function"
    ) {
      window.electronAPI.toggleMaximizeWindow();
    } else {
      console.warn("electronAPI.toggleMaximizeWindow is not available");
    }
  }

  function handleClose() {
    if (
      window.electronAPI &&
      typeof window.electronAPI.closeWindow === "function"
    ) {
      window.electronAPI.closeWindow();
    } else {
      console.warn("electronAPI.closeWindow is not available");
    }
  }

  return (
    <div className="sticky flex justify-between items-center w-full h-10 bg-bg text-white px-4">
      <img src={logo} alt="Logo" className="w-6 h-6 object-cover" />
      <div className="flex items-center gap-3">
        <ReloadIcon
          onClick={handleReload}
          width={16}
          height={16}
          strokeColor="#ffffff"
          strokeWidth={2.5}
        />
        <MinimizeIcon
          onClick={handleMinimize}
          width={16}
          height={16}
          strokeColor="#ffffff"
          strokeWidth={2.5}
        />
        <MaximizeIcon
          onClick={handleToggleMaximize}
          width={16}
          height={16}
          strokeColor="#ffffff"
          strokeWidth={2.5}
        />
        <CloseIcon
          onClick={handleClose}
          width={16}
          height={16}
          strokeColor="#ffffff"
          strokeWidth={1.5}
        />
      </div>
    </div>
  );
};

export default TitleBar;
