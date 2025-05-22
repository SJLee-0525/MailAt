import axios from "axios";

const { VITE_DEV_API_URL } = import.meta.env;
console.log("VITE_DEV_API_U111RL", VITE_DEV_API_URL);

export const instance = axios.create({
  baseURL: VITE_DEV_API_URL,
  headers: {
    "Content-Type": "application/json; charset=UTF-8",
    "Access-Control-Allow-Origin": "*",
  },
});

export const aiInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// // 요청 인터셉터: JWT 토큰을 요청 헤더에 추가
// instance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("jwt");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // 응답 인터셉터
// instance.interceptors.response.use(
//   (response) => response, // 정상 응답은 그대로 반환
//   (error) => {
//     if (error.response && error.response.status === 403) {
//       console.warn("인증 실패, 로그인 페이지로 이동합니다.");

//       localStorage.removeItem("jwt"); // 로컬 스토리지에서 토큰 삭제

//       //로그인 페이지로 이동하는 이벤트 발생
//       const path = "/login";
//     }
//     return Promise.reject(error);
//   }
// );
