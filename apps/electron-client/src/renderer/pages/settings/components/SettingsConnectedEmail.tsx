import { useState } from "react";

import { CreateAccountResponse } from "@/types/authType";

import useAuthenticateStore from "@stores/authenticateStore";

// import { useGetAccounts } from "@hooks/useGetUser";

import SettingsMailList from "@pages/settings/components/SettingsMailList";
import SettingsAddAccount from "@pages/settings/components/SettingsAddAcount";
import SettingsEditAccount from "@pages/settings/components/SettingsEditAccount";

import Button from "@components/common/button/Button";

const SettingConnectedEmail = () => {
  const { user, authUsers } = useAuthenticateStore();

  const [isAddAccount, setIsAddAccount] = useState(false);
  const [isEditAccount, setIsEditAccount] =
    useState<CreateAccountResponse | null>(null);

  // const accountsQuery = useGetAccounts();

  return (
    <>
      {user && authUsers.length > 0 && (
        <div className="flex flex-col w-full h-fit gap-2 p-2 font-pre-bold">
          <hr className="border-t border-light3 w-full my-1" />

          <div className="flex flex-col w-full h-fit gap-2.5 py-2 font-pre-bold rounded-lg">
            <div className="flex items-center justify-between w-full h-fit px-1.5 text-center font-pre-bold">
              <h2 className="font-pre-bold text-lg">연결된 계정</h2>
              <Button
                type="button"
                content="추가"
                className="bg-theme text-[#ffffff] rounded-full text-xs"
                onAction={() => {
                  setIsAddAccount(true);
                }}
              />
            </div>
            <SettingsMailList users={authUsers} onEdit={setIsEditAccount} />
          </div>
        </div>
      )}
      {user && authUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center w-full h-36 gap-3 text-center font-pre-bold rounded-lg bg-white">
          <h2 className="font-pre-extra-bold text-center">
            연결된 계정이 없습니다.
          </h2>
          <Button
            type="button"
            content="계정 추가"
            className="h-10 bg-theme text-[#fff] rounded-full"
            onAction={() => {
              setIsAddAccount(true);
            }}
          />
        </div>
      )}
      {isAddAccount && (
        <SettingsAddAccount closeAction={() => setIsAddAccount(false)} />
      )}
      {isEditAccount && (
        <SettingsEditAccount
          account={isEditAccount}
          onClose={() => setIsEditAccount(null)}
        />
      )}
    </>
  );
};

export default SettingConnectedEmail;
