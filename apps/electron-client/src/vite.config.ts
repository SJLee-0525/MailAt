import { defineConfig, Plugin } from "vite"; // Plugin 추가
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs"; // fs 모듈 추가

// 사용자 정의 라우팅 플러그인
function multiPageRouting(): Plugin {
  return {
    name: "custom-multi-page-routing",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url;
        let htmlPath: string | null = null;
        let originalUrl = req.originalUrl || url; // transformIndexHtml 에 전달할 URL

        // 기본 경로 '/' 또는 '/renderer.html' 요청 시 renderer.html 제공 (React 앱)
        if (url === "/" || url === "/renderer.html") {
          htmlPath = path.resolve(__dirname, "renderer.html");
          originalUrl = "/renderer.html"; // React 앱의 기본 URL로 설정
        }
        // '/test' 또는 '/test/' 경로 요청 시 index.html 제공
        else if (url === "/test" || url === "/test/") {
          htmlPath = path.resolve(__dirname, "index.html"); // src/index.html 가정
          originalUrl = "/test/index.html"; // index.html의 기본 URL로 설정
        }
        // '/test/index.html' 직접 요청 시 index.html 제공
        else if (url === "/test/index.html") {
          htmlPath = path.resolve(__dirname, "index.html"); // src/index.html 가정
          originalUrl = "/test/index.html";
        }

        if (htmlPath && fs.existsSync(htmlPath)) {
          try {
            let html = fs.readFileSync(htmlPath, "utf-8");
            // Vite HTML 변환 적용 (스크립트 삽입 등)
            html = await server.transformIndexHtml(
              originalUrl as string,
              html,
              req.originalUrl
            );
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html");
            res.end(html);
            return; // 요청 처리 완료
          } catch (e) {
            console.error(
              `[MultiPageRouting] Error serving ${htmlPath} for URL ${url}:`,
              e
            );
            next(e); // 에러 전달
            return;
          }
        }

        // 일치하는 경로가 없으면 다음 미들웨어로 전달
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  root: path.resolve(__dirname), // src 폴더
  envDir: path.resolve(__dirname, ".."), // .env 파일이 있는 디렉토리 (src 상위)
  publicDir: path.resolve(__dirname, "../public"), // public 디렉토리 경로 명시적 지정
  base: "./", // 빌드 시 상대경로
  plugins: [
    react(),
    tailwindcss(),
    multiPageRouting(), // 사용자 정의 플러그인 추가
  ],
  build: {
    outDir: path.resolve(__dirname, "../../dist/renderer"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // 빌드 시 각 HTML 파일을 entry point로 지정
        // '/' 경로에 대한 빌드 결과는 renderer.html
        renderer: path.resolve(__dirname, "renderer.html"),
        // '/test' 경로에 대한 빌드 결과는 test/index.html (또는 원하는 경로 구조로 조정 가능)
        // 빌드 결과 파일 이름을 index.html로 하려면 키를 mainIndex 등으로 변경
        test: path.resolve(__dirname, "index.html"),
      },
      output: {
        // '/test' 경로의 빌드 결과물을 test 폴더 하위에 생성하려면 아래 주석 해제
        // entryFileNames: (chunkInfo) => {
        //   if (chunkInfo.name === 'test') {
        //     return 'test/index.html'; // 또는 'test.html' 등
        //   }
        //   return '[name].js'; // 기본 JS 파일 이름 형식
        // },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      // 절대 경로로 alias 지정 (더 명확함)
      "@": path.resolve(__dirname, "renderer"),
      "@apis": path.resolve(__dirname, "renderer/apis"),
      "@assets": path.resolve(__dirname, "renderer/assets"),
      "@components": path.resolve(__dirname, "renderer/components"),
      "@pages": path.resolve(__dirname, "renderer/pages"),
      "@hooks": path.resolve(__dirname, "renderer/hooks"),
      "@layouts": path.resolve(__dirname, "renderer/layouts"),
      "@stores": path.resolve(__dirname, "renderer/stores"),
      "@utils": path.resolve(__dirname, "renderer/utils"),
      "@data": path.resolve(__dirname, "renderer/data"),
      "@types": path.resolve(__dirname, "renderer/types"),
    },
  },
});
