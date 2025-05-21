import { useEffect, useState } from "react";

import { GraphNode, SelectedGraph } from "@/types/graphType"; // Assuming GraphNode is exported from graphType

import useAuthenticateStore from "@stores/authenticateStore";
import useConversationsStore from "@stores/conversationsStore";
import useUserProgressStore from "@stores/userProgressStore";

import { useGetGraphNode, useMergeGraphNode } from "@hooks/useGraphHook";

import EmailGraph from "@pages/emailGraph/EmailGraph";

const NetworkPage = () => {
  const { user, authUsers } = useAuthenticateStore();
  const { graphData, setSelectedGraph, setGraphConversations } =
    useConversationsStore();
  const { setGraphInboxIsOpen } = useUserProgressStore();

  // 최초 1회 fetch 여부 제어용 state
  const [enableInitialFetch, setEnableInitialFetch] = useState(true);
  // 쿼리 파라미터 상태 (기본값: 내 노드)
  const [queryParams, setQueryParams] = useState({
    C_ID: 0,
    C_type: 0,
    IO_type: 3,
  });
  const [inParams, setInParams] = useState<{ C_ID: number; C_type: number }[]>(
    []
  );

  const { refetch: refetchGraphNode } = useGetGraphNode({
    ...queryParams,
    enabled: enableInitialFetch, // 최초 1회만 fetch하도록 제어
  });
  const { mutateAsync: mergeGraphNode } = useMergeGraphNode();

  useEffect(() => {
    if (!enableInitialFetch) {
      refetchGraphNode().finally(() => setEnableInitialFetch(false));
    }
  }, [enableInitialFetch]);

  // 뒤로가기 처리: 현재 그래프를 재설정 (새 ref로 전달)
  async function handleNavigateBack() {
    console.log("Navigating back, simulating re-feed of graph data.");

    if (inParams.length === 0) {
      console.log("No inParams to reset.");
      return;
    }

    const latestNode = inParams[inParams.length - 1];
    setInParams((prev) => prev.slice(0, -1)); // Remove last element

    setQueryParams({
      C_ID: latestNode.C_ID,
      C_type: latestNode.C_type,
      IO_type: 3,
    });
  }

  // 그래프 노드 선택 시 처리
  function handleNodeSelect({ C_ID, C_type, IO_type, In }: SelectedGraph) {
    setGraphConversations([]); // 선택된 노드에 따라 대화 내용 초기화
    setSelectedGraph({ C_ID, C_type, IO_type, In });
    setGraphInboxIsOpen(true);
  }

  // 노드 더블 클릭 시 처리
  function handleNodeDoubleClick(node: GraphNode) {
    const newParams = {
      C_ID: node.C_ID,
      C_type: node.C_type,
      IO_type: 3,
    };

    setEnableInitialFetch(true); // Ensure useEffect will trigger refetch
    setQueryParams(newParams);
    setInParams((prev) => [...prev, { C_ID: node.C_ID, C_type: node.C_type }]); // Add to inParams
  }

  // 초기 화면으로
  function handleInitialScreen() {
    setGraphConversations([]); // 대화 내용 초기화
    setSelectedGraph({ C_ID: 0, C_type: 0, IO_type: 3, In: [] }); // 초기화
    setGraphInboxIsOpen(false); // 그래프 인박스 닫기
    setInParams([]); // inParams 초기화
  }

  // 병합 이벤트 핸들러
  function handleMerge(srcName: string, tgtName: string) {
    console.log("Merge", srcName, tgtName);

    try {
      const response = mergeGraphNode({
        before_name1: srcName,
        before_name2: tgtName,
        after_name: srcName + tgtName,
      });
      console.log("Merge response:", response);
    } catch (error) {
      console.error("Error merging nodes:", error);
    }
  }

  // console.log("Graph data:", graphData);

  return (
    <div className="flex w-full h-full justify-center items-center overflow-hidden">
      {!user || authUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-full h-full bg-white rounded-lg">
          <h1 className="text-2xl font-bold">이메일 계정 추가가 필요합니다.</h1>
          <p className="text-gray-500">
            이메일 그래프를 확인하려면 로그인하세요.
          </p>
        </div>
      ) : (
        <EmailGraph
          rawNodes={graphData || []} // null 방지
          onSelect={handleNodeSelect}
          onDoubleClick={handleNodeDoubleClick}
          onInitialScreen={handleInitialScreen}
          onMerge={handleMerge}
          onNavigateBack={handleNavigateBack} // 뒤로가기 핸들러 전달
        />
      )}
    </div>
  );
};

export default NetworkPage;
