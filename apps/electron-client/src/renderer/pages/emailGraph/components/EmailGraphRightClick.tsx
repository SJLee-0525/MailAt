import { useRef, useEffect } from "react";

import { GraphNode } from "@/types/graphType";

interface CtxMenuState {
  visible: boolean;
  x: number;
  y: number;
  node: GraphNode | null;
}

const EmailGraphRightClick = ({
  ctxMenu,
  setCtxMenu,
}: {
  ctxMenu: CtxMenuState;
  setCtxMenu: React.Dispatch<React.SetStateAction<CtxMenuState>>;
}) => {
  const htmlRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 메뉴가 보이지 않으면 리스너를 추가하지 않음
    if (!ctxMenu.visible) return;

    function handleClickOutside(event: MouseEvent) {
      if (htmlRef.current && !htmlRef.current.contains(event.target as Node)) {
        // 클릭한 곳이 메뉴 외부일 때
        setCtxMenu((m) => ({ ...m, visible: false }));
      }
    }

    //  캡처 단계에서 실행되도록: 이벤트가 다른 요소로 전달되기 전에 이 리스너가 먼저 실행, 클릭 위치가 메뉴 외부인지 확인 가능.
    document.addEventListener("mousedown", handleClickOutside, true);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, [ctxMenu.visible, setCtxMenu]);

  return (
    <div
      ref={htmlRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-md shadow-lg min-w-[140px] font-pre-medium text-sm"
      style={{ left: ctxMenu.x, top: ctxMenu.y }}
      onContextMenu={(e) => e.preventDefault()} // 메뉴 위에서 또 우클릭 막기
    >
      <ul>
        <li
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => {
            console.log("전체 조회 :", ctxMenu.node);
            setCtxMenu((m) => ({ ...m, visible: false }));
          }}
        >
          전체 조회
        </li>
        <li
          className="px-4 py-2 text-red-600 hover:bg-gray-100 cursor-pointer"
          onClick={() => {
            console.log("삭제 :", ctxMenu.node);
            setCtxMenu((m) => ({ ...m, visible: false }));
          }}
        >
          삭제
        </li>
        {/* 필요하면 추가 옵션 */}
      </ul>
    </div>
  );
};

export default EmailGraphRightClick;
