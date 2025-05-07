import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { AllEmails } from "@/types/emailTypes";

import { getEmailsData, deleteEmail } from "@apis/emailApi";

import useConversationsStore from "@stores/conversationsStore";

export const useGetAllEmails = (userId: string) => {
  const { setConversations } = useConversationsStore();

  const query = useQuery<AllEmails[]>({
    queryKey: ["emails"],
    queryFn: () => getEmailsData(userId),
    enabled: !!userId,
    throwOnError: true,
    staleTime: 1000 * 60 * 5, // 5분
  });

  useEffect(() => {
    if (query.data) {
      console.log("Conversations data:", query.data);

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
    { emailId: number }
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
