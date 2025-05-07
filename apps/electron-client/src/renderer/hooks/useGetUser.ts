import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getAccounts, createAccount, deleteAccount } from "@apis/userApi";

import {
  AccountsResponse,
  CreateAccountRequest,
  CreateAccountResponse,
} from "@/types/authType";

import useAuthenticateStore from "@stores/authenticateStore";

export const useGetAccounts = (userId: number) => {
  const { user, setAuthUsers } = useAuthenticateStore();

  const query = useQuery<AccountsResponse[]>({
    queryKey: ["accounts"],
    queryFn: () => getAccounts(userId!),
    enabled: userId !== -1,
    throwOnError: true,
    staleTime: 1000 * 60 * 30,
  });

  // 추후 보완 필요
  useEffect(() => {
    if (query.data) {
      console.log("Accounts data:", query.data);

      const accountsData = query.data.map((account) => {
        return {
          id: account.id,
          email: account.email,
          name: user ? user.username : "이름이 없어요",
        };
      });

      setAuthUsers(accountsData);
    }
  }, [query.data, setAuthUsers]);

  return query;
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    CreateAccountResponse,
    Error,
    CreateAccountRequest
  >({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error) => {
      console.error("Error creating account:", error);
      alert("계정 추가에 실패했습니다.");
    },
  });

  return mutation;
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    { success: boolean },
    Error,
    { accountId: number }
  >({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error) => {
      console.error("Error deleting account:", error);
      alert("계정 삭제에 실패했습니다.");
    },
  });

  return mutation;
};
