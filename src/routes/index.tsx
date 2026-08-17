import { createFileRoute } from "@tanstack/react-router";

import { ChatPanel } from "@/components/chat/ChatPanel";

const title = "Intelligent NLP Chatbot | AI Customer Support Assistant";
const description =
  "Ask about working hours, password resets, refunds, order tracking and support contacts. An NLP-powered chatbot answers instantly.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen">
      <ChatPanel />
      <footer className="pb-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Intelligent NLP Chatbot | All Rights Reserved
      </footer>
    </main>
  );
}
