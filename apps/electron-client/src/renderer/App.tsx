// src/App.tsx
import { useState, useEffect } from "react";

import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import useAuthenticateStore from "@stores/authenticateStore";

import { getUser } from "@apis/userApi";

import TutorialLayout from "@layouts/TutorialLayout";

import MainLayout from "@layouts/MainLayout";
// import Home from "@pages/home/Home";
import EmailGraphPage from "@pages/emailGraph/EmailGraphPage";

import Alert from "@components/common/modal/Alert";
import NewMailFormModal from "@components/mailForm/NewMailFormModal";
import Modal from "@components/common/modal/Modal";

const queryClient = new QueryClient();

const App = () => {
  const { setUserName } = useAuthenticateStore();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Electron의 ipcRenderer를 사용하여 메인 프로세스와 통신
    console.log("[REACT] window.electronAPI:", window.electronAPI);

    // 로컬 스토리지에서 데이터 가져오기
    const storedData = localStorage.getItem("authenticate-storage");
    if (storedData) {
      async function getUserIdFromStorage(storedData: string) {
        const parsedData = JSON.parse(storedData);
        console.log(parsedData);

        const user = parsedData.state.user;
        setUserName(user);

        // 사용자 정보 가져오기
        const response = await getUser(1);
        console.log("App.tsx - getUser response:", response);
        if (response.success) {
          setUserName(user); // 사용자 이름을 상태에 저장
          setIsLoggedIn(true); // 로그인 상태 업데이트

          return true;
        }

        // 사용자 정보 가져오기 실패
        setIsLoggedIn(false); // 로그인 상태 업데이트
        return false;
      }

      getUserIdFromStorage(storedData);
    }
  }, []);

  // 로그인 상태에 따라 다른 페이지 렌더링
  if (!isLoggedIn) {
    return (
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/renderer.html" element={<TutorialLayout />} />
        </Routes>

        <Alert />
      </QueryClientProvider>
    ); // 로그인 페이지 컴포넌트로 대체
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        {/* 모든 페이지에 공통 레이아웃 적용 */}
        <Route path="/renderer.html" element={<MainLayout />}>
          {/* <Route index element={<Home />} /> */}
          <Route index element={<EmailGraphPage />} />
          <Route path="*" element={<div>Not Found</div>} />
        </Route>
      </Routes>

      {/* 모달 컴포넌트들 */}
      <Alert />
      <NewMailFormModal />
      <Modal />
    </QueryClientProvider>
  );
};

export default App;
