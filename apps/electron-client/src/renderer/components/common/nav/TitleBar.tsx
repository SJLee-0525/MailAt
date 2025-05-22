import useUserProgressStore from "@stores/userProgressStore";

import logo from "@assets/images/logo_white.png";

import LoadingSpinner from "@components/common/nav/LoadingSpinner";

import ReloadIcon from "@assets/icons/ReloadIcon";
import MinimizeIcon from "@assets/icons/MinimizeIcon";
import MaximizeIcon from "@assets/icons/MaximizeIcon";
import CloseIcon from "@assets/icons/CloseIcon";

const TopButton = ({
  icon,
  type,
  onClick,
}: {
  icon: React.ReactNode;
  type: "normal" | "close";
  onClick?: () => void;
}) => {
  return (
    <button
      className={`flex justify-center items-center w-8 h-8 transition-all ease-in-out duration-200 bg-transparent rounded-lg ${type === "normal" ? "hover:bg-default" : "hover:bg-error"}`}
      onClick={onClick}
    >
      {icon}
    </button>
  );
};

const TitleBar = () => {
  const { isLoading, loadingMessage } = useUserProgressStore();

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

  /*
  -webkit-app-region은 Electron과 같은 웹 기반 데스크톱 애플리케이션에서 창의 특정 부분을 드래그 가능하게 만드는 비표준 CSS 속성입니다. 
  React에서 인라인 스타일로 사용할 때는 TypeScript가 이 속성을 인식하지 못할 수 있으므로 as React.CSSProperties로 타입 단언을 해주는 것이 좋습니다. */
  return (
    <div
      className="sticky flex justify-between items-center w-full h-10 bg-bg text-white ps-4"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties} // 드래그 가능 영역으로 설정
    >
      <div className="flex items-center justify-center w-fit gap-2.5 px-1">
        <img
          src={logo}
          alt="Logo"
          className="w-5 h-5 object-cover"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties} // 드래그 불가능 영역으로 설정
        />
        <h1 className="font-pre-bold text-sm text-[#fff]">MAIL @</h1>

        <div className="flex items-center justify-center w-fit h-10">
          <div className="flex items-center justify-center w-10 h-10">
            <LoadingSpinner
              isLoading={isLoading}
              className="w-4 h-4 border-t-[#ffffff] border-2 rounded-full"
            />
          </div>
          {loadingMessage && (
            <span className="flex justify-center items-center text-xs text-[#ffffff] font-pre-regular">
              {loadingMessage}
            </span>
          )}
        </div>
      </div>

      <nav
        className="flex items-center h-full gap-1 pe-3"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties} // 드래그 불가능 영역으로 설정
      >
        <TopButton
          icon={
            <ReloadIcon
              width={16}
              height={16}
              strokeColor="#ffffff"
              strokeWidth={2}
            />
          }
          type="normal"
          onClick={handleReload}
        />
        <TopButton
          icon={
            <MinimizeIcon
              width={20}
              height={20}
              strokeColor="#ffffff"
              strokeWidth={2}
            />
          }
          type="normal"
          onClick={handleMinimize}
        />
        <TopButton
          icon={
            <MaximizeIcon
              width={16}
              height={16}
              strokeColor="#ffffff"
              strokeWidth={2}
            />
          }
          type="normal"
          onClick={handleToggleMaximize}
        />
        <TopButton
          icon={
            <CloseIcon
              width={20}
              height={20}
              strokeColor="#ffffff"
              strokeWidth={1}
            />
          }
          type="close"
          onClick={handleClose}
        />
      </nav>
    </div>
  );
};

export default TitleBar;
