import { createFileRoute } from "@tanstack/react-router";
import { ChatInterface } from "@/components/chat/ChatInterface";

export const Route = createFileRoute("/superior/messages")({
  component: SuperiorMessagesPage,
});

function SuperiorMessagesPage() {
  return (
    <div className="h-[calc(100vh-4rem)] p-3 sm:p-5">
      <ChatInterface />
    </div>
  );
}
