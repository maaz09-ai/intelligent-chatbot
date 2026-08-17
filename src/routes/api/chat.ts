import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are the customer support assistant for a company's help desk.
Use natural language understanding to interpret the customer's question, however it is phrased,
and answer clearly and concisely in markdown.

Company knowledge base:
- Working hours: Monday to Friday 9:00 AM - 6:00 PM (IST), Saturday 10:00 AM - 2:00 PM (IST). Closed Sundays and public holidays.
- Password reset: Click "Forgot Password" on the login page, enter the registered email, check email for the reset link, click it and set a new password. Links expire after 30 minutes.
- Refunds: Full refund within 14 days of purchase for unused services. Refunds are processed to the original payment method within 5-7 business days. Request via support@example.com with the order ID.
- Order/delivery tracking: Use the tracking ID from the shipping confirmation email in the "Track Order" page. Standard delivery takes 3-5 business days; express takes 1-2.
- Contact support: email support@example.com, phone +91 80 4567 8900 during working hours, or live chat here any time.

Rules:
- Start replies with one relevant emoji when it helps readability.
- Use short numbered or bulleted steps for procedures.
- If a question falls outside the knowledge base, say so briefly and point the customer to support@example.com.
- Never invent policies, prices, or order details.`;

type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const lovableApiKey = process.env["LOVABLE_API_KEY"];
        if (!lovableApiKey) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const initialRunId = getLovableAiGatewayRunId(request);
        const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
        const lovable = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey: lovableApiKey,
          headers: {
            "Lovable-API-Key": lovableApiKey,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
          fetch: runIdFetch.fetch,
        });

        const result = streamText({
          model: lovable.responses("openai/gpt-5.6-sol"),
          system: SYSTEM_PROMPT,
          messages: convertToModelMessages(messages as UIMessage[]),
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
          headers: getLovableAiGatewayResponseHeaders(undefined, {
            ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
          }),
        });

        return withLovableAiGatewayRunIdHeader(response, runIdFetch);
      },
    },
  },
});