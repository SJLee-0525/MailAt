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

// 폴더 목록 조회
export const useGetGraphNode = ({
  C_ID,
  C_type,
  IO_type,
  enabled: hookEnabled = true, // Renamed to avoid conflict, defaults to true
}: {
  C_ID: string;
  C_type: number;
  IO_type: number;
  enabled?: boolean; // Make it optional
}) => {
  const { user } = useAuthenticateStore();
  const { setGraphData } = useConversationsStore();

  const userId = user?.userId; // userId can be undefined if user is null

  const query = useQuery<RawNode[], Error>({
    // Include C_ID, C_type, IO_type in the queryKey to refetch when they change
    queryKey: ["graph", userId, C_ID, C_type, IO_type],
    queryFn: () => {
      if (!userId) {
        // This case should ideally be prevented by the `enabled` option
        return Promise.reject(
          new Error("User ID is required for graph query.")
        );
      }
      return readGraphNode({ C_ID, C_type, IO_type });
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

export const useCreateGraphNode = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthenticateStore();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const userId = user?.userId; // userId can be undefined if user is null

  const mutation = useMutation<
    { status: "success" | "fail"; message: string },
    Error,
    { C_name: string }
  >({
    mutationFn: createGraphNode,
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

  if (!user) {
    throw new Error("User not authenticated");
  }

  const userId = user?.userId; // userId can be undefined if user is null

  const mutation = useMutation<
    GraphIpcResponse,
    Error,
    { C_ID: string; C_type: number }
  >({
    mutationFn: deleteGraphNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph", userId] });
    },
    onError: (error) => {
      console.error("Error deleting graph node:", error);
    },
  });

  return mutation;
};

export const useRenameGraphNode = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthenticateStore();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const userId = user?.userId; // userId can be undefined if user is null

  const mutation = useMutation<
    GraphIpcResponse,
    Error,
    {
      before_name: string;
      after_name: string;
    }
  >({
    mutationFn: renameGraphNode,
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

  if (!user) {
    throw new Error("User not authenticated");
  }

  const userId = user?.userId; // userId can be undefined if user is null

  const mutation = useMutation<
    GraphIpcResponse,
    Error,
    { before_name1: string; before_name2: string; after_name: string }
  >({
    mutationFn: mergeGraphNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph", userId] });
    },
    onError: (error) => {
      console.error("Error merging graph node:", error);
    },
  });

  return mutation;
};
