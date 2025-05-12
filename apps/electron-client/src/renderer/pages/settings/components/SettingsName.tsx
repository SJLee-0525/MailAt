import useAuthenticateStore from "@stores/authenticateStore";

import { createUser } from "@apis/userApi";

const SettingsName = () => {
  const { setUserName } = useAuthenticateStore();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fd = new FormData(event.currentTarget);
    const name = Object.fromEntries(fd).name as string;

    if (name.trim() === "") {
      alert("이름을 입력해주세요.");
      return;
    } else if (/\s/.test(name)) {
      alert("이름에 공백을 포함할 수 없습니다.");
      return;
    }

    if (name.length > 10) {
      alert("이름은 10자 이하로 입력해주세요.");
      return;
    } else if (name.length < 2) {
      alert("이름은 2자 이상으로 입력해주세요.");
      return;
    }

    // api 호출
    try {
      const response = await createUser(name);
      console.log(response);
      setUserName(response);
      alert(`${response.username}님 환영합니다!`);
    } catch (error) {
      console.error("Error creating user:", error);
      alert("사용자 생성에 실패했습니다.");
      return;
    }
  }
  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center justify-center w-full h-fit gap-3 p-4 text-center font-pre-bold"
    >
      <input
        type="text"
        name="name"
        className="w-full h-10 px-2 border-b-1 border-theme text-sm focus:outline-none"
      />
      <button
        type="submit"
        className="w-14 aspect-[1/1] rounded-full font-bold text-white text-xs transition-all duration-200 bg-theme hover:bg-theme-dark"
      >
        등록
      </button>
    </form>
  );
};

export default SettingsName;
