// src/App.tsx
import { useEffect } from "react";

import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import MainLayout from "@layouts/MainLayout";
import Home from "@pages/home/Home";

import Modal from "@components/common/modal/Modal";
import NewMailFormModal from "@components/mailForm/NewMailFormModal";

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    // Electron의 ipcRenderer를 사용하여 메인 프로세스와 통신
    console.log("[REACT] window.electronAPI:", window.electronAPI);
    console.log(window.electronAPI.user.create({ username: "test" }));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        {/* 모든 페이지에 공통 레이아웃 적용 */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="*" element={<div>Not Found</div>} />
        </Route>
      </Routes>

      <NewMailFormModal />
      <Modal />
    </QueryClientProvider>
  );
}
