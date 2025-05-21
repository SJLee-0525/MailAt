import { useEffect } from "react";

import { GraphEmail } from "@/types/graphType";

import { readGraphMessage } from "@apis/graphApi";

import { useMarkEmailAsRead } from "@hooks/useGetConversations";

import useConservationsStore from "@stores/conversationsStore";
import userProgressStore from "@stores/userProgressStore";
import useAuthenticateStore from "@stores/authenticateStore";

import GraphInboxContent from "@pages/emailGraph/components/GraphInboxContent";
import GraphSpinner from "@pages/emailGraph/components/GraphSpinner";

const GraphInboxContents = () => {
  const { selectedGraph, graphConversations, setGraphConversations } =
    useConservationsStore();
  const {
    selectedMail,
    setSelectedMail,
    isLoading,
    setLoading,
    setLoadingMessage,
    setCloseLoadingMessage,
  } = userProgressStore();
  const { user, currentTheme } = useAuthenticateStore();

  const { mutateAsync: markEmailAsRead } = useMarkEmailAsRead();

  useEffect(() => {
    async function fetchGraphMessages() {
      if (!user || !selectedGraph) {
        // accountId 또는 selectedGraph가 없으면 API 호출을 하지 않고,
        // graphConversations를 빈 배열로 설정하여 이전 데이터를 지웁니다.
        setGraphConversations([]);
        return;
      }

      setLoading(true);
      setLoadingMessage("메일 목록을 불러오는 중입니다.");
      try {
        const response = await readGraphMessage(selectedGraph);
        if (!response) {
          // 응답이 없는 경우에도 graphConversations를 빈 배열로 설정합니다.
          setGraphConversations([]);

          setLoading(false);
          setLoadingMessage("메일 목록 불러오기 실패");
          setCloseLoadingMessage();
          return;
        }

        // Graph API에서 가져온 메시지 목록을 상태에 저장
        setGraphConversations(response);

        setLoading(false);
        setLoadingMessage("메일 목록 불러오기 완료");
        // setSelectedMail(null); // 이메일 목록이 변경되면 선택된 이메일 초기화 (선택 사항)
      } catch (error) {
        console.error("Error fetching graph messages:", error);
        // 에러 발생 시 graphConversations를 빈 배열로 설정합니다.
        setGraphConversations([]);
        setLoading(false);
        setLoadingMessage("메일 목록 불러오기 실패");
      } finally {
        setCloseLoadingMessage();
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

  if (isLoading && graphConversations.length === 0)
    return (
      <div className="flex items-center justify-center w-full h-full bg-white rounded-lg">
        <GraphSpinner theme={currentTheme} size={28} />
      </div>
    );

  return (
    <>
      {graphConversations && graphConversations.length === 0 ? (
        <div className="flex items-center justify-center w-full h-full bg-white rounded-lg">
          <p className="text-gray-500">메일이 없습니다.</p>
        </div>
      ) : (
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
      )}
    </>
  );
};

export default GraphInboxContents;
