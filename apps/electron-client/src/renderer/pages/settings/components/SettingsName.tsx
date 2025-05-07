import useAuthenticateStore from "@stores/authenticateStore";

const SettingsName = () => {
  const { setUserName } = useAuthenticateStore();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fd = new FormData(event.currentTarget);
    const name = Object.fromEntries(fd).name as string;

    if (name.trim() === "") {
      alert("이름을 입력해주세요.");
      return;
    }

    if (name.length > 10) {
      alert("이름은 10자 이하로 입력해주세요.");
      return;
    } else if (name.length < 2) {
      alert("이름은 2자 이상으로 입력해주세요.");
      return;
    }

    setUserName(name);
  }
  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex items-center justify-center w-full h-fit gap-3 p-4 text-center font-pre-bold"
      >
        <input
          type="text"
          name="name"
          className="w-full h-10 px-2 border-b-1 border-accept text-sm"
        />
        <button
          type="submit"
          className="w-14 aspect-[1/1] rounded-full font-bold text-white text-xs transition-all duration-200 bg-accept hover:bg-theme"
        >
          등록
        </button>
      </form>
    </div>
  );
};

export default SettingsName;
