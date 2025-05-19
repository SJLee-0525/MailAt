import { useEffect } from "react";
import {
  useQuery,
  //   useMutation,
  //   useInfiniteQuery,
  //   useQueryClient,
  //   InfiniteData,
} from "@tanstack/react-query";

import { GraphData } from "@/types/graphType";

import useAuthenticateStore from "@stores/authenticateStore";
import useConversationsStore from "@stores/conversationsStore";

import { readNode } from "@apis/graphApi";

// const PAGE_SIZE = 5;

// 폴더 목록 조회
export const useGetGraphNode = ({
  C_ID,
  C_type,
  IO_type,
  enabled: hookEnabled = true, // Renamed to avoid conflict, defaults to true
}: {
  C_ID: number;
  C_type: number;
  IO_type: number;
  enabled?: boolean; // Make it optional
}) => {
  const { user } = useAuthenticateStore();
  const { setGraphData } = useConversationsStore();

  const userId = user?.userId; // userId can be undefined if user is null

  const query = useQuery<GraphData, Error>({
    // Include C_ID, C_type, IO_type in the queryKey to refetch when they change
    queryKey: ["graph", userId, C_ID, C_type, IO_type],
    queryFn: () => {
      if (!userId) {
        // This case should ideally be prevented by the `enabled` option
        return Promise.reject(
          new Error("User ID is required for graph query.")
        );
      }
      return readNode({ C_ID, C_type, IO_type });
    },
    // Query is enabled if userId exists AND hookEnabled is true
    enabled: !!userId && hookEnabled,
    throwOnError: true, // Consider if this is always desired
  });

  useEffect(() => {
    if (query.isSuccess && query.data) {
      // Basic check for data structure, can be more specific
      if (
        typeof query.data === "object" &&
        query.data !== null &&
        "nodes" in query.data &&
        "emails" in query.data
      ) {
        // setGraphData(query.data);
      } else {
        // console.warn("Data from readNode is not in the expected GraphData format:", query.data);
        // Optionally handle incorrect data format, e.g., by setting graphData to null or an empty state
        // setGraphData(null);
      }
    }
  }, [query.isSuccess, query.data, setGraphData]);

  return query;
};
