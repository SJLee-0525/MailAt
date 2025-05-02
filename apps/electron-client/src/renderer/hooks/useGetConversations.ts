import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmailConversation } from "@/types/emailTypes";

import { getUserRecordList } from "@apis/recordApi";

import useConversationsStore from "@stores/conversationsStore";

export const useGetConversations = (userId: string) => {
  const { setConversations } = useConversationsStore();

  const query = useQuery<EmailConversation[]>({
    queryKey: ["conversations", userId],
    queryFn: () => getUserRecordList(userId),
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
