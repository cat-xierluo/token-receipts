import { CodexParser } from "./codex-parser.js";
import type { ParsedTranscript } from "../types/transcript.js";
import type { CcusageSession, ModelBreakdown } from "../types/ccusage.js";

export class CodexDataFetcher {
  private parser = new CodexParser();

  async fetchFromTranscript(transcriptPath: string): Promise<{
    sessionData: CcusageSession;
    transcriptData: ParsedTranscript;
  }> {
    const transcriptData = await this.parser.parseTranscript(transcriptPath);

    const modelBreakdowns: ModelBreakdown[] = transcriptData.modelSummaries.map((m) => ({
      modelName: m.modelName,
      inputTokens: m.inputTokens,
      outputTokens: m.outputTokens,
      cacheCreationTokens: m.cacheCreationTokens,
      cacheReadTokens: m.cacheReadTokens,
      cost: m.estimatedCost,
    }));

    const sessionData: CcusageSession = {
      sessionId: "",
      inputTokens: transcriptData.totalInputTokens,
      outputTokens: transcriptData.totalOutputTokens,
      cacheCreationTokens: transcriptData.totalCacheCreationTokens,
      cacheReadTokens: transcriptData.totalCacheReadTokens,
      totalTokens: transcriptData.totalTokens,
      totalCost: transcriptData.totalCost,
      modelsUsed: transcriptData.modelsUsed,
      modelBreakdowns,
    };

    return { sessionData, transcriptData };
  }
}
