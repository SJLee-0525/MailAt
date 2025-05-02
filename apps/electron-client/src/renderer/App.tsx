// src/App.tsx
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import MainLayout from "@layouts/MainLayout";
import Home from "@pages/home/Home";

import NewMailFormModal from "@components/mailForm/NewMailFormModal";

const queryClient = new QueryClient();

export default function App() {
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
    </QueryClientProvider>
  );
}
