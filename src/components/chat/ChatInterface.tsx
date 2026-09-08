import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Users,
  Send,
  Search,
  CheckCheck,
  Shield,
  User as UserIcon,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
  Crown,
} from "lucide-react";
import { investigationApi } from "@/services/investigationApi";
import type { ChatConversation, ChatMessage, CaseInvestigator, UserBrief } from "@/services/types";
import { toast } from "sonner";
import { apiMessage } from "@/services/apiClient";
import { MOCK_USERS, MOCK_CASES } from "@/data/mock/platform";
import { getStoredCases } from "@/data/mock/platformState";

export interface ChatInterfaceProps {
  initialConversationId?: string;
  initialCaseId?: string;
  initialCaseNumber?: string;
  initialCaseTitle?: string;
  initialTargetUserId?: string;
  caseTeamMembers?: CaseInvestigator[];
  onClose?: () => void;
  isEmbedded?: boolean;
}

const isUUID = (str?: string) =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const LOCAL_STORAGE_MSGS_PREFIX = "cybershield_chat_msgs_";
const CHAT_SYNC_CHANNEL = "cybershield_chat_live_sync";

// Cross-tab broadcast channel
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHAT_SYNC_CHANNEL);
  } catch (e) {
    console.warn("BroadcastChannel not available:", e);
  }
}

export function broadcastChatMessage(convId: string, msg: ChatMessage) {
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: "NEW_MESSAGE", convId, msg, timestamp: Date.now() });
    }
  } catch (e) {
    console.warn("Failed to post broadcast message:", e);
  }
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("cybershield_chat_event", { detail: { convId, msg } }));
      localStorage.setItem("cybershield_chat_ping", `${convId}_${Date.now()}`);
    } catch {}
  }
}

function getLocalMessages(convId: string): ChatMessage[] {
  if (typeof window === "undefined" || !convId) return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_MSGS_PREFIX}${convId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMessage(convId: string, msg: ChatMessage) {
  if (typeof window === "undefined" || !convId) return;
  try {
    const existing = getLocalMessages(convId);
    if (!existing.some((m) => m.id === msg.id || (m.created_at === msg.created_at && m.content === msg.content))) {
      const updated = [...existing, msg];
      localStorage.setItem(`${LOCAL_STORAGE_MSGS_PREFIX}${convId}`, JSON.stringify(updated));
    }
  } catch (e) {
    console.warn("Failed to save local chat message:", e);
  }
  broadcastChatMessage(convId, msg);
}

function getEffectiveLastMessage(conv: ChatConversation): ChatMessage | null {
  const candidates: ChatMessage[] = [];
  if (conv.last_message && conv.last_message.content) {
    candidates.push(conv.last_message);
  }

  const localById = getLocalMessages(conv.id);
  candidates.push(...localById);

  if (conv.case_id && conv.case_id !== conv.id) {
    const localByCaseGroup = getLocalMessages(`case-group-${conv.case_id}`);
    candidates.push(...localByCaseGroup);
    const localByRawCaseId = getLocalMessages(conv.case_id);
    candidates.push(...localByRawCaseId);
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return candidates[0];
}

export function ChatInterface({
  initialConversationId,
  initialCaseId,
  initialCaseNumber,
  initialCaseTitle,
  initialTargetUserId,
  caseTeamMembers = [],
  onClose,
  isEmbedded = false,
}: ChatInterfaceProps) {
  const qc = useQueryClient();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConversationId || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "cases" | "direct" | "team">("all");
  const [messageInput, setMessageInput] = useState("");
  const [showTeamDrawer, setShowTeamDrawer] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. Current logged in user
  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: () => investigationApi.me(),
    retry: false,
  });
  const currentUserId = meQ.data?.id;

  // 2. Chat conversations from backend
  const convsQ = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: async () => {
      try {
        return await investigationApi.listChatConversations();
      } catch {
        return [];
      }
    },
    refetchInterval: 1200,
    retry: false,
  });

  // 3. Cases list from backend
  const casesQ = useQuery({
    queryKey: ["cases-for-chat"],
    queryFn: async () => {
      try {
        const res = await investigationApi.listCases({ page_size: 50 });
        return res?.items || [];
      } catch {
        return [];
      }
    },
    retry: false,
  });

  // 4. Contacts / Investigators list from backend
  const contactsQ = useQuery({
    queryKey: ["chat-contacts"],
    queryFn: async () => {
      try {
        return await investigationApi.listChatContacts();
      } catch {
        return [];
      }
    },
    retry: false,
  });

  // 5. Cross-tab live sync listener
  useEffect(() => {
    const handleSync = () => {
      void qc.invalidateQueries({ queryKey: ["chat-messages"] });
      void qc.invalidateQueries({ queryKey: ["chat-conversations"] });
    };

    if (broadcastChannel) {
      broadcastChannel.onmessage = handleSync;
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key?.startsWith(LOCAL_STORAGE_MSGS_PREFIX) || e.key === "cybershield_chat_ping") {
        handleSync();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("cybershield_chat_event", handleSync);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cybershield_chat_event", handleSync);
    };
  }, [qc]);

  // 6. Build Unified Team Members / Contacts
  const unifiedTeamMembers = useMemo(() => {
    const map = new Map<string, CaseInvestigator>();

    // A. Explicitly passed caseTeamMembers prop
    caseTeamMembers.forEach((m) => {
      const uid = m.user_id || m.user?.id || m.id;
      if (uid) map.set(uid, m);
    });

    // B. Contacts from backend API
    (contactsQ.data || []).forEach((u: UserBrief, idx: number) => {
      if (!map.has(u.id)) {
        const roleStr = String(u.role || "").toLowerCase();
        let assignedRole = "INVESTIGATOR";
        if (roleStr.includes("lead") || (idx === 0 && map.size === 0)) {
          assignedRole = "INVESTIGATOR_LEAD";
        } else if (roleStr.includes("supervisor") || roleStr.includes("superior")) {
          assignedRole = "SUPERVISOR";
        }

        map.set(u.id, {
          id: `team-${u.id}`,
          case_id: initialCaseId || "active-case",
          user_id: u.id,
          role: assignedRole,
          status: "active",
          assigned_at: new Date().toISOString(),
          user: {
            id: u.id,
            full_name: u.full_name,
            email: u.email,
            role: u.role,
          },
        });
      }
    });

    // C. Fallback to mock platform users if needed
    if (map.size === 0) {
      MOCK_USERS.forEach((u, i) => {
        const roleLower = (u.role || "").toLowerCase();
        let assignedRole = "INVESTIGATOR";
        if (roleLower.includes("lead") || i === 0) assignedRole = "INVESTIGATOR_LEAD";
        else if (roleLower.includes("supervisor") || roleLower.includes("superior")) assignedRole = "SUPERVISOR";

        map.set(u.id, {
          id: `team-${u.id}`,
          case_id: initialCaseId || "case-active",
          user_id: u.id,
          role: assignedRole,
          status: "active",
          assigned_at: new Date().toISOString(),
          user: {
            id: u.id,
            full_name: u.name,
            email: u.email,
            role: assignedRole.toLowerCase(),
          },
        });
      });
    }

    return Array.from(map.values());
  }, [caseTeamMembers, contactsQ.data, initialCaseId]);

  // 7. Synthesize Case Group Chats from all sources (Backend Convs + Backend Cases + Stored/Mock Cases)
  const caseGroupConvs = useMemo(() => {
    const list: ChatConversation[] = [];
    const addedCaseIds = new Set<string>();

    // A. Active initialCaseId if provided
    if (initialCaseId) {
      const initNum = initialCaseNumber || (initialCaseId.startsWith("CS-") ? initialCaseId : "CS-2026-0001");
      const initTitle = initialCaseTitle ? `${initNum} · ${initialCaseTitle}` : `${initNum} Investigation Team`;
      list.push({
        id: `case-group-${initialCaseId}`,
        case_id: initialCaseId,
        case_number: initNum,
        title: initTitle,
        type: "case_group",
        created_by_id: currentUserId || "system",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        unread_count: 0,
        participants: unifiedTeamMembers.map((m) => ({
          id: `part-${m.user_id}`,
          conversation_id: `case-group-${initialCaseId}`,
          user_id: m.user_id,
          joined_at: m.assigned_at || new Date().toISOString(),
          user: m.user
            ? {
                id: m.user.id,
                full_name: m.user.full_name,
                email: m.user.email,
                role: m.role || m.user.role,
              }
            : null,
        })),
        last_message: undefined,
      });
      addedCaseIds.add(initialCaseId);
      addedCaseIds.add(initNum);
    }

    // B. Backend API cases
    (casesQ.data || []).forEach((bc) => {
      if (!addedCaseIds.has(bc.id) && !addedCaseIds.has(bc.case_number)) {
        list.push({
          id: `case-group-${bc.id}`,
          case_id: bc.id,
          case_number: bc.case_number,
          title: `${bc.case_number} · ${bc.title}`,
          type: "case_group",
          created_by_id: bc.created_by_id || "system",
          created_at: bc.created_at || new Date().toISOString(),
          updated_at: bc.updated_at || new Date().toISOString(),
          unread_count: 0,
          participants: [
            ...(bc.investigator_lead
              ? [
                  {
                    id: `part-lead-${bc.id}`,
                    conversation_id: `case-group-${bc.id}`,
                    user_id: bc.investigator_lead.id,
                    joined_at: bc.created_at,
                    user: {
                      id: bc.investigator_lead.id,
                      full_name: bc.investigator_lead.full_name,
                      email: bc.investigator_lead.email,
                      role: "investigator_lead",
                    },
                  },
                ]
              : []),
            ...(bc.supervisor
              ? [
                  {
                    id: `part-sup-${bc.id}`,
                    conversation_id: `case-group-${bc.id}`,
                    user_id: bc.supervisor.id,
                    joined_at: bc.created_at,
                    user: {
                      id: bc.supervisor.id,
                      full_name: bc.supervisor.full_name,
                      email: bc.supervisor.email,
                      role: "supervisor",
                    },
                  },
                ]
              : []),
          ],
          last_message: undefined,
        });
        addedCaseIds.add(bc.id);
        addedCaseIds.add(bc.case_number);
      }
    });

    // C. Platform stored cases & mock cases
    const stored = getStoredCases();
    const allFallbackCases = stored.length > 0 ? stored : MOCK_CASES;
    allFallbackCases.forEach((sc) => {
      if (!addedCaseIds.has(sc.id) && !addedCaseIds.has(sc.caseNumber)) {
        list.push({
          id: `case-group-${sc.id}`,
          case_id: sc.id,
          case_number: sc.caseNumber,
          title: `${sc.caseNumber} · ${sc.title}`,
          type: "case_group",
          created_by_id: "system",
          created_at: sc.created || new Date().toISOString(),
          updated_at: sc.updated || new Date().toISOString(),
          unread_count: 0,
          participants: [
            {
              id: `part-lead-${sc.id}`,
              conversation_id: `case-group-${sc.id}`,
              user_id: "u3",
              joined_at: sc.created || new Date().toISOString(),
              user: {
                id: "u3",
                full_name: sc.assignee && sc.assignee !== "Unassigned" ? sc.assignee : "Alex Mercer",
                email: "alex.mercer@cybershield.gov",
                role: "investigator_lead",
              },
            },
            {
              id: `part-inv-${sc.id}`,
              conversation_id: `case-group-${sc.id}`,
              user_id: "u4",
              joined_at: sc.created || new Date().toISOString(),
              user: {
                id: "u4",
                full_name: "Sana Joseph",
                email: "sana.joseph@cybershield.gov",
                role: "investigator",
              },
            },
          ],
          last_message: undefined,
        });
        addedCaseIds.add(sc.id);
        addedCaseIds.add(sc.caseNumber);
      }
    });

    return list;
  }, [initialCaseId, initialCaseNumber, initialCaseTitle, unifiedTeamMembers, currentUserId, casesQ.data]);

  // 8. Combine backend conversations and synthesized case group chats
  const allConversations = useMemo(() => {
    const map = new Map<string, ChatConversation>();

    // A. Backend API conversations
    (convsQ.data || []).forEach((c) => {
      map.set(c.id, c);
      if (c.case_id) map.set(`case-group-${c.case_id}`, c);
    });

    // B. Merge synthesized case group chats
    caseGroupConvs.forEach((cg) => {
      const match = Array.from(map.values()).find(
        (c) => c.id === cg.id || (c.case_id && c.case_id === cg.case_id)
      );
      if (!match) {
        map.set(cg.id, cg);
      }
    });

    const result = Array.from(map.values());

    // Prioritize initialCaseId conversation at top if provided
    if (initialCaseId) {
      const activeIdx = result.findIndex(
        (c) => c.case_id === initialCaseId || c.id === `case-group-${initialCaseId}`
      );
      if (activeIdx > 0) {
        const [activeConv] = result.splice(activeIdx, 1);
        result.unshift(activeConv);
      }
    }

    return result;
  }, [convsQ.data, caseGroupConvs, initialCaseId]);

  // 9. Resolve Backend UUID helper
  const resolveBackendConversationId = useCallback(
    async (convId: string): Promise<string | null> => {
      if (isUUID(convId)) return convId;

      // Case group identifier
      if (convId.startsWith("case-group-")) {
        const rawCaseId = convId.replace("case-group-", "");
        if (isUUID(rawCaseId)) {
          try {
            const conv = await investigationApi.getCaseGroupChat(rawCaseId);
            return conv.id;
          } catch {}
        }

        const match = (casesQ.data || []).find(
          (c) => c.id === rawCaseId || c.case_number === rawCaseId
        );
        if (match && isUUID(match.id)) {
          try {
            const conv = await investigationApi.getCaseGroupChat(match.id);
            return conv.id;
          } catch {}
        }
      }

      // Direct message identifier
      if (convId.startsWith("direct-")) {
        const targetUserId = convId.replace("direct-", "");
        if (isUUID(targetUserId)) {
          try {
            const conv = await investigationApi.getOrCreateDirectChat(targetUserId);
            return conv.id;
          } catch {}
        }
      }

      return null;
    },
    [casesQ.data]
  );

  // 10. Auto-select and resolve active conversation on mount or when conversations load
  useEffect(() => {
    if (initialTargetUserId && currentUserId) {
      if (isUUID(initialTargetUserId)) {
        investigationApi
          .getOrCreateDirectChat(initialTargetUserId, initialCaseId && isUUID(initialCaseId) ? initialCaseId : undefined)
          .then((conv) => {
            setSelectedConvId(conv.id);
            void qc.invalidateQueries({ queryKey: ["chat-conversations"] });
          })
          .catch(() => {
            setSelectedConvId(`direct-${initialTargetUserId}`);
          });
      } else {
        setSelectedConvId(`direct-${initialTargetUserId}`);
      }
    } else if (initialCaseId && (!selectedConvId || selectedConvId.startsWith("direct-"))) {
      if (isUUID(initialCaseId)) {
        investigationApi
          .getCaseGroupChat(initialCaseId)
          .then((conv) => {
            setSelectedConvId(conv.id);
            void qc.invalidateQueries({ queryKey: ["chat-conversations"] });
          })
          .catch(() => {
            setSelectedConvId(`case-group-${initialCaseId}`);
          });
      } else {
        // Look up if casesQ has this case
        const match = (casesQ.data || []).find(
          (c) => c.id === initialCaseId || c.case_number === initialCaseId
        );
        if (match && isUUID(match.id)) {
          investigationApi
            .getCaseGroupChat(match.id)
            .then((conv) => {
              setSelectedConvId(conv.id);
              void qc.invalidateQueries({ queryKey: ["chat-conversations"] });
            })
            .catch(() => {
              setSelectedConvId(`case-group-${initialCaseId}`);
            });
        } else {
          setSelectedConvId(`case-group-${initialCaseId}`);
        }
      }
    } else if (!selectedConvId && allConversations.length > 0) {
      setSelectedConvId(allConversations[0].id);
    }
  }, [initialTargetUserId, initialCaseId, currentUserId, allConversations, selectedConvId, casesQ.data, qc]);

  // 11. Messages query for selected conversation (API + localStorage cache)
  const messagesQ = useQuery({
    queryKey: ["chat-messages", selectedConvId],
    queryFn: async () => {
      if (!selectedConvId) return [];
      let apiMsgs: ChatMessage[] = [];
      if (isUUID(selectedConvId)) {
        try {
          apiMsgs = await investigationApi.listChatMessages(selectedConvId, 200);
        } catch {
          apiMsgs = [];
        }
      }

      const localMsgs = getLocalMessages(selectedConvId);
      const activeConv = allConversations.find((c) => c.id === selectedConvId);
      if (activeConv?.case_id && activeConv.case_id !== selectedConvId) {
        const groupMsgs = getLocalMessages(`case-group-${activeConv.case_id}`);
        groupMsgs.forEach((gm) => {
          if (!localMsgs.some((lm) => lm.id === gm.id || (lm.created_at === gm.created_at && lm.content === gm.content))) {
            localMsgs.push(gm);
          }
        });
      }

      const combined: ChatMessage[] = [...apiMsgs];
      localMsgs.forEach((lm) => {
        if (!combined.some((m) => m.id === lm.id || (m.created_at === lm.created_at && m.content === lm.content))) {
          combined.push(lm);
        }
      });

      return combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    },
    enabled: !!selectedConvId,
    refetchInterval: 1200,
    retry: false,
  });

  const messages = messagesQ.data || [];

  const selectedConv =
    allConversations.find((c) => c.id === selectedConvId) ||
    (selectedConvId?.startsWith("direct-")
      ? {
          id: selectedConvId,
          type: "direct" as const,
          title:
            unifiedTeamMembers.find((m) => `direct-${m.user_id}` === selectedConvId)?.user?.full_name ||
            "Direct Investigation Channel",
          case_id: initialCaseId,
          case_number: initialCaseNumber,
          created_by_id: currentUserId || "me",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          unread_count: 0,
          participants: [],
        }
      : allConversations[0] || null);

  // 12. Send message mutation with live backend & cross-tab sync
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!selectedConvId) throw new Error("No conversation selected");

      let targetId = selectedConvId;
      if (!isUUID(targetId)) {
        const resolved = await resolveBackendConversationId(targetId);
        if (resolved) {
          targetId = resolved;
          setSelectedConvId(resolved);
        }
      }

      if (isUUID(targetId)) {
        try {
          const sentMsg = await investigationApi.sendChatMessage(targetId, text);
          return { sentMsg, targetConvId: targetId };
        } catch (e) {
          console.warn("API sendChatMessage failed, falling back to local sync:", e);
        }
      }

      return { sentMsg: null, targetConvId: targetId };
    },
    onMutate: async (newText) => {
      setMessageInput("");
      const activeId = selectedConvId || "default";
      await qc.cancelQueries({ queryKey: ["chat-messages", activeId] });
      const previousMessages = qc.getQueryData<ChatMessage[]>(["chat-messages", activeId]) || [];

      const optimisticMsg: ChatMessage = {
        id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        conversation_id: activeId,
        sender_id: currentUserId || "me",
        content: newText,
        is_system: false,
        created_at: new Date().toISOString(),
        sender: meQ.data
          ? {
              id: meQ.data.id,
              full_name: meQ.data.full_name,
              email: meQ.data.email,
              role: meQ.data.role,
            }
          : {
              id: "me",
              full_name: "Investigator (You)",
              email: "agent@cybershield.gov",
              role: "investigator",
            },
      };

      saveLocalMessage(activeId, optimisticMsg);
      if (selectedConv?.case_id) {
        saveLocalMessage(`case-group-${selectedConv.case_id}`, optimisticMsg);
        saveLocalMessage(selectedConv.case_id, optimisticMsg);
      }

      qc.setQueryData<ChatMessage[]>(["chat-messages", activeId], [...previousMessages, optimisticMsg]);
      return { previousMessages, activeId, optimisticMsg };
    },
    onSuccess: (data, _, context) => {
      if (data?.sentMsg) {
        saveLocalMessage(data.targetConvId, data.sentMsg);
        if (context?.activeId && context.activeId !== data.targetConvId) {
          saveLocalMessage(context.activeId, data.sentMsg);
        }
      }
    },
    onError: (err, _, context) => {
      if (context?.previousMessages) {
        qc.setQueryData(["chat-messages", context.activeId], context.previousMessages);
      }
      toast.error(apiMessage(err));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["chat-messages"] });
      void qc.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const text = messageInput.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Open direct chat with a team member
  const handleOpenDirectChat = (member: CaseInvestigator | UserBrief | { id: string; full_name?: string; name?: string; role?: string; email?: string }) => {
    const targetId = "user_id" in member ? member.user_id : member.id;
    if (!targetId) return;

    if (currentUserId && isUUID(targetId)) {
      investigationApi
        .getOrCreateDirectChat(targetId, initialCaseId && isUUID(initialCaseId) ? initialCaseId : undefined)
        .then((conv) => {
          setSelectedConvId(conv.id);
          setActiveTab("direct");
          setShowNewChatModal(false);
          void qc.invalidateQueries({ queryKey: ["chat-conversations"] });
        })
        .catch(() => {
          setSelectedConvId(`direct-${targetId}`);
          setActiveTab("direct");
          setShowNewChatModal(false);
        });
    } else {
      setSelectedConvId(`direct-${targetId}`);
      setActiveTab("direct");
      setShowNewChatModal(false);
    }
  };

  // Filter conversations
  const filteredConvs = allConversations.filter((c) => {
    const effectiveMsg = getEffectiveLastMessage(c);
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.case_number && c.case_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (effectiveMsg && effectiveMsg.content.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeTab === "cases") return c.type === "case_group";
    if (activeTab === "direct") return c.type === "direct";
    return true;
  });

  const directCount = allConversations.filter((c) => c.type === "direct").length;
  const caseCount = allConversations.filter((c) => c.type === "case_group").length;

  return (
    <div
      className={`flex h-full w-full overflow-hidden bg-card text-foreground ${
        isEmbedded ? "rounded-2xl border border-border shadow-2xl" : ""
      }`}
    >
      {/* LEFT SIDEBAR: Conversation & Team Members List */}
      <div className="flex w-full flex-col border-r border-border md:w-80 lg:w-96 shrink-0 bg-background/60 backdrop-blur-sm">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-border p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-foreground">Messages & Chats</h2>
              <p className="text-[10px] text-muted-foreground">
                {initialCaseNumber ? `Case ${initialCaseNumber} Team` : "Investigation Communications"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowNewChatModal(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 text-xs font-semibold transition"
              title="Start New Chat"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations, cases, or team..."
              className="w-full rounded-xl border border-border bg-card py-1.5 pl-8 pr-3 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                activeTab === "all"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All ({allConversations.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cases")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                activeTab === "cases"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Case Teams ({caseCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("direct")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                activeTab === "direct"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Direct ({directCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("team")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                activeTab === "team"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Team ({unifiedTeamMembers.length})
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
          {/* TAB: TEAM MEMBERS */}
          {activeTab === "team" && (
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Case Team Roster ({unifiedTeamMembers.length})
                </span>
                {caseGroupConvs[0] && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedConvId(caseGroupConvs[0].id);
                      setActiveTab("cases");
                    }}
                    className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Open Case Chat</span>
                    <span>→</span>
                  </button>
                )}
              </div>

              {unifiedTeamMembers.map((member) => {
                const isMe = member.user_id === currentUserId || member.user?.id === currentUserId;
                const roleLower = (member.role || member.user?.role || "").toLowerCase();
                const isLead = roleLower.includes("lead");
                const isSupervisor = roleLower.includes("supervisor") || roleLower.includes("superior");

                return (
                  <div
                    key={member.id || member.user_id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-2.5 transition hover:border-primary/30"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <div
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                            isLead
                              ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                              : isSupervisor
                                ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                                : "bg-primary/20 text-primary border border-primary/30"
                          }`}
                        >
                          {member.user?.full_name?.charAt(0).toUpperCase() || "I"}
                        </div>
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {member.user?.full_name || "Investigator"}
                          </p>
                          {isMe && <span className="text-[10px] text-muted-foreground">(You)</span>}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                              isLead
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : isSupervisor
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "bg-primary/15 text-primary"
                            }`}
                          >
                            {isLead && <Crown className="h-2.5 w-2.5" />}
                            {isSupervisor && <Shield className="h-2.5 w-2.5" />}
                            {isLead ? "Investigator Lead" : isSupervisor ? "Supervisor" : "Investigator"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isMe && (
                      <button
                        type="button"
                        onClick={() => handleOpenDirectChat(member)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted transition shadow-xs shrink-0"
                      >
                        <MessageSquare className="h-3 w-3 text-primary" />
                        Chat
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB: CONVERSATIONS */}
          {activeTab !== "team" && (
            <>
              {filteredConvs.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">No conversations found</p>
                  <p className="mt-1 text-[11px]">
                    {searchQuery
                      ? "Try adjusting your search query."
                      : "Case group chats and direct messages will appear here."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowNewChatModal(true)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Start Conversation
                  </button>
                </div>
              )}

              {filteredConvs.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                const isCaseGroup = conv.type === "case_group";
                const effectiveMsg = getEffectiveLastMessage(conv);

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => {
                      setSelectedConvId(conv.id);
                      if (isUUID(conv.id)) {
                        void investigationApi.markChatConversationRead(conv.id);
                      }
                    }}
                    className={`flex w-full items-start gap-3 p-3 text-left transition-colors ${
                      isSelected
                        ? "bg-primary/10 border-l-4 border-primary"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    {/* Avatar / Icon */}
                    <div className="relative shrink-0">
                      {isCaseGroup ? (
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Users className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <UserIcon className="h-5 w-5" />
                        </div>
                      )}
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-sm">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>

                    {/* Conversation text info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {conv.case_number && (
                            <span className="rounded bg-primary/15 px-1.5 py-0.2 text-[9px] font-bold text-primary shrink-0">
                              {conv.case_number}
                            </span>
                          )}
                          <p className="truncate text-xs font-bold text-foreground">
                            {conv.title}
                          </p>
                        </div>
                        {effectiveMsg && (
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {new Date(effectiveMsg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {effectiveMsg ? (
                          effectiveMsg.is_system ? (
                            <span className="italic text-muted-foreground/80">
                              {effectiveMsg.content}
                            </span>
                          ) : (
                            <span>
                              <strong className="text-foreground/80">
                                {effectiveMsg.sender?.full_name?.split(" ")[0] || "User"}:{" "}
                              </strong>
                              {effectiveMsg.content}
                            </span>
                          )
                        ) : (
                          <span className="italic text-muted-foreground/60">No messages yet</span>
                        )}
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/80">
                        <span>
                          {isCaseGroup
                            ? `${conv.participants?.length || unifiedTeamMembers.length} team members`
                            : "Direct 1-on-1"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* RIGHT CHAT PANE: Active Conversation */}
      <div className="flex flex-1 flex-col bg-background">
        {selectedConv ? (
          <>
            {/* Active Header */}
            <div className="border-b border-border bg-card/70 backdrop-blur-sm">
              <div className="flex items-center justify-between p-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedConv.type === "case_group" ? (
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <UserIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {selectedConv.case_number && (
                        <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                          {selectedConv.case_number}
                        </span>
                      )}
                      <h3 className="truncate text-sm font-bold text-foreground">
                        {selectedConv.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                      {selectedConv.type === "case_group" ? (
                        <span>
                          Team Members: {unifiedTeamMembers.map((p) => p.user?.full_name || "Investigator").join(", ")}
                        </span>
                      ) : (
                        <span>Private Direct Communication Channel</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedConv.type === "case_group" && (
                    <button
                      type="button"
                      onClick={() => setShowTeamDrawer(!showTeamDrawer)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition shadow-xs"
                    >
                      <Users className="h-3.5 w-3.5 text-primary" />
                      Team ({unifiedTeamMembers.length})
                      {showTeamDrawer ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  )}

                  <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>
              </div>

              {/* Collapsible Case Team Roster Drawer */}
              {showTeamDrawer && selectedConv.type === "case_group" && (
                <div className="border-t border-border bg-muted/30 p-3.5 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      Case Investigation Team Members
                    </h4>
                    <span className="text-[10px] text-muted-foreground">Click 'Chat' to message 1-on-1</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {unifiedTeamMembers.map((member) => {
                      const isMe = member.user_id === currentUserId || member.user?.id === currentUserId;
                      const roleLower = (member.role || member.user?.role || "").toLowerCase();
                      const isLead = roleLower.includes("lead");
                      const isSupervisor = roleLower.includes("supervisor") || roleLower.includes("superior");

                      return (
                        <div
                          key={member.id || member.user_id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-2 shadow-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                                isLead
                                  ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                                  : isSupervisor
                                    ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                                    : "bg-primary/20 text-primary border border-primary/30"
                              }`}
                            >
                              {member.user?.full_name?.charAt(0).toUpperCase() || "I"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {member.user?.full_name || "Investigator"}
                                {isMe && <span className="ml-1 text-[10px] text-muted-foreground">(You)</span>}
                              </p>
                              <span
                                className={`inline-block rounded px-1.5 py-0.2 text-[8px] font-bold uppercase ${
                                  isLead
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    : isSupervisor
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                      : "bg-primary/15 text-primary"
                                }`}
                              >
                                {isLead ? "Lead" : isSupervisor ? "Supervisor" : "Investigator"}
                              </span>
                            </div>
                          </div>

                          {!isMe && (
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenDirectChat(member);
                                setShowTeamDrawer(false);
                              }}
                              className="p-1.5 rounded-lg border border-border hover:bg-muted text-primary transition shrink-0"
                              title="Direct Message"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesQ.isLoading && messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /> Loading messages...
                </div>
              )}

              {messages.length === 0 && !messagesQ.isLoading && (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-6">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted/60 text-muted-foreground/60 mb-2">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">No messages yet</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
                    Send a message below to start collaborating with the investigation team in real time.
                  </p>
                </div>
              )}

              {messages.map((msg) => {
                // System message pill
                if (msg.is_system) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="rounded-full bg-muted/80 border border-border px-3.5 py-1 text-[11px] text-muted-foreground italic text-center max-w-md shadow-xs">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                const isMe = msg.sender_id === currentUserId || msg.sender_id === "me";
                const senderRole = (msg.sender?.role || "").toLowerCase();
                const isLeadSender = senderRole.includes("lead");
                const isSupervisorSender = senderRole.includes("supervisor") || senderRole.includes("superior");

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {!isMe && (
                      <div
                        className={`grid h-7 w-7 place-items-center rounded-lg border text-[11px] font-bold shrink-0 ${
                          isLeadSender
                            ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                            : isSupervisorSender
                              ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                              : "bg-muted text-foreground border-border"
                        }`}
                      >
                        {msg.sender?.full_name?.charAt(0) || "U"}
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] sm:max-w-md rounded-2xl px-4 py-2.5 shadow-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-xs"
                          : "bg-card border border-border text-foreground rounded-bl-xs"
                      }`}
                    >
                      {/* Sender header for non-me */}
                      {!isMe && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-bold text-foreground">
                            {msg.sender?.full_name || "Investigator"}
                          </span>
                          <span
                            className={`rounded px-1 py-0.2 text-[9px] font-bold uppercase ${
                              isLeadSender
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                : isSupervisorSender
                                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                  : "bg-primary/20 text-primary"
                            }`}
                          >
                            {isLeadSender ? "Lead" : isSupervisorSender ? "Supervisor" : "Investigator"}
                          </span>
                        </div>
                      )}

                      <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {msg.content}
                      </p>

                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${
                          isMe ? "text-primary-foreground/75" : "text-muted-foreground"
                        }`}
                      >
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMe && <CheckCheck className="h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="border-t border-border bg-card p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${selectedConv.title}... (Enter to send, Shift+Enter for newline)`}
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-border bg-background p-2.5 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!messageInput.trim() || sendMutation.isPending}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0 shadow-md"
                  title="Send message (Enter)"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-muted/60 text-muted-foreground/60 mb-3">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">Investigation Team Communications</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Select a case group chat or a team investigator from the left sidebar to start collaborating.
            </p>
          </div>
        )}
      </div>

      {/* NEW CHAT / TEAM MEMBER SELECTION MODAL */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Start New Direct Message</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Select an investigator or supervisor to start a direct 1-on-1 private channel:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {unifiedTeamMembers.map((member) => {
                const roleLower = (member.role || member.user?.role || "").toLowerCase();
                const isLead = roleLower.includes("lead");
                const isSupervisor = roleLower.includes("supervisor") || roleLower.includes("superior");
                const isMe = member.user_id === currentUserId || member.user?.id === currentUserId;

                if (isMe) return null;

                return (
                  <button
                    key={member.id || member.user_id}
                    type="button"
                    onClick={() => handleOpenDirectChat(member)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background p-2.5 hover:border-primary/40 hover:bg-muted/40 transition text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                          isLead
                            ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                            : isSupervisor
                              ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                              : "bg-primary/20 text-primary border border-primary/30"
                        }`}
                      >
                        {member.user?.full_name?.charAt(0).toUpperCase() || "I"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {member.user?.full_name || "Investigator"}
                        </p>
                        <span
                          className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                            isLead
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : isSupervisor
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-primary/15 text-primary"
                          }`}
                        >
                          {isLead ? "Lead" : isSupervisor ? "Supervisor" : "Investigator"}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs text-primary font-semibold">Message →</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
