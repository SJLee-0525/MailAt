import logo from "@assets/images/logo.png";

const Welcome = () => {
  return (
    <div className="flex flex-col justify-center items-center w-full h-full gap-8 font-pre-regular">
      <div className="w-fit h-fit flex flex-col items-center justify-center gap-4">
        <img src={logo} alt="Logo" className="w-80 h-80 object-cover" />
        <h1 className="text-4xl font-pre-bold">
          MAIL@에 오신 것을 환영합니다!
        </h1>
      </div>

      <button className="rounded-full px-6 py-2 bg-theme font-pre-bold text-white text-center text-lg hover:bg-theme-hover active:bg-theme-active focus:bg-theme-focus disabled:bg-theme-disabled disabled:text-theme-disabled-text">
        시작하기
      </button>
    </div>
  );
};

export default Welcome;
