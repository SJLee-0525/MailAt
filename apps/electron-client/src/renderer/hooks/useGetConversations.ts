import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { AllEmails } from "@/types/emailTypes";

import useAuthenticateStore from "@stores/authenticateStore";

import { getFolders, getEmailsData, deleteEmail } from "@apis/emailApi";

import useConversationsStore from "@stores/conversationsStore";

export const useGetEmailFolders = () => {
  const { user } = useAuthenticateStore();
  const { setFolders } = useConversationsStore();

  const COLOR_BOX = [
    "bg-red-200",
    "bg-blue-200",
    "bg-green-200",
    "bg-yellow-200",
    "bg-purple-200",
    "bg-pink-200",
    "bg-orange-200",
    "bg-teal-200",
    "bg-gray-200",
    "bg-indigo-200",
  ];

  const userId = user?.userId || 1;

  const query = useQuery<string[]>({
    queryKey: ["folders", userId],
    queryFn: () => getFolders({ accountId: userId }),
    enabled: !!userId, // userId가 truthy(빈 문자열이 아님)일 때만 활성화
    throwOnError: true,
  });

  useEffect(() => {
    if (query.data) {
      const foldersWithColor: Record<string, string> = {};

      query.data.forEach((folder, index) => {
        foldersWithColor[folder] = COLOR_BOX[index % COLOR_BOX.length];
      });

      console.log("폴더 색상 매핑:", foldersWithColor);
      setFolders(foldersWithColor);
    }
  }, [query.data, setFolders]);

  return query;
};

export const useGetAllEmails = () => {
  const { user } = useAuthenticateStore();
  const { setConversations, filters } = useConversationsStore();

  const userId = user?.userId || 1;

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
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
    onError: (error) => {
      console.error("Error deleting email:", error);
      alert("이메일 삭제에 실패했습니다.");
    },
  });

  return mutation;
};
