import { CreateAccountResponse } from "@/types/authType";

import useUserProgressStore from "@stores/userProgressStore";
import useModalStore from "@stores/modalStore";

import { useDeleteAccount } from "@hooks/useGetUser";

import IconButton from "@components/common/button/IconButton";

import GoogleIcon from "@assets/icons/GoogleIcon";
import NaverIcon from "@assets/icons/NaverIcon";
import MiniSettingIcon from "@assets/icons/MiniSettingsIcon";
import DeleteIcon from "@assets/icons/DeleteIcon";

const InnerList = ({
  user,
  onEdit,
}: {
  user: CreateAccountResponse;
  onEdit: (account: CreateAccountResponse | null) => void;
}) => {
  const { setLoading, setLoadingMessage, setCloseLoadingMessage } =
    useUserProgressStore();
  const { openAlertModal } = useModalStore();

  const { mutateAsync: deleteAccount } = useDeleteAccount();

  async function handleDelete() {
    if (!user) return;

    if (!confirm(`${user.email}\n계정을 삭제하시겠습니까?`)) return;

    setLoading(true);
    setLoadingMessage("계정 삭제 중...");

    try {
      const data = await deleteAccount({ accountId: user.accountId });

      if (data.success) {
        openAlertModal({
          title: "계정 삭제 성공",
          content: "계정이 삭제되었습니다.",
        });

        setLoading(false);
        setLoadingMessage("계정 삭제 성공");
        openAlertModal({
          title: "계정 삭제 성공",
          content: "계정이 삭제되었습니다.",
        });
      }
    } catch (error) {
      setLoading(false);
      setLoadingMessage("계정 삭제 실패");
      openAlertModal({
        title: "계정 삭제 실패",
        content: "계정 삭제에 실패했습니다.",
      });
      console.error("Error deleting account:", error);
    } finally {
      setCloseLoadingMessage();
    }
  }

  function findDomain(email: string) {
    const domain = email.split("@")[1].split(".")[0];

    if (domain === "gmail") {
      return "Gmail";
    } else if (domain === "naver") {
      return "Naver";
    }

    return domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  const domain = findDomain(user.email);

  return (
    <div className="flex items-center justify-between p-2 w-full">
      <div className="flex justify-center items-center px-1 gap-3 w-fit h-fit">
        <span className="bg-theme rounded-full p-2">
          {domain === "Gmail" ? (
            <GoogleIcon />
          ) : (
            <NaverIcon strokeColor="white" />
          )}
        </span>

        <div className="flex flex-col items-start justify-between w-fit h-full">
          <h3 className="font-pre-bold">{user.username}</h3>
          <p className="font-pre-medium text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-0.5 w-fit h-fit">
        <IconButton
          icon={<DeleteIcon />}
          className="p-2 hover:bg-red-200 rounded-full transition-all duration-300"
          onClick={() => {
            handleDelete();
          }}
        />
        <IconButton
          icon={<MiniSettingIcon />}
          className="p-2 hover:bg-blue-200 rounded-full transition-all duration-300"
          onClick={() => {
            onEdit(user);
          }}
        />
      </div>
    </div>
  );
};

const SettingsMailList = ({
  users,
  onEdit,
}: {
  users: CreateAccountResponse[];
  onEdit: (account: CreateAccountResponse | null) => void;
}) => {
  return (
    <div className="flex flex-col justify-center items-center p-1 gap-1 rounded-2xl border border-disable bg-white">
      {users.map((user, index) => (
        <span key={user.accountId} className="w-full h-fit">
          <InnerList user={user} onEdit={onEdit} />
          {users.length - 1 !== index && (
            <hr className="border-t border-light1 w-[95%]" />
          )}
        </span>
      ))}
    </div>
  );
};

export default SettingsMailList;
