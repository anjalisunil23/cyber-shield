import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { investigationApi } from "@/services/investigationApi";
import type { ChatConversation, ChatMessage } from "@/services/types";
import { isCurrentUser } from "@/components/chat/ChatInterface";

const LOCAL_STORAGE_MSGS_PREFIX = "cybershield_chat_msgs_";
const LOCAL_STORAGE_READ_PREFIX = "cybershield_chat_last_read_";
const CHAT_SYNC_CHANNEL = "cybershield_chat_live_sync";

function getLocalMessages(convId: string): ChatMessage[] {
  if (typeof window === "undefined" || !convId) return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_MSGS_PREFIX}${convId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLastReadTimestamp(convId: string, userId?: string): number {
  if (typeof window === "undefined" || !convId) return 0;
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_READ_PREFIX}${userId || "user"}_${convId}`);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function useUnreadChatCount(): number {
  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: () => investigationApi.me(),
    retry: false,
  });
  const currentUserId = meQ.data?.id;

  const convsQ = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: async () => {
      try {
        return await investigationApi.listChatConversations();
      } catch {
        return [];
      }
    },
    refetchInterval: 1500,
    retry: false,
  });

  const [localPing, setLocalPing] = useState(0);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel(CHAT_SYNC_CHANNEL);
        bc.onmessage = () => setLocalPing((p) => p + 1);
      }
    } catch (e) {
      void e;
    }

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key?.startsWith(LOCAL_STORAGE_MSGS_PREFIX) ||
        e.key?.startsWith(LOCAL_STORAGE_READ_PREFIX) ||
        e.key === "cybershield_chat_ping"
      ) {
        setLocalPing((p) => p + 1);
      }
    };

    const handleCustomEvent = () => setLocalPing((p) => p + 1);

    window.addEventListener("storage", handleStorage);
    window.addEventListener("cybershield_chat_event", handleCustomEvent);

    return () => {
      if (bc) bc.close();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cybershield_chat_event", handleCustomEvent);
    };
  }, []);

  const totalUnread = useMemo(() => {
    void localPing;
    const convs: ChatConversation[] = convsQ.data || [];
    let count = 0;

    // 1. Calculate from backend conversations
    convs.forEach((conv) => {
      let lastRead = getLastReadTimestamp(conv.id, currentUserId);
      if (conv.case_id) {
        lastRead = Math.max(
          lastRead,
          getLastReadTimestamp(conv.case_id, currentUserId),
          getLastReadTimestamp(`case-group-${conv.case_id}`, currentUserId),
        );
      }

      const allMsgs: ChatMessage[] = [];
      if (conv.messages) allMsgs.push(...conv.messages);
      allMsgs.push(...getLocalMessages(conv.id));
      if (conv.case_id) {
        allMsgs.push(...getLocalMessages(`case-group-${conv.case_id}`));
        allMsgs.push(...getLocalMessages(conv.case_id));
      }

      if (lastRead > 0) {
        const seen = new Set<string>();
        allMsgs.forEach((m) => {
          if (
            m.id &&
            !seen.has(m.id) &&
            !m.is_system &&
            !isCurrentUser(m.sender || { id: m.sender_id, user_id: m.sender_id }, meQ.data) &&
            m.sender_id !== "me" &&
            new Date(m.created_at).getTime() > lastRead
          ) {
            seen.add(m.id);
            count++;
          }
        });
      } else {
        count += conv.unread_count || 0;
      }
    });

    // 2. Also check local storage keys for mock/direct chats
    if (typeof window !== "undefined") {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(LOCAL_STORAGE_MSGS_PREFIX)) {
            const convId = key.replace(LOCAL_STORAGE_MSGS_PREFIX, "");
            if (
              !convs.some(
                (c) =>
                  c.id === convId || c.case_id === convId || `case-group-${c.case_id}` === convId,
              )
            ) {
              const lastRead = getLastReadTimestamp(convId, currentUserId);
              if (lastRead > 0) {
                const msgs = getLocalMessages(convId);
                const seen = new Set<string>();
                msgs.forEach((m) => {
                  if (
                    m.id &&
                    !seen.has(m.id) &&
                    !m.is_system &&
                    !isCurrentUser(
                      m.sender || { id: m.sender_id, user_id: m.sender_id },
                      meQ.data,
                    ) &&
                    m.sender_id !== "me" &&
                    new Date(m.created_at).getTime() > lastRead
                  ) {
                    seen.add(m.id);
                    count++;
                  }
                });
              }
            }
          }
        }
      } catch (e) {
        void e;
      }
    }

    return count;
  }, [convsQ.data, currentUserId, meQ.data, localPing]);

  return totalUnread;
}
