import useAuthenticateStore from "@stores/authenticateStore";
import useUserProgressStore from "@stores/userProgressStore";
import useModalStore from "@stores/modalStore";

import { createUser } from "@apis/userApi";

const SettingsName = () => {
  const { setUserName } = useAuthenticateStore();
  const { setLoading, setLoadingMessage, setCloseLoadingMessage } =
    useUserProgressStore();
  const { openAlertModal } = useModalStore();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fd = new FormData(event.currentTarget);
    const name = Object.fromEntries(fd).name as string;

    if (name.trim() === "") {
      openAlertModal({
        title: "입력 오류",
        content: "이름을 입력해주세요.",
      });
      return;
    } else if (/\s/.test(name)) {
      openAlertModal({
        title: "입력 오류",
        content: "이름에 공백을 포함할 수 없습니다.",
      });
      return;
    }

    if (name.length > 10) {
      openAlertModal({
        title: "입력 오류",
        content: "이름은 10자 이하로 입력해주세요.",
      });
      return;
    } else if (name.length < 2) {
      openAlertModal({
        title: "입력 오류",
        content: "이름은 2자 이상으로 입력해주세요.",
      });
      return;
    }

    setLoading(true);
    setLoadingMessage("사용자 등록 중...");
    // api 호출
    try {
      const response = await createUser(name);
      // console.log(response);

      setLoading(false);
      setLoadingMessage("사용자 등록 성공");
      setUserName(response);
      openAlertModal({
        title: "사용자 등록 성공",
        content: `${name}님 환영합니다!`,
      });
    } catch (error) {
      console.error("Error creating user:", error);

      setLoading(false);
      setLoadingMessage("사용자 등록 실패");
      openAlertModal({
        title: "사용자 등록 실패",
        content: "사용자 등록에 실패했습니다. 다시 시도해주세요.",
      });
    } finally {
      setCloseLoadingMessage();
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
        className="w-14 aspect-[1/1] rounded-full text-white text-xs transition-all duration-200 bg-theme hover:bg-theme-dark"
      >
        등록
      </button>
    </form>
  );
};

export default SettingsName;
