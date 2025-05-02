import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
      "@apis": "/src/apis",
      "@assets": "/src/assets",
      "@components": "/src/components",
      "@pages": "/src/pages",
      "@hooks": "/src/hooks",
      "@layouts": "/src/layouts",
      "@stores": "/src/stores",
      "@utils": "/src/utils",
      "@data": "/src/data",
      "@types": "/src/types",
    },
  },
});
