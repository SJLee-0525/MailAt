import useAuthenticateStore from "@stores/authenticateStore";

const SettingAddAccount = ({ closeAction }: { closeAction: () => void }) => {
  const { userName, setAuthUsers } = useAuthenticateStore();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    if (email.trim() === "" || password.trim() === "") {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    console.log("이메일:", email);
    console.log("비밀번호:", password);

    setAuthUsers({
      id: Math.floor(Math.random() * 1000),
      email: email,
      name: userName || "홍지우",
    });

    closeAction(); // 계정 추가 후 모달 닫기
  }

  return (
    <div className="absolute flex flex-col items-center justify-center top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] w-5/6 h-fit z-10 py-12 bg-white rounded-lg shadow-xl">
      <h1 className="font-pre-bold text-2xl font-bold">계정 등록하기</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center justify-center w-full h-fit gap-3 p-4 text-center font-pre-bold"
      >
        <div className="flex flex-col items-center justify-center w-full h-fit gap-3 px-4 pt-4 text-center font-pre-bold">
          <div className="flex flex-col items-start w-full h-fit gap-1">
            <label className="font-pre-bold font-bold text-xs">이메일</label>
            <input
              type="email"
              name="email"
              className="w-full h-10 border-b-1 border-accept text-sm"
            />
          </div>

          <div className="flex flex-col items-start w-full h-fit gap-1">
            <label className="font-pre-bold font-bold text-xs">비밀번호</label>
            <input
              type="password"
              name="password"
              className="w-full h-10 border-b-1 border-accept text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-full font-bold text-white text-xs transition-all duration-200 bg-accept hover:bg-theme"
          >
            등록
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingAddAccount;
