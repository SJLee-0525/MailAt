// src/App.tsx
import { useEffect } from "react";

import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import useAuthenticateStore from "@stores/authenticateStore";

import { getUser } from "@apis/userApi";

import MainLayout from "@layouts/MainLayout";
// import Home from "@pages/home/Home";
import EmailGraphPage from "@pages/emailGraph/EmailGraphPage";

import Alert from "@components/common/modal/Alert";
import NewMailFormModal from "@components/mailForm/NewMailFormModal";
import Modal from "@components/common/modal/Modal";

const queryClient = new QueryClient();

export default function App() {
  const { setUserName } = useAuthenticateStore();

  useEffect(() => {
    // Electron의 ipcRenderer를 사용하여 메인 프로세스와 통신
    console.log("[REACT] window.electronAPI:", window.electronAPI);

    // 로컬 스토리지에서 데이터 가져오기
    const storedData = localStorage.getItem("authenticate-storage");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      console.log(parsedData);

      const user = parsedData.state.user;
      setUserName(user);

      // 사용자 정보 가져오기
      // getUser(user.userId);
      getUser(1);
    }
  }, []);

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
}
