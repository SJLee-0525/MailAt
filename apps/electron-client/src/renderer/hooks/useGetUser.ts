import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { CreateAccountRequest, CreateAccountResponse } from "@/types/authType";

import { getAccounts, createAccount, deleteAccount } from "@apis/userApi";

import useAuthenticateStore from "@stores/authenticateStore";

export const useGetAccounts = () => {
  const { user, setAuthUsers } = useAuthenticateStore();

  const query = useQuery<CreateAccountResponse[]>({
    queryKey: ["accounts"],
    queryFn: () => getAccounts(),
    enabled: !!user,
    throwOnError: true,
    staleTime: 1000 * 60 * 30,
  });

  // 추후 보완 필요
  useEffect(() => {
    if (query.data) {
      console.log("Accounts data:", query.data);

      const accountsData = query.data.map((account) => {
        return {
          accountId: account.accountId,
          email: account.email,
          imapHost: account.imapHost,
          smtpHost: account.smtpHost,
          username: user ? user.username : "이름이 없어요",
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
    { success: boolean; data: CreateAccountResponse[] },
    Error,
    CreateAccountRequest
  >({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error) => {
      console.error("Error creating account:", error);
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
    },
  });

  return mutation;
};
