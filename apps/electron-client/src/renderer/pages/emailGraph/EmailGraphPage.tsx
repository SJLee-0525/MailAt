import { useState } from "react";

import { useGetGraphNode } from "@hooks/useGraphHook";

import useConversationsStore from "@stores/conversationsStore";

import EmailGraph from "@pages/emailGraph/EmailGraph";

const NetworkPage = () => {
  const { graphData, setGraphData } = useConversationsStore();
  const [selected, setSelected] = useState<number | null>(null);

  // 최초 1회 fetch 여부 제어용 state
  const [enableInitialFetch, setEnableInitialFetch] = useState(true);
  // 쿼리 파라미터 상태 (기본값: 내 노드)
  const [queryParams, setQueryParams] = useState({
    C_ID: 0,
    C_type: 0,
    IO_type: 0,
  });

  // const { refetch: refetchNode } = useGetGraphNode({
  //   ...queryParams,
  //   enabled: enableInitialFetch, // Controlled by state
  // });

  // 파라미터 기반으로 새로운 노드를 수동 요청
  async function fetchNodeWithNewParams(params: {
    C_ID?: number;
    C_type?: number;
    IO_type?: number;
  }) {
    setEnableInitialFetch(false); // 수동 호출 시 자동 fetch 비활성화
    setQueryParams((currentParams) => ({ ...currentParams, ...params }));
    // 실제 API를 호출하려면 아래에 refetchNode() 삽입
    console.log("Fetching new graph data with params:", params);
    // TODO: 실제 데이터 요청 후 setGraphData(newData) 호출
  }

  // 뒤로가기 처리: 현재 그래프를 재설정 (새 ref로 전달)
  const handleNavigateBack = () => {
    console.log("Navigating back, simulating re-feed of graph data.");
    if (graphData) {
      setGraphData({
        ...graphData, // 다른 메타데이터 보존
        nodes: [...graphData.nodes], // 새로운 참조 생성
        emails: [...graphData.emails],
      });
    }
    setSelected(null);
  };

  // 병합 이벤트 핸들러 (현재는 로깅만)
  function handleMerge(srcId: number, tgtId: number) {
    console.log("Merge", srcId, tgtId);
  }

  return (
    <div className="flex w-full h-full justify-center items-center overflow-hidden">
      <EmailGraph
        rawNodes={graphData?.nodes || []} // null 방지
        rawEmails={graphData?.emails || []} // null 방지
        onSelect={(id) => {
          setSelected(id);
          console.log(
            "Node selected, simulating re-feed of graph data for node ID:",
            id
          );
          if (graphData) {
            setGraphData({
              ...graphData,
              nodes: [...graphData.nodes],
              emails: [...graphData.emails],
            });
          }
        }}
        onMerge={handleMerge}
        onNavigateBack={handleNavigateBack} // 뒤로가기 핸들러 전달
      />
    </div>
  );
};

export default NetworkPage;
