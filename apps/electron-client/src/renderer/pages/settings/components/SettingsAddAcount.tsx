import useAuthenticateStore from "@stores/authenticateStore";
import useUserProgressStore from "@stores/userProgressStore";
import useModalStore from "@stores/modalStore";

import { useCreateAccount } from "@hooks/useGetUser";

const SettingsAddAccount = ({ closeAction }: { closeAction: () => void }) => {
  const { setAuthUsers } = useAuthenticateStore();
  const { setLoading, setLoadingMessage, setCloseLoadingMessage } =
    useUserProgressStore();
  const { openAlertModal } = useModalStore();

  const { mutateAsync: createAccount } = useCreateAccount();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);

    const email = fd.get("email") as string;
    const domain = fd.get("domain") as string;
    const password = fd.get("password") as string;
    const imapHost = fd.get("imapHost") as string;
    const imapPort = fd.get("imapPort") as string;
    const smtpHost = fd.get("smtpHost") as string;
    const smtpPort = fd.get("smtpPort") as string;

    if (
      email.trim() === "" ||
      password.trim() === "" ||
      imapHost.trim() === "" ||
      imapPort.trim() === "" ||
      smtpHost.trim() === "" ||
      smtpPort.trim() === ""
    ) {
      openAlertModal({
        title: "입력 오류",
        content: "모든 필드를 입력해주세요.",
      });
      return;
    }

    const payload = {
      email: `${email}@${domain}`,
      password,
      imapHost,
      imapPort: Number(imapPort),
      smtpHost,
      smtpPort: Number(smtpPort),
    };

    // console.log("이메일 추가 payload", payload);

    // api 호출 (!!!!!!!추후 보완 필요)
    setLoading(true);
    setLoadingMessage("계정 추가 중...");

    try {
      const response = await createAccount(payload);

      if (response.success) {
        setLoading(false);
        setLoadingMessage("계정 추가 성공");

        openAlertModal({
          title: "계정 추가 성공",
          content: "계정이 추가되었습니다.",
        });
        setAuthUsers(response.data);

        closeAction(); // 계정 추가 후 모달 닫기
      } else {
        setLoading(false);
        setLoadingMessage("계정 추가 실패");

        openAlertModal({
          title: "계정 추가 실패",
          content: "계정 추가에 실패했습니다. 다시 시도해주세요.",
        });
      }
    } catch (error) {
      setLoading(false);
      setLoadingMessage("계정 추가 실패");

      openAlertModal({
        title: "계정 추가 실패",
        content: "계정 추가에 실패했습니다. 다시 시도해주세요.",
      });
      console.error("Error creating account:", error);
    } finally {
      setCloseLoadingMessage();
    }
  }

  return (
    <div className="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] w-5/6 h-fit z-10 py-2 border border-light1 bg-white rounded-lg shadow-xl">
      <h1 className="font-pre-bold text-2xl px-8 mt-4">계정 등록하기</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center justify-center w-full h-fit gap-4 p-4 text-center font-pre-bold"
      >
        <div className="flex flex-col items-center justify-center w-full h-fit gap-4 p-4 text-center font-pre-bold">
          <div className="flex flex-col items-start w-full h-fit gap-1">
            <label className="font-pre-bold text-xs px-1">이메일</label>
            <span className="flex items-center justify-between w-full bg-light1 rounded-lg">
              <input
                type="text"
                name="email"
                className="w-1/2 h-10 px-2 text-sm focus:outline-none"
              />
              <select
                name="domain"
                className="w-1/2 h-10 px-2 text-sm focus:outline-none"
              >
                <option value="gmail.com" className="text-[#000]">
                  @gmail.com
                </option>
                <option value="naver.com" className="text-[#000]">
                  @naver.com
                </option>
              </select>
            </span>
          </div>

          <div className="flex flex-col items-start w-full h-fit gap-1">
            <label className="font-pre-bold text-xs">앱 비밀번호</label>
            <input
              type="text"
              name="password"
              className="w-full h-10 px-2 text-sm bg-light1 rounded-lg"
            />
          </div>
          {/* imapHost: "imap.gmail.com",
          imapPort: 993,
          smtpHost: "smtp.gmail.com",
          smtpPort: 465, */}
          <div className="flex items-center justify-between w-full h-fit gap-2">
            <div className="flex flex-col items-start w-1/2 h-fit gap-1">
              <label className="font-pre-bold text-xs">IMAP Host</label>
              <input
                type="text"
                name="imapHost"
                className="w-full h-10 px-2 text-sm bg-light1 rounded-lg"
              />
            </div>

            <div className="flex flex-col items-start w-1/2 h-fit gap-1">
              <label className="font-pre-bold text-xs">IMAP Port</label>
              <input
                type="text"
                name="imapPort"
                className="w-full h-10 px-2 text-sm bg-light1 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-between w-full h-fit gap-2">
            <div className="flex flex-col items-start w-1/2 h-fit gap-1">
              <label className="font-pre-bold text-xs">SMTP Host</label>
              <input
                type="text"
                name="smtpHost"
                className="w-full h-10 px-2 text-sm bg-light1 rounded-lg"
              />
            </div>

            <div className="flex flex-col items-start w-1/2 h-fit gap-1">
              <label className="font-pre-bold text-xs">SMTP Port</label>
              <input
                type="text"
                name="smtpPort"
                className="w-full h-10 px-2 text-sm bg-light1 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center w-full px-4 gap-4">
          <button
            type="button"
            className="w-full h-11 rounded-full text-[#ffffff] text-xs transition-all duration-200 bg-default hover:bg-disable"
            onClick={closeAction}
          >
            취소
          </button>
          <button
            type="submit"
            className="w-full h-11 rounded-full text-[#ffffff] text-xs transition-all duration-200 bg-accept hover:bg-theme"
          >
            등록
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsAddAccount;
