// Transcript JSONL types

export interface UsageData {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  server_tool_use?: {
    web_search_requests: number;
    web_fetch_requests: number;
  };
  cache_creation?: {
    ephemeral_1h_input_tokens: number;
    ephemeral_5m_input_tokens: number;
  };
  service_tier?: string;
  speed?: string;
}

export interface TranscriptMessage {
  type:
    | "user"
    | "assistant"
    | "file-history-snapshot"
    | "attachment"
    | "last-prompt"
    | "permission-mode";
  message?: {
    content:
      | string
      | Array<{ type: string; text?: string; [key: string]: unknown }>;
    role?: "user" | "assistant";
    model?: string;
    usage?: UsageData;
    id?: string;
    stop_reason?: string;
    stop_sequence?: string | null;
    type?: string;
  };
  slug?: string;
  sessionId?: string;
  cwd?: string;
  version?: string;
  gitBranch?: string;
  timestamp: string;
  uuid?: string;
  usage?: UsageData | null;
  costUSD?: number | null;
}

export interface ModelUsageSummary {
  modelName: string;
  displayName: string;
  messageCount: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface ParsedTranscript {
  sessionSlug: string;
  firstPrompt: string;
  startTime: Date;
  endTime: Date;
  userMessageCount: number;
  assistantMessageCount: number;
  totalMessages: number;
  modelSummaries: ModelUsageSummary[];
  totalCost: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreationTokens: number;
  totalCacheReadTokens: number;
  modelsUsed: string[];
}
