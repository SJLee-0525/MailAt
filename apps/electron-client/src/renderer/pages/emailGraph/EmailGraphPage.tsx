import { useState } from "react";

// import { resetGraph } from "@apis/graphApi";
// import { useGetGraphNode } from "@hooks/useGraphHook";

import useAuthenticateStore from "@stores/authenticateStore";
import useConversationsStore from "@stores/conversationsStore";

import EmailGraph from "@pages/emailGraph/EmailGraph";

const NetworkPage = () => {
  const { user, selectedUser, authUsers } = useAuthenticateStore();
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

  // resetGraph(); // 그래프 초기화
  // const { refetch: refetchNode } = useGetGraphNode({
  //   ...queryParams,
  //   enabled: enableInitialFetch, // Controlled by state
  // });

  // useEffect(() => {
  //   // 최초 1회 fetch 시에만 refetchNode() 호출
  //   if (enableInitialFetch) {
  //     refetchNode();
  //   }
  // }, []);

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
      setGraphData([...graphData]);
    }
    setSelected(null);
  };

  // 병합 이벤트 핸들러 (현재는 로깅만)
  function handleMerge(srcId: number, tgtId: number) {
    console.log("Merge", srcId, tgtId);
  }

  console.log("Graph data:", graphData);
  console.log("!!!!", user, authUsers);

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
          onSelect={(id) => {
            setSelected(id);
            console.log(
              "Node selected, simulating re-feed of graph data for node ID:",
              id
            );
            if (graphData) {
              setGraphData([...graphData]);
            }
          }}
          onMerge={handleMerge}
          onNavigateBack={handleNavigateBack} // 뒤로가기 핸들러 전달
        />
      )}
    </div>
  );
};

export default NetworkPage;
