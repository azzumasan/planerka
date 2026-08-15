"use server";

import { getAnthropic } from "@/lib/anthropic";
import type { ChatMessage, DraftTask } from "@/lib/types";

const CONVERSE_SYSTEM = `Ты — голосовой ассистент личной утренней планёрки. Ты разговариваешь с пользователем вслух: твой текст озвучивается синтезатором речи, поэтому отвечай КОРОТКО — 1-3 предложения, обычным разговорным текстом, без markdown, без списков, без звёздочек, без смайликов.

Твоя задача — по-дружески расспросить пользователя о планах на сегодня: как он себя чувствует, какие 2-4 главных дела или приоритета, есть ли что-то срочное. Не устраивай допрос — веди живой короткий диалог, реагируй на то, что говорит пользователь. После нескольких реплик, когда наберётся достаточно конкретики, мягко предложи закончить и сформировать план.

Говори по-русски.`;

const EXTRACT_SYSTEM = `Ты извлекаешь из разговора список конкретных задач на сегодня. Вызови инструмент save_plan со списком задач, которые пользователь реально упомянул как то, что нужно сделать сегодня. Заголовок задачи — короткий, по-русски, в повелительном или инфинитивном стиле («подготовить отчёт», «сходить в зал»). Не выдумывай задачи, которых не было в разговоре. Если пользователь ничего конкретного не назвал, верни пустой список.`;

function toApiMessages(history: ChatMessage[]) {
  return history.map((m) => ({ role: m.role, content: m.content }));
}

export async function converseAction(history: ChatMessage[]): Promise<string> {
  const client = getAnthropic();

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 400,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system: CONVERSE_SYSTEM,
    messages: toApiMessages(history),
  });

  if (response.stop_reason === "refusal") {
    return "Извини, не могу ответить на это. Давай продолжим с планом на день?";
  }

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
}

export async function extractPlanAction(history: ChatMessage[]): Promise<DraftTask[]> {
  const client = getAnthropic();

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    output_config: { effort: "low" },
    system: EXTRACT_SYSTEM,
    messages: toApiMessages(history),
    tools: [
      {
        name: "save_plan",
        description: "Сохранить список задач на сегодня, извлечённых из разговора.",
        input_schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Короткое название задачи по-русски" },
                  category: {
                    type: "string",
                    enum: ["work", "health", "personal", "finance", "learning", "other"],
                  },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                  },
                },
                required: ["title", "category", "priority"],
              },
            },
          },
          required: ["tasks"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "save_plan" },
  });

  if (response.stop_reason === "refusal") {
    return [];
  }

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return [];

  const input = toolUse.input as { tasks?: DraftTask[] };
  return input.tasks ?? [];
}
