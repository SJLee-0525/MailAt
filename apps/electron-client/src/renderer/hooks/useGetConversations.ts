import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { AllEmails } from "@/types/emailTypes";

import useAuthenticateStore from "@stores/authenticateStore";

import { getEmailsData, deleteEmail } from "@apis/emailApi";

import useConversationsStore from "@stores/conversationsStore";

export const useGetAllEmails = () => {
  const { user } = useAuthenticateStore();
  const { setConversations, filters } = useConversationsStore();

  const userId = user?.id || null;

  const query = useQuery<AllEmails[]>({
    queryKey: ["emails", userId, filters],
    queryFn: () => getEmailsData({ userId, filters }),
    enabled: !!userId, // userId가 truthy(빈 문자열이 아님)일 때만 활성화
    throwOnError: true,
  });

  useEffect(() => {
    if (query.data) {
      setConversations(query.data);
    }
  }, [query.data, setConversations]);

  return query;
};

export const useDeleteEmail = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    { success: boolean },
    Error,
    { emailId: string }
  >({
    mutationFn: deleteEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
    onError: (error) => {
      console.error("Error deleting email:", error);
      alert("이메일 삭제에 실패했습니다.");
    },
  });

  return mutation;
};
