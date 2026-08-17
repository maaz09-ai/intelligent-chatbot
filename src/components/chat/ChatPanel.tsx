import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { BarChart3, ChevronRight, Info, Lightbulb, MessageSquare, Send, User } from "lucide-react";
import { toast } from "sonner";

import botAvatar from "@/assets/bot-avatar.png";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "What are your working hours?",
  "How can I reset my password?",
  "What is your refund policy?",
  "How can I track my order?",
  "How do I contact support?",
];

const GREETING: UIMessage = {
  id: "greeting",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "👋 Hello! I'm your intelligent customer support assistant.\n\nAsk me about working hours, password reset, refunds, delivery tracking, or support contact details.",
    },
  ],
};

function messageText(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

function BotAvatar({ className }: { className?: string }) {
  return (
    <img
      src={botAvatar}
      alt="Support assistant avatar"
      width={512}
      height={512}
      className={cn("shrink-0 rounded-xl bg-secondary/60 object-contain p-0.5", className)}
    />
  );
}

function Timestamp({ align }: { align: "left" | "right" }) {
  const [time] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );
  return (
    <span
      className={cn(
        "mt-1 block text-[11px] text-muted-foreground",
        align === "right" && "text-right",
      )}
    >
      {time}
    </span>
  );
}

export function ChatPanel() {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    id: "support-chat",
    messages: [GREETING],
    transport,
    onError: (error) => toast.error(error.message || "The assistant is unavailable right now."),
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!isBusy) textareaRef.current?.focus();
  }, [isBusy]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || isBusy) return;
    setInput("");
    void sendMessage({ text: value });
  };

  const userCount = messages.filter((m) => m.role === "user").length;
  const botCount = messages.filter((m) => m.role === "assistant").length;

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Chat card */}
      <section
        className="flex h-[78vh] min-h-[560px] flex-col overflow-hidden rounded-3xl border border-border backdrop-blur-xl"
        style={{ background: "var(--surface-glass)", boxShadow: "var(--shadow-panel)" }}
      >
        <header className="flex items-center gap-4 border-b border-border px-6 py-4">
          <BotAvatar className="size-12" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              Intelligent NLP Chatbot
            </h1>
            <p className="truncate text-sm text-muted-foreground">Customer Support Assistant</p>
          </div>
          <span className="flex items-center gap-2 rounded-full bg-secondary/70 px-3 py-1.5 text-sm font-medium">
            <span className="size-2 rounded-full bg-online shadow-[0_0_10px_var(--online)]" />
            Online
          </span>
        </header>

        <Conversation className="flex-1">
          <ConversationContent className="gap-5 px-6 py-6">
            {messages.map((message) => {
              const text = messageText(message);
              if (!text) return null;
              const isUser = message.role === "user";

              return (
                <div key={message.id} className={cn("flex gap-3", isUser && "justify-end")}>
                  {!isUser && <BotAvatar className="mt-1 size-9" />}
                  <Message from={message.role} className="max-w-[80%] flex-initial">
                    <div>
                      <MessageContent
                        className={cn(
                          "rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                          isUser
                            ? "bg-bubble-user text-bubble-user-foreground"
                            : "bg-bubble-bot text-bubble-bot-foreground",
                        )}
                      >
                        <MessageResponse>{text}</MessageResponse>
                      </MessageContent>
                      <Timestamp align={isUser ? "right" : "left"} />
                    </div>
                  </Message>
                </div>
              );
            })}

            {status === "submitted" && (
              <div className="flex gap-3">
                <BotAvatar className="mt-1 size-9" />
                <div className="rounded-2xl bg-bubble-bot px-4 py-3">
                  <Shimmer>Thinking...</Shimmer>
                </div>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-border px-6 py-4">
          <PromptInput
            className="rounded-2xl border-border bg-secondary/50"
            onSubmit={(_, event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <PromptInputTextarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your question..."
              className="text-[15px]"
            />
            <PromptInputFooter className="justify-end border-0">
              <PromptInputSubmit
                status={status}
                disabled={!input.trim() && !isBusy}
                className="text-primary-foreground"
                style={{ background: "var(--gradient-send)" }}
              >
                <Send className="size-4" />
              </PromptInputSubmit>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </section>

      {/* Sidebar */}
      <aside className="flex flex-col gap-6">
        <div
          className="rounded-3xl border border-border p-5 backdrop-blur-xl"
          style={{ background: "var(--gradient-panel)", boxShadow: "var(--shadow-panel)" }}
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Lightbulb className="size-5 text-teal" />
            Suggested Questions
          </h2>
          <ul className="space-y-2.5">
            {SUGGESTIONS.map((question) => (
              <li key={question}>
                <button
                  type="button"
                  onClick={() => send(question)}
                  disabled={isBusy}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-left text-sm transition-colors hover:bg-accent disabled:opacity-50"
                >
                  {question}
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="rounded-3xl border border-border p-5 backdrop-blur-xl"
          style={{ background: "var(--surface-glass)", boxShadow: "var(--shadow-panel)" }}
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="size-5 text-teal" />
            Chat Stats
          </h2>
          <dl className="space-y-2.5 text-sm">
            <StatRow
              icon={<MessageSquare className="size-4" />}
              label="Total Messages"
              value={messages.length}
            />
            <StatRow icon={<User className="size-4" />} label="User Messages" value={userCount} />
            <StatRow
              icon={<img src={botAvatar} alt="" className="size-4 object-contain" />}
              label="Bot Responses"
              value={botCount}
            />
          </dl>
        </div>

        <div
          className="rounded-3xl border border-border p-5 backdrop-blur-xl"
          style={{ background: "var(--gradient-about)", boxShadow: "var(--shadow-panel)" }}
        >
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Info className="size-5 text-teal" />
            About
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This chatbot uses natural language processing to understand your queries and provide
            accurate, instant support answers.
          </p>
          <span className="mt-4 inline-block rounded-xl border border-border bg-secondary/50 px-4 py-2 text-sm">
            Powered by Lovable AI
          </span>
        </div>
      </aside>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3">
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary/25 text-primary-foreground">
        {icon}
      </span>
      <dt className="flex-1">{label}</dt>
      <dd className="text-base font-semibold">{value}</dd>
    </div>
  );
}
