import { basename, dirname } from "node:path";
import type { ModelUsageSummary } from "../types/transcript.js";
import type {
  DailySummary,
  DailySessionEntry,
} from "../types/daily.js";
import { TranscriptParser } from "./transcript-parser.js";
import { CodexParser } from "./codex-parser.js";
import type { ParsedTranscript } from "../types/transcript.js";

export class DailyAggregator {
  private claudeParser = new TranscriptParser();
  private codexParser = new CodexParser();

  async aggregate(filePaths: string[], targetDate: string): Promise<DailySummary> {
    const sessions: DailySessionEntry[] = [];
    const modelMap = new Map<string, ModelUsageSummary>();

    for (const fp of filePaths) {
      try {
        const isCodex = fp.includes("/.codex/sessions/");
        const parser = isCodex ? this.codexParser : this.claudeParser;
        const parsed: ParsedTranscript = await parser.parseTranscript(fp);

        // Only include sessions that overlap with the target date
        if (!this.overlapsDate(parsed.startTime, parsed.endTime, targetDate)) continue;

        sessions.push({
          sessionId: basename(fp, ".jsonl"),
          sessionSlug: parsed.sessionSlug,
          projectDir: basename(dirname(fp)),
          firstPrompt: parsed.firstPrompt,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          totalCost: parsed.totalCost,
          totalTokens: parsed.totalTokens,
          modelsUsed: parsed.modelsUsed,
        });

        // Merge model summaries
        for (const ms of parsed.modelSummaries) {
          const existing = modelMap.get(ms.modelName);
          if (existing) {
            existing.messageCount += ms.messageCount;
            existing.inputTokens += ms.inputTokens;
            existing.outputTokens += ms.outputTokens;
            existing.cacheCreationTokens += ms.cacheCreationTokens;
            existing.cacheReadTokens += ms.cacheReadTokens;
            existing.totalTokens += ms.totalTokens;
            existing.estimatedCost += ms.estimatedCost;
          } else {
            modelMap.set(ms.modelName, { ...ms });
          }
        }
      } catch {
        // Skip unreadable/parsable files
      }
    }

    const modelSummaries = [...modelMap.values()].sort(
      (a, b) => b.totalTokens - a.totalTokens
    );

    const totalCost = modelSummaries.reduce((s, m) => s + m.estimatedCost, 0);
    const totalTokens = modelSummaries.reduce((s, m) => s + m.totalTokens, 0);
    const totalInputTokens = modelSummaries.reduce(
      (s, m) => s + m.inputTokens,
      0
    );
    const totalOutputTokens = modelSummaries.reduce(
      (s, m) => s + m.outputTokens,
      0
    );
    const totalCacheCreationTokens = modelSummaries.reduce(
      (s, m) => s + m.cacheCreationTokens,
      0
    );
    const totalCacheReadTokens = modelSummaries.reduce(
      (s, m) => s + m.cacheReadTokens,
      0
    );
    const totalUserMessages = sessions.reduce(
      (s, ses) => s + (ses.totalTokens > 0 ? 1 : 0),
      0
    );

    const earliestStart = sessions.length
      ? sessions.reduce(
          (min, s) => (s.startTime < min ? s.startTime : min),
          sessions[0].startTime
        )
      : new Date(targetDate);
    const latestEnd = sessions.length
      ? sessions.reduce(
          (max, s) => (s.endTime > max ? s.endTime : max),
          sessions[0].endTime
        )
      : new Date(targetDate);

    return {
      date: targetDate,
      sessions: sessions.sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      ),
      sessionCount: sessions.length,
      earliestStart,
      latestEnd,
      modelSummaries,
      totalCost,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      totalCacheCreationTokens,
      totalCacheReadTokens,
      totalUserMessages: sessions.length,
      totalAssistantMessages: sessions.length,
      allModelsUsed: [...new Set(sessions.flatMap((s) => s.modelsUsed))],
    };
  }

  private toLocalDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  /** Check if a session's time range overlaps with the target date (local time) */
  private overlapsDate(start: Date, end: Date, targetDate: string): boolean {
    // Parse target date as local midnight
    const [y, m, d] = targetDate.split("-").map(Number);
    const dayStart = new Date(y, m - 1, d);
    const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
    return end >= dayStart && start <= dayEnd;
  }
}
