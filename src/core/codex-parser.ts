import { readFile } from "fs/promises";
import { existsSync } from "fs";
import type { ParsedTranscript, ModelUsageSummary } from "../types/transcript.js";
import { getDisplayName, calculateModelCost } from "../utils/model-pricing.js";

interface CodexLine {
  timestamp: string;
  type: string;
  payload?: Record<string, unknown>;
}

export class CodexParser {
  async parseTranscript(filePath: string): Promise<ParsedTranscript> {
    const expandedPath = filePath.replace(/^~/, process.env.HOME || "");

    if (!existsSync(expandedPath)) {
      throw new Error(`Codex transcript file not found: ${filePath}`);
    }

    const content = await readFile(expandedPath, "utf-8");
    const lines: CodexLine[] = content
      .trim()
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l));

    let sessionId = "";
    let model = "gpt-5.5";
    let firstPrompt = "No prompt available";
    let startTime = new Date();
    let endTime = new Date();
    let totalInput = 0;
    let totalCached = 0;
    let totalOutput = 0;
    let totalReasoning = 0;
    let userMessageCount = 0;
    let assistantMessageCount = 0;
    let hasTokenData = false;

    for (const line of lines) {
      const payload = line.payload ?? {};
      const pType = payload.type as string | undefined;

      // Session meta
      if (line.type === "session_meta") {
        sessionId = (payload.id as string) ?? "";
        if (line.timestamp) startTime = new Date(line.timestamp);
      }

      // Model from turn_context (use last one)
      if (line.type === "turn_context" && payload.model) {
        model = payload.model as string;
      }

      // First user message
      if (line.type === "event_msg" && pType === "user_message" && !firstPrompt.startsWith("No prompt")) {
        // already captured
      } else if (line.type === "event_msg" && pType === "user_message" && firstPrompt === "No prompt available") {
        const msg = payload.message as string | undefined;
        if (msg) firstPrompt = this.truncateText(msg, 100);
        userMessageCount++;
      } else if (line.type === "event_msg" && pType === "user_message") {
        userMessageCount++;
      }

      // Assistant messages
      if (line.type === "response_item" && pType === "message" && (payload as Record<string, unknown>).role === "assistant") {
        assistantMessageCount++;
      }

      // Token counts (take last one — it has cumulative totals)
      if (line.type === "event_msg" && pType === "token_count") {
        const info = payload.info as Record<string, Record<string, number>> | undefined;
        if (info?.total_token_usage) {
          const t = info.total_token_usage;
          totalInput = t.input_tokens ?? 0;
          totalCached = t.cached_input_tokens ?? 0;
          totalOutput = t.output_tokens ?? 0;
          totalReasoning = t.reasoning_output_tokens ?? 0;
          hasTokenData = true;
        }
      }

      // End time from task_complete
      if (line.type === "event_msg" && pType === "task_complete") {
        const completedAt = payload.completed_at as number | undefined;
        if (completedAt) endTime = new Date(completedAt * 1000);
      }
    }

    // If no token data found, still produce valid output with zeros
    const inputTokens = totalInput - totalCached;
    const outputTokens = totalOutput + totalReasoning;
    const cacheReadTokens = totalCached;
    const cacheCreationTokens = 0;
    const totalTokens = totalInput + totalOutput;

    const estimatedCost = hasTokenData
      ? calculateModelCost(model, inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens)
      : 0;

    const modelSummary: ModelUsageSummary = {
      modelName: model,
      displayName: getDisplayName(model),
      messageCount: assistantMessageCount,
      inputTokens,
      outputTokens,
      cacheCreationTokens,
      cacheReadTokens,
      totalTokens,
      estimatedCost,
    };

    const sessionSlug = this.generateSlug(firstPrompt);

    return {
      sessionSlug,
      firstPrompt,
      startTime,
      endTime,
      userMessageCount,
      assistantMessageCount,
      totalMessages: lines.length,
      modelSummaries: [modelSummary],
      totalCost: estimatedCost,
      totalTokens,
      totalInputTokens: inputTokens,
      totalOutputTokens: outputTokens,
      totalCacheCreationTokens: cacheCreationTokens,
      totalCacheReadTokens: cacheReadTokens,
      modelsUsed: [model],
    };
  }

  private truncateText(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen).trim() + "...";
  }

  private generateSlug(prompt: string): string {
    if (!prompt || prompt === "No prompt available") return "untitled-session";
    let cleaned = prompt.replace(/^\/[^\s]+\s*/, "").trim();
    if (!cleaned) return "untitled-session";
    const firstSentence = cleaned.split(/[。！？.!?\n]/)[0].trim();
    cleaned = firstSentence || cleaned;
    cleaned = cleaned.replace(/[^\x20-\x7E]/g, "").trim();
    if (!cleaned) return "untitled-session";
    if (cleaned.length > 30) cleaned = cleaned.substring(0, 30).trim();
    return cleaned.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "untitled-session";
  }
}
