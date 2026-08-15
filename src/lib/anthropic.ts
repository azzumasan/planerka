import "server-only";
import Anthropic from "@anthropic-ai/sdk";

declare global {
  // eslint-disable-next-line no-var
  var __anthropicClient: Anthropic | undefined;
}

export function getAnthropic(): Anthropic {
  if (!global.__anthropicClient) {
    global.__anthropicClient = new Anthropic();
  }
  return global.__anthropicClient;
}
