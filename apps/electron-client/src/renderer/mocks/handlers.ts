import { http, HttpResponse } from "msw";

import {
  mockEmailConversations,
  // mockEmailThreadConservation,
} from "@data/EMAIL_CONSERVATIONS";
import { ACCOUNTS_DATA } from "@data/USER_DATA";

const { VITE_DEV_API_URL } = import.meta.env;

const handlers = [
  // 사용자 추가
  http.post(VITE_DEV_API_URL + "/user", async ({ request }) => {
    const { username } = (await request.json()) as { username: string };
    return HttpResponse.json({ id: "1", username });
  }),

  // 사용자 조회
  http.get(VITE_DEV_API_URL + "/user/:userId", () => {
    // const { userId } = params;
    return HttpResponse.json();
    // return HttpResponse.json({ id: userId, username: "testUser" });
  }),

  // 사용자 수정
  http.patch(
    VITE_DEV_API_URL + "/user/:userId",
    async ({ params, request }) => {
      const { userId } = params;
      const { username } = (await request.json()) as { username: string };
      return HttpResponse.json({ id: userId, username });
    }
  ),

  // 사용자 삭제
  http.delete(VITE_DEV_API_URL + "/user/:userId", () => {
    return HttpResponse.json({ success: true });
  }),

  // 계정 추가
  http.post(VITE_DEV_API_URL + "/accounts", async ({ request }) => {
    const { email } = (await request.json()) as {
      email: string;
      password: string;
    };
    return HttpResponse.json({ id: 1, email });
  }),

  // 계정 조회
  http.get(VITE_DEV_API_URL + "/accounts", () => {
    return HttpResponse.json(ACCOUNTS_DATA);
  }),

  // 계정 삭제
  http.delete(VITE_DEV_API_URL + "/accounts/:accountId", () => {
    return HttpResponse.json({ success: true });
  }),

  // 폴더 목록 조회
  http.get(VITE_DEV_API_URL + "/folders/:accoundId", () => {
    return HttpResponse.json(["INBOX", "SENT", "DRAFT", "TRASH", "SPAM"]);
  }),

  // 이메일 전체 조회
  http.get(VITE_DEV_API_URL + "/emails", () => {
    return HttpResponse.json(mockEmailConversations);
  }),

  // 이메일 상세 조회
  http.get(VITE_DEV_API_URL + "/emails/:emailId", ({ params }) => {
    const { emailId } = params;

    return HttpResponse.json(mockEmailConversations[Number(emailId)]);
  }),

  // 이메일 스레드로 전체 조회
  http.get(
    VITE_DEV_API_URL + "/emails/thread/:threadId",
    (
      {
        // params
      }
    ) => {
      // const { threadId } = params;

      return HttpResponse
        .json
        // mockEmailThreadConservation
        ();
    }
  ),

  // 이메일 삭제
  http.delete(VITE_DEV_API_URL + "/emails/:emailId", () => {
    return HttpResponse.json({ success: true });
  }),

  // 읽음 표시
  http.patch(VITE_DEV_API_URL + "/emails/:emailId/read", () => {
    return HttpResponse.json({ success: true });
  }),

  // 이메일 전송
  http.post(VITE_DEV_API_URL + "/emails/send", () => {
    return HttpResponse.json({
      success: true,
      messageId: "12345",
    });
  }),
];

export default handlers;
