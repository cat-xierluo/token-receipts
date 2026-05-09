import { readFile } from "fs/promises";
import { existsSync } from "fs";
import type {
  TranscriptMessage,
  ParsedTranscript,
  ModelUsageSummary,
} from "../types/transcript.js";
import {
  getDisplayName,
  calculateModelCost,
} from "../utils/model-pricing.js";

export class TranscriptParser {
  /**
   * Parse a transcript JSONL file
   */
  async parseTranscript(transcriptPath: string): Promise<ParsedTranscript> {
    // Expand ~ to home directory
    const expandedPath = transcriptPath.replace(/^~/, process.env.HOME || "");

    if (!existsSync(expandedPath)) {
      throw new Error(`Transcript file not found: ${transcriptPath}`);
    }

    const content = await readFile(expandedPath, "utf-8");
    const lines = content.trim().split("\n");

    const messages: TranscriptMessage[] = lines
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));

    // Extract session metadata
    const userMessages = messages.filter((m) => m.type === "user");
    const assistantMessages = messages.filter((m) => m.type === "assistant");

    const firstUserMessage = userMessages[0];
    const firstPrompt = this.extractPromptText(firstUserMessage);
    const sessionSlug = firstUserMessage?.slug || "unknown-session";

    // Calculate duration
    const timestamps = messages
      .filter((m) => m.timestamp)
      .map((m) => new Date(m.timestamp));

    const startTime = timestamps[0] || new Date();
    const endTime = timestamps[timestamps.length - 1] || new Date();

    // Aggregate usage by model from message.usage on assistant messages
    const modelAgg = new Map<
      string,
      {
        messageCount: number;
        inputTokens: number;
        outputTokens: number;
        cacheCreationTokens: number;
        cacheReadTokens: number;
      }
    >();

    for (const msg of assistantMessages) {
      const model = msg.message?.model;
      const usage = msg.message?.usage;

      // Skip synthetic messages or messages without model/usage
      if (!model || model === "<synthetic>" || !usage) {
        continue;
      }

      const existing = modelAgg.get(model) ?? {
        messageCount: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
      };

      existing.messageCount += 1;
      existing.inputTokens += usage.input_tokens || 0;
      existing.outputTokens += usage.output_tokens || 0;
      existing.cacheCreationTokens +=
        usage.cache_creation_input_tokens || 0;
      existing.cacheReadTokens += usage.cache_read_input_tokens || 0;

      modelAgg.set(model, existing);
    }

    // Build ModelUsageSummary array
    const modelSummaries: ModelUsageSummary[] = [];

    for (const [modelName, agg] of modelAgg) {
      const totalTokens =
        agg.inputTokens +
        agg.outputTokens +
        agg.cacheCreationTokens +
        agg.cacheReadTokens;

      const estimatedCost = calculateModelCost(
        modelName,
        agg.inputTokens,
        agg.outputTokens,
        agg.cacheCreationTokens,
        agg.cacheReadTokens,
      );

      modelSummaries.push({
        modelName,
        displayName: getDisplayName(modelName),
        messageCount: agg.messageCount,
        inputTokens: agg.inputTokens,
        outputTokens: agg.outputTokens,
        cacheCreationTokens: agg.cacheCreationTokens,
        cacheReadTokens: agg.cacheReadTokens,
        totalTokens,
        estimatedCost,
      });
    }

    // Sort by totalTokens descending
    modelSummaries.sort((a, b) => b.totalTokens - a.totalTokens);

    // Compute totals
    const totalCost = modelSummaries.reduce((sum, m) => sum + m.estimatedCost, 0);
    const totalTokens = modelSummaries.reduce((sum, m) => sum + m.totalTokens, 0);
    const totalInputTokens = modelSummaries.reduce((sum, m) => sum + m.inputTokens, 0);
    const totalOutputTokens = modelSummaries.reduce((sum, m) => sum + m.outputTokens, 0);
    const totalCacheCreationTokens = modelSummaries.reduce(
      (sum, m) => sum + m.cacheCreationTokens,
      0,
    );
    const totalCacheReadTokens = modelSummaries.reduce(
      (sum, m) => sum + m.cacheReadTokens,
      0,
    );
    const modelsUsed = modelSummaries.map((m) => m.modelName);

    return {
      sessionSlug,
      firstPrompt,
      startTime,
      endTime,
      userMessageCount: userMessages.length,
      assistantMessageCount: assistantMessages.length,
      totalMessages: messages.length,
      modelSummaries,
      totalCost,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      totalCacheCreationTokens,
      totalCacheReadTokens,
      modelsUsed,
    };
  }

  /**
   * Extract text from a user message
   */
  private extractPromptText(message: TranscriptMessage | undefined): string {
    if (!message?.message?.content) {
      return "No prompt available";
    }

    const content = message.message.content;

    // Handle string content
    if (typeof content === "string") {
      return this.truncateText(content, 100);
    }

    // Handle array content (multipart messages)
    if (Array.isArray(content)) {
      const textParts = content
        .filter((part) => part.type === "text" && part.text)
        .map((part) => part.text)
        .join(" ");

      return this.truncateText(textParts, 100);
    }

    return "No prompt available";
  }

  /**
   * Truncate text to a maximum length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength).trim() + "...";
  }
}
