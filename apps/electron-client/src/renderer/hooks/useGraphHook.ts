import { useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  //   useInfiniteQuery,
  //   InfiniteData,
} from "@tanstack/react-query";

import { RawNode, GraphIpcResponse } from "@/types/graphType";

import useAuthenticateStore from "@stores/authenticateStore";
import useConversationsStore from "@stores/conversationsStore";

import {
  readGraphNode,
  createGraphNode,
  deleteGraphNode,
  renameGraphNode,
  mergeGraphNode,
} from "@apis/graphApi";

// const PAGE_SIZE = 5;

export const useGetGraphNode = ({
  C_ID,
  C_type,
  IO_type,
  enabled = true, // 추가: fetch 활성화 제어용 플래그
}: {
  C_ID: number;
  C_type: number;
  IO_type: number;
  enabled?: boolean;
}) => {
  const { user } = useAuthenticateStore();
  const { setGraphData } = useConversationsStore();

  const userId = user?.userId;

  const query = useQuery<RawNode[], Error>({
    queryKey: ["graph", userId, C_ID, C_type, IO_type],
    queryFn: () => {
      if (!userId || !user) {
        return Promise.reject(
          new Error("User ID is required for graph query.")
        );
      }

      return readGraphNode({ C_ID, C_type, IO_type });
    },
    enabled: !!userId && enabled, // userId가 있고, enabled 플래그가 true일 때만 fetch
    throwOnError: true,
  });

  useEffect(() => {
    if (query.isSuccess && query.data) {
      setGraphData(query.data);
    }
  }, [query.data, query.isSuccess, setGraphData]);

  return query;
};

export const useCreateGraphNode = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthenticateStore();

  const userId = user?.userId;

  const mutation = useMutation<
    { status: "success" | "fail"; message: string },
    Error,
    { C_name: string }
  >({
    mutationFn: (variables) => {
      // Pass user to createGraphNode
      if (!user) {
        return Promise.reject(
          new Error("User not authenticated for creating node.")
        );
      }
      return createGraphNode({ ...variables, user });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph", userId] });
    },
    onError: (error) => {
      console.error("Error creating graph node:", error);
    },
  });

  return mutation;
};

export const useDeleteGraphNode = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthenticateStore();

  // if (!user) { // Redundant
  //   throw new Error("User not authenticated");
  // }

  const userId = user?.userId;

  const mutation = useMutation<
    GraphIpcResponse,
    Error,
    { C_ID: number; C_type: number }
  >({
    mutationFn: (variables) => {
      // Pass user to deleteGraphNode
      if (!user) {
        return Promise.reject(
          new Error("User not authenticated for deleting node.")
        );
      }
      return deleteGraphNode({ ...variables, user });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph", userId] });
    },
    onError: (error) => {
      console.error("Error deleting graph node:", error);
    },
  });

  return mutation;
};

// 노드 이름 수정
export const useRenameGraphNode = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthenticateStore();

  const userId = user?.userId;

  const mutation = useMutation<
    GraphIpcResponse,
    Error,
    {
      C_ID: number;
      C_type: number;
      after_name: string;
    }
  >({
    mutationFn: (variables) => {
      if (!user) {
        return Promise.reject(
          new Error("User not authenticated for renaming node.")
        );
      }
      return renameGraphNode({ ...variables, user });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph", userId] });
    },
    onError: (error) => {
      console.error("Error renaming graph node:", error);
    },
  });

  return mutation;
};

export const useMergeGraphNode = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthenticateStore();

  // if (!user) { // Redundant
  //   throw new Error("User not authenticated");
  // }

  const userId = user?.userId;

  const mutation = useMutation<
    GraphIpcResponse,
    Error,
    {
      C_ID1: number;
      C_type1: number;
      C_ID2: number;
      C_type2: number;
      after_name: string;
    }
  >({
    mutationFn: (variables) => {
      // Pass user to mergeGraphNode
      if (!user) {
        return Promise.reject(
          new Error("User not authenticated for merging node.")
        );
      }
      return mergeGraphNode({ ...variables });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph", userId] });
    },
    onError: (error) => {
      console.error("Error merging graph node:", error);
    },
  });

  return mutation;
};
