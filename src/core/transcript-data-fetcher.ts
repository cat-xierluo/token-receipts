import { TranscriptParser } from "./transcript-parser.js";
import type { ParsedTranscript } from "../types/transcript.js";
import type { CcusageSession, ModelBreakdown } from "../types/ccusage.js";

export class TranscriptDataFetcher {
  private parser = new TranscriptParser();

  /**
   * 从 transcript 文件获取 session 数据
   * 返回与 CcusageSession 兼容的结构
   */
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
