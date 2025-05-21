import { useEffect } from "react";

import { GraphEmail } from "@/types/graphType";

import { readGraphMessage } from "@apis/graphApi";

import { useMarkEmailAsRead } from "@hooks/useGetConversations";

import useConservationsStore from "@stores/conversationsStore";
import userProgressStore from "@stores/userProgressStore";
import useAuthenticateStore from "@stores/authenticateStore";

import GraphInboxContent from "@pages/emailGraph/components/GraphInboxContent";

const GraphInboxContents = () => {
  const { selectedGraph, graphConversations, setGraphConversations } =
    useConservationsStore();
  const { selectedMail, setSelectedMail } = userProgressStore();
  const { user } = useAuthenticateStore();

  const { mutateAsync: markEmailAsRead } = useMarkEmailAsRead();

  useEffect(() => {
    async function fetchGraphMessages() {
      console.log(selectedGraph, 1);
      if (!user || !selectedGraph) {
        // accountId 또는 selectedGraph가 없으면 API 호출을 하지 않고,
        // graphConversations를 빈 배열로 설정하여 이전 데이터를 지웁니다.
        setGraphConversations([]);
        return;
      }

      console.log(selectedGraph, 2);
      try {
        const response = await readGraphMessage(selectedGraph);
        if (!response) {
          // 응답이 없는 경우에도 graphConversations를 빈 배열로 설정합니다.
          setGraphConversations([]);
          return;
        }

        // Graph API에서 가져온 메시지 목록을 상태에 저장
        setGraphConversations(response);
        // setSelectedMail(null); // 이메일 목록이 변경되면 선택된 이메일 초기화 (선택 사항)
      } catch (error) {
        console.error("Error fetching graph messages:", error);
        // 에러 발생 시 graphConversations를 빈 배열로 설정합니다.
        setGraphConversations([]);
      }
    }

    fetchGraphMessages();
  }, [selectedGraph, user, setGraphConversations]);

  async function openDetailEmail(email: GraphEmail) {
    if (email.isRead) {
      setSelectedMail({
        messageId: Number(email.message_id),
        fromEmail: email.fromEmail,
      });
      return;
    }

    try {
      const response = await markEmailAsRead({
        messageId: Number(email.message_id),
        isRead: true,
      });
      if (response.success) {
        setSelectedMail({
          messageId: Number(email.message_id),
          fromEmail: email.fromEmail,
        });
      }
    } catch (error) {
      console.error("Error marking email as read:", error);
    }
  }

  if (!graphConversations) return null;

  return (
    <div className="flex flex-col items-center justify-between w-full h-full pb-1.5 gap-1 bg-white rounded-lg">
      <div className="flex flex-col items-start w-full h-full px-2 gap-2 bg-white rounded-lg overflow-y-auto hide-scrollbar">
        {graphConversations.map((email) => {
          return (
            <GraphInboxContent
              key={email.message_id} // email이 null/undefined가 아니므로 messageId 접근이 비교적 안전해집니다.
              sentAt={email.sentAt}
              isRead={email.isRead}
              fromName={email.fromName}
              fromEmail={email.fromEmail}
              subject={email.subject}
              snippet={email.snippet}
              isSelected={
                selectedMail !== null &&
                selectedMail.messageId === Number(email.message_id)
              }
              onClick={() => openDetailEmail(email)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default GraphInboxContents;
