import { http, HttpResponse } from "msw";

import { mockEmailConversations } from "@data/EMAIL_CONSERVATIONS";

const { VITE_DEV_API_URL } = import.meta.env;

const handlers = [
  console.log("VITE_DEV_API_URL", VITE_DEV_API_URL),

  // 대화를 나눈 사용자 목록을 가져오는 API 핸들러
  http.get(VITE_DEV_API_URL + "/emails", () => {
    return HttpResponse.json(mockEmailConversations);
  }),

  // 이메일 상세 조회
  http.get(VITE_DEV_API_URL + "/emails/:emailId", ({ params }) => {
    const { emailId } = params;

    return HttpResponse.json(mockEmailConversations[Number(emailId)]);
  }),
];

export default handlers;
