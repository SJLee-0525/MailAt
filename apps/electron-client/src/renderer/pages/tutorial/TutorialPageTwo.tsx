import "@pages/tutorial/Tutorial.css";

import { useState } from "react";

import useAuthenticateStore from "@stores/authenticateStore";
import useModalStore from "@stores/modalStore";

import { GRAPH_EMAIL_DATA } from "@data/GRAPH_EMAIL_DATA";

import { createUser } from "@apis/userApi";

import SideNav from "@components/common/nav/SideNav";
import HoverZone from "@layouts/HoverZone";
import TutorialGraph from "@pages/tutorial/components/TutorialGraph";

const TutorialPageTwo = ({
  settingName,
  //   setNextPage,
}: {
  settingName: string;
  //   setNextPage: () => void;
}) => {
  const { setUserName } = useAuthenticateStore();
  const { openAlertModal } = useModalStore();

  const [processIndex, setProcessIndex] = useState(0);

  const mockData = GRAPH_EMAIL_DATA.result;

  function handleNextProcess() {
    console.log("processIndex", processIndex);
    setProcessIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= 3) {
        handleSetUser();
      }

      return nextIndex;
    });
  }

  async function handleSetUser() {
    // api 호출
    try {
      const response = await createUser(settingName);
      setUserName(response);
      console.log("유저 등록 성공", response);

      //   window.location.reload();
    } catch (error) {
      console.error("Error creating user:", error);
      openAlertModal({
        title: "오류 발생",
        content: "잠시 후 다시 실행해 주세요.",
      });
      return;
    }
  }

  if (processIndex <= 1)
    return (
      <div className="w-full h-full" onClick={handleNextProcess}>
        {processIndex >= 0 && (
          <div className="w-full h-full pointer-events-none">
            <div className="flex w-full h-full font-pre-regular">
              <SideNav />
              <div className="relative flex-1 overflow-hidden">
                {processIndex >= 2 && (
                  <TutorialGraph
                    rawNodes={mockData.nodes}
                    rawEmails={mockData.emails}
                  />
                )}
                {processIndex === 0 && (
                  <p className="absolute top-10 left-5">
                    왼쪽에 이거 누르면 블라블라
                  </p>
                )}
                {processIndex === 1 && (
                  <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
                    <p className="text-2xl font-bold">
                      아래 이거하면 이메일 뭐시기
                    </p>
                  </div>
                )}
                {processIndex === 2 && (
                  <div className="absolute top-10 right-10 transform -translate-x-1/2">
                    <p className="text-2xl font-bold">그래프 뭐시기 어쩌구 !</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {processIndex >= 1 && <HoverZone />}
      </div>
    );

  return (
    <div className="w-full h-full">
      <div className="flex w-full h-full font-pre-regular">
        <SideNav />
        <div className="relative flex-1 overflow-hidden">
          <TutorialGraph
            rawNodes={mockData.nodes}
            rawEmails={mockData.emails}
            onMerge={
              (srcId: number, tgtId: number) => {
                openAlertModal({
                  title: "합치기",
                  content: `${srcId}와 ${tgtId}를 합쳤습니다.`,
                });
              } // 병합 처리
            }
          />

          <div className="absolute top-10 right-10 transform -translate-x-1/2 flex flex-col justify-start items-end">
            <p className="text-2xl font-bold">
              노드를 끌어서 합치면 뭐 이거 할 수 있어요
            </p>
            <button
              className="bg-theme px-4 py-1 rounded-full text-white "
              onClick={handleNextProcess}
            >
              튜토리얼 끝내기
            </button>
          </div>
        </div>
      </div>

      <HoverZone />
    </div>
  );
};

export default TutorialPageTwo;
