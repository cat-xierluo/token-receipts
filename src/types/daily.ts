import type { ModelUsageSummary } from "./transcript.js";
import type { ReceiptConfig } from "./config.js";

export interface DailySessionEntry {
  sessionId: string;
  sessionSlug: string;
  projectDir: string;
  firstPrompt: string;
  startTime: Date;
  endTime: Date;
  totalCost: number;
  totalTokens: number;
  modelsUsed: string[];
}

export interface DailySummary {
  date: string;
  sessions: DailySessionEntry[];
  sessionCount: number;
  earliestStart: Date;
  latestEnd: Date;
  modelSummaries: ModelUsageSummary[];
  totalCost: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreationTokens: number;
  totalCacheReadTokens: number;
  totalUserMessages: number;
  totalAssistantMessages: number;
  allModelsUsed: string[];
  totalCostCNY: number;
  exchangeRate: number;
  hasUsdModel: boolean;
}

export interface DailySummaryData {
  summary: DailySummary;
  location: string;
  config: ReceiptConfig;
}
