import "./index.css";

// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/App.tsx";

const basename = import.meta.env.VITE_BASE_URL || "/";

async function deferRender() {
  if (import.meta.env.DEV) {
    // const { worker } = await import("./mocks/browser.ts");
    // await worker.start();
  }
}

deferRender().then(() => {
  createRoot(document.getElementById("root")!).render(
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  );
});
