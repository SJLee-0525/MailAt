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
    ["bg-red-200", "bg-red-500 text-white"],
    ["bg-blue-200", "bg-blue-500 text-white"],
    ["bg-green-200", "bg-green-500 text-white"],
    ["bg-yellow-200", "bg-yellow-500 text-white"],
    ["bg-purple-200", "bg-purple-500 text-white"],
    ["bg-pink-200", "bg-pink-500 text-white"],
    ["bg-gray-200", "bg-gray-500 text-white"],
    ["bg-orange-200", "bg-orange-500 text-white"],
    ["bg-teal-200", "bg-teal-500 text-white"],
    ["bg-indigo-200", "bg-indigo-500 text-white"],
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
      const foldersWithColor: Record<string, string[]> = {};

      query.data.forEach((folder, index) => {
        foldersWithColor[folder] = [
          COLOR_BOX[index % COLOR_BOX.length][0],
          COLOR_BOX[index % COLOR_BOX.length][1],
        ];
      });

      console.log("폴더 색상 매핑:", foldersWithColor);
      setFolders(foldersWithColor);
    }
  }, [query.data, setFolders]);

  return query;
};

export const useGetAllEmails = () => {
  const { user } = useAuthenticateStore();
  const {
    selectedFolder: folderName,
    setConversations,
    filters,
  } = useConversationsStore();

  const userId = user?.userId || 1;

  const query = useQuery<AllEmails[]>({
    queryKey: ["emails", userId, folderName, filters],
    queryFn: () => getEmailsData({ userId, folderName, filters }),
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
    { emailId: number }
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
