import { CreateAccountResponse } from "@/types/authType";

const SettingEditAccount = ({
  account,
  onClose,
}: {
  account: CreateAccountResponse;
  onClose: () => void;
}) => {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // const formData = new FormData(e.currentTarget);
    // const data = Object.fromEntries(formData.entries());

    // console.log("Form Data:", data);
  }

  return (
    <div className="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] w-5/6 h-fit z-10 py-2 bg-white rounded-lg shadow-xl">
      <h1 className="font-pre-bold text-2xl px-8 mt-4">{account.email}</h1>

      <form
        className="flex flex-col items-center justify-center w-full h-fit gap-6 p-4 text-center font-pre-bold"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col items-center justify-center w-full h-fit gap-4 p-4 text-center font-pre-bold">
          <div className="flex flex-col items-start w-full h-fit gap-1">
            <label className="font-pre-bold text-xs">이름</label>
            <input
              type="text"
              name="name"
              defaultValue={account.username}
              className="w-full h-8 border-b-1 border-accept text-sm focus:outline-none focus:bg-gray-100"
            />
          </div>

          <div className="flex items-center justify-between w-full h-fit gap-2">
            <div className="flex flex-col items-start w-1/2 h-fit gap-1">
              <label className="font-pre-bold text-xs">IMAP Host</label>
              <input
                type="text"
                name="imapHost"
                defaultValue={account.imapHost}
                className="w-full h-8 border-b-1 border-accept text-sm focus:outline-none focus:bg-gray-100"
              />
            </div>

            <div className="flex flex-col items-start w-1/2 h-fit gap-1">
              <label className="font-pre-bold text-xs">IMAP Port</label>
              <input
                type="text"
                name="imapPort"
                className="w-full h-8 border-b-1 border-accept text-sm focus:outline-none focus:bg-gray-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between w-full h-fit gap-2">
            <div className="flex flex-col items-start w-1/2 h-fit gap-1">
              <label className="font-pre-bold text-xs">SMTP Host</label>
              <input
                type="text"
                name="smtpHost"
                defaultValue={account.smtpHost}
                className="w-full h-8 border-b-1 border-accept text-sm focus:outline-none focus:bg-gray-100"
              />
            </div>

            <div className="flex flex-col items-start w-1/2 h-fit gap-1">
              <label className="font-pre-bold text-xs">SMTP Port</label>
              <input
                type="text"
                name="smtpPort"
                className="w-full h-8 border-b-1 border-accept text-sm focus:outline-none focus:bg-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center w-full px-4 gap-4">
          <button
            type="button"
            className="w-full h-11 rounded-full text-white text-xs transition-all duration-200 bg-default hover:bg-theme"
            onClick={() => {
              onClose();
            }}
          >
            취소
          </button>
          <button
            type="submit"
            className="w-full h-11 rounded-full text-white text-xs transition-all duration-200 bg-accept hover:bg-theme"
          >
            수정
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingEditAccount;
