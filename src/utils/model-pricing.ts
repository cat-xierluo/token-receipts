/**
 * Model Pricing Module
 *
 * Provides model display names, pricing data, and cost calculation utilities.
 * Used by TranscriptParser for cost calculation and by HtmlRenderer/ReceiptGenerator
 * for display names.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModelPrice {
  inputPerMillion: number;
  outputPerMillion: number;
  cacheWritePerMillion?: number;
  cacheReadPerMillion?: number;
  currency: string;
  symbol: string;
}

// ---------------------------------------------------------------------------
// Display Names
// ---------------------------------------------------------------------------

export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  // Anthropic
  "claude-sonnet-4-5": "Claude Sonnet 4.5",
  "claude-opus-4-5": "Claude Opus 4.5",
  "claude-3-5-sonnet": "Claude 3.5 Sonnet",
  "claude-3-opus": "Claude 3 Opus",
  "claude-3-haiku": "Claude 3 Haiku",
  "claude-haiku-4-5": "Claude Haiku 4.5",
  "claude-sonnet-4-6": "Claude Sonnet 4.6",
  "claude-opus-4-6": "Claude Opus 4.6",
  "claude-opus-4-7": "Claude Opus 4.7",
  "claude-opus-4-5-thinking": "Claude Opus 4.5 Thinking",
  "kiro-claude-haiku-4-5": "Kiro Claude Haiku 4.5",
  "kiro-claude-sonnet-4-5": "Kiro Claude Sonnet 4.5",
  // OpenAI
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
  "gpt-5.5": "GPT-5.5",
  "gpt-5.4": "GPT-5.4",
  "gpt-5.4-mini": "GPT-5.4 Mini",
  o1: "o1",
  "o1-pro": "o1 Pro",
  o3: "o3",
  "o3-mini": "o3 Mini",
  "o4-mini": "o4 Mini",
  // DeepSeek
  "deepseek-v4-pro": "DeepSeek V4 Pro",
  "deepseek-v4-flash": "DeepSeek V4 Flash",
  "deepseek-chat": "DeepSeek Chat",
  "deepseek-reasoner": "DeepSeek Reasoner",
  // GLM
  "glm-5.1": "GLM-5.1",
  "glm-5-turbo": "GLM-5 Turbo",
  "glm-5": "GLM-5",
  "glm-4.7": "GLM-4.7",
  "glm-4.5-air": "GLM-4.5 Air",
  "glm-4.5": "GLM-4.5",
  "glm-4-plus": "GLM-4 Plus",
  "glm-4-flash": "GLM-4 Flash",
  // MiniMax
  "MiniMax-M2": "MiniMax M2",
  "MiniMax-M2-Stable": "MiniMax M2 Stable",
  "MiniMax-M2-highspeed": "MiniMax M2 Highspeed",
  "MiniMax-M2.7": "MiniMax M2.7",
  "MiniMax-M2.7-highspeed": "MiniMax M2.7 Highspeed",
  "MiniMax-M2.5": "MiniMax M2.5",
  "MiniMax-M2.5-highspeed": "MiniMax M2.5 Highspeed",
  "MiniMax-M2.1": "MiniMax M2.1",
  "MiniMaxAI/MiniMax-M2": "MiniMax M2",
  // Qwen
  "qwen-max": "Qwen Max",
  "qwen3-max": "Qwen3 Max",
  "qwen3-max-preview": "Qwen3 Max Preview",
  "qwen-max-latest": "Qwen Max Latest",
  "qwen-plus": "Qwen Plus",
  "qwen-turbo": "Qwen Turbo",
  "qwen-flash": "Qwen Flash",
  "qwen-long": "Qwen Long",
  "qwq-plus": "QwQ Plus",
  "qwq-plus-latest": "QwQ Plus Latest",
  // Kimi (月之暗面)
  "kimi-k2.5": "Kimi K2.5",
  "kimi-k2-0905-preview": "Kimi K2 Preview",
  "kimi-k2-turbo-preview": "Kimi K2 Turbo",
  "kimi-k2-thinking": "Kimi K2 Thinking",
  "kimi-k2-thinking-turbo": "Kimi K2 Thinking Turbo",
  "moonshot-v1-8k": "Moonshot V1 8K",
  "moonshot-v1-32k": "Moonshot V1 32K",
  "moonshot-v1-128k": "Moonshot V1 128K",
};

// ---------------------------------------------------------------------------
// Pricing Table (private)
// ---------------------------------------------------------------------------

const PRICING_TABLE: Record<string, ModelPrice> = {
  // Anthropic - Claude Opus 4.7
  "claude-opus-4-7": {
    inputPerMillion: 15,
    outputPerMillion: 75,
    cacheWritePerMillion: 18.75,
    cacheReadPerMillion: 1.5,
    currency: "USD",
    symbol: "$",
  },
  // Anthropic - Claude Opus 4.6
  "claude-opus-4-6": {
    inputPerMillion: 15,
    outputPerMillion: 75,
    cacheWritePerMillion: 18.75,
    cacheReadPerMillion: 1.5,
    currency: "USD",
    symbol: "$",
  },
  // Anthropic - Claude Opus 4.5
  "claude-opus-4-5": {
    inputPerMillion: 15,
    outputPerMillion: 75,
    cacheWritePerMillion: 18.75,
    cacheReadPerMillion: 1.5,
    currency: "USD",
    symbol: "$",
  },
  // Anthropic - Claude Opus 4.5 Thinking
  "claude-opus-4-5-thinking": {
    inputPerMillion: 15,
    outputPerMillion: 75,
    cacheWritePerMillion: 18.75,
    cacheReadPerMillion: 1.5,
    currency: "USD",
    symbol: "$",
  },
  // Anthropic - Claude Sonnet 4.6
  "claude-sonnet-4-6": {
    inputPerMillion: 3,
    outputPerMillion: 15,
    cacheWritePerMillion: 3.75,
    cacheReadPerMillion: 0.3,
    currency: "USD",
    symbol: "$",
  },
  // Anthropic - Claude Sonnet 4.5
  "claude-sonnet-4-5": {
    inputPerMillion: 3,
    outputPerMillion: 15,
    cacheWritePerMillion: 3.75,
    cacheReadPerMillion: 0.3,
    currency: "USD",
    symbol: "$",
  },
  // Anthropic - Claude 3.5 Sonnet
  "claude-3-5-sonnet": {
    inputPerMillion: 3,
    outputPerMillion: 15,
    cacheWritePerMillion: 3.75,
    cacheReadPerMillion: 0.3,
    currency: "USD",
    symbol: "$",
  },
  // Anthropic - Claude 3 Opus
  "claude-3-opus": {
    inputPerMillion: 15,
    outputPerMillion: 75,
    cacheWritePerMillion: 18.75,
    cacheReadPerMillion: 1.5,
    currency: "USD",
    symbol: "$",
  },
  // Anthropic - Claude Haiku 4.5
  "claude-haiku-4-5": {
    inputPerMillion: 0.8,
    outputPerMillion: 4,
    cacheWritePerMillion: 1,
    cacheReadPerMillion: 0.08,
    currency: "USD",
    symbol: "$",
  },
  // Anthropic - Claude 3 Haiku
  "claude-3-haiku": {
    inputPerMillion: 0.25,
    outputPerMillion: 1.25,
    cacheWritePerMillion: 0.3,
    cacheReadPerMillion: 0.03,
    currency: "USD",
    symbol: "$",
  },
  // Kiro - Claude Haiku 4.5
  "kiro-claude-haiku-4-5": {
    inputPerMillion: 0.8,
    outputPerMillion: 4,
    cacheWritePerMillion: 1,
    cacheReadPerMillion: 0.08,
    currency: "USD",
    symbol: "$",
  },
  // Kiro - Claude Sonnet 4.5
  "kiro-claude-sonnet-4-5": {
    inputPerMillion: 3,
    outputPerMillion: 15,
    cacheWritePerMillion: 3.75,
    cacheReadPerMillion: 0.3,
    currency: "USD",
    symbol: "$",
  },
  // OpenAI - GPT-4o
  "gpt-4o": {
    inputPerMillion: 2.5,
    outputPerMillion: 10,
    cacheWritePerMillion: 2.5,
    cacheReadPerMillion: 1.25,
    currency: "USD",
    symbol: "$",
  },
  // OpenAI - GPT-4o Mini
  "gpt-4o-mini": {
    inputPerMillion: 0.15,
    outputPerMillion: 0.6,
    cacheWritePerMillion: 0.15,
    cacheReadPerMillion: 0.075,
    currency: "USD",
    symbol: "$",
  },
  // OpenAI - GPT-5.5
  "gpt-5.5": {
    inputPerMillion: 5,
    outputPerMillion: 30,
    cacheReadPerMillion: 0.5,
    currency: "USD",
    symbol: "$",
  },
  // OpenAI - GPT-5.4
  "gpt-5.4": {
    inputPerMillion: 2.5,
    outputPerMillion: 15,
    cacheReadPerMillion: 0.25,
    currency: "USD",
    symbol: "$",
  },
  // OpenAI - GPT-5.4 Mini
  "gpt-5.4-mini": {
    inputPerMillion: 0.75,
    outputPerMillion: 4.5,
    cacheReadPerMillion: 0.075,
    currency: "USD",
    symbol: "$",
  },
  // OpenAI - o1
  o1: {
    inputPerMillion: 15,
    outputPerMillion: 60,
    currency: "USD",
    symbol: "$",
  },
  // OpenAI - o1 Pro
  "o1-pro": {
    inputPerMillion: 150,
    outputPerMillion: 600,
    currency: "USD",
    symbol: "$",
  },
  // OpenAI - o3
  o3: {
    inputPerMillion: 10,
    outputPerMillion: 40,
    currency: "USD",
    symbol: "$",
  },
  // OpenAI - o3 Mini
  "o3-mini": {
    inputPerMillion: 1.1,
    outputPerMillion: 4.4,
    currency: "USD",
    symbol: "$",
  },
  // OpenAI - o4 Mini
  "o4-mini": {
    inputPerMillion: 1.1,
    outputPerMillion: 4.4,
    currency: "USD",
    symbol: "$",
  },
  // DeepSeek - V4 Pro (75% discount pricing)
  "deepseek-v4-pro": {
    inputPerMillion: 3,
    outputPerMillion: 6,
    cacheReadPerMillion: 0.025,
    currency: "CNY",
    symbol: "¥",
  },
  // DeepSeek - V4 Flash
  "deepseek-v4-flash": {
    inputPerMillion: 1,
    outputPerMillion: 2,
    cacheReadPerMillion: 0.02,
    currency: "CNY",
    symbol: "¥",
  },
  // DeepSeek - Chat (= V4 Flash pricing)
  "deepseek-chat": {
    inputPerMillion: 1,
    outputPerMillion: 2,
    cacheReadPerMillion: 0.02,
    currency: "CNY",
    symbol: "¥",
  },
  // DeepSeek - Reasoner (= V4 Flash pricing)
  "deepseek-reasoner": {
    inputPerMillion: 1,
    outputPerMillion: 2,
    cacheReadPerMillion: 0.02,
    currency: "CNY",
    symbol: "¥",
  },
  // GLM - 5.1
  "glm-5.1": {
    inputPerMillion: 6,
    outputPerMillion: 24,
    cacheReadPerMillion: 1.3,
    currency: "CNY",
    symbol: "¥",
  },
  // GLM - 5 Turbo
  "glm-5-turbo": {
    inputPerMillion: 5,
    outputPerMillion: 22,
    cacheReadPerMillion: 1.2,
    currency: "CNY",
    symbol: "¥",
  },
  // GLM - 5
  "glm-5": {
    inputPerMillion: 4,
    outputPerMillion: 18,
    cacheReadPerMillion: 1,
    currency: "CNY",
    symbol: "¥",
  },
  // GLM - 4.7
  "glm-4.7": {
    inputPerMillion: 2,
    outputPerMillion: 8,
    cacheReadPerMillion: 0.4,
    currency: "CNY",
    symbol: "¥",
  },
  // GLM - 4.5 Air
  "glm-4.5-air": {
    inputPerMillion: 0.8,
    outputPerMillion: 2,
    cacheReadPerMillion: 0.16,
    currency: "CNY",
    symbol: "¥",
  },
  // GLM - 4.5
  "glm-4.5": {
    inputPerMillion: 2,
    outputPerMillion: 8,
    cacheReadPerMillion: 0.4,
    currency: "CNY",
    symbol: "¥",
  },
  // GLM - 4 Plus (uniform input/output)
  "glm-4-plus": {
    inputPerMillion: 5,
    outputPerMillion: 5,
    currency: "CNY",
    symbol: "¥",
  },
  // GLM - 4 Flash (free)
  "glm-4-flash": {
    inputPerMillion: 0,
    outputPerMillion: 0,
    currency: "CNY",
    symbol: "¥",
  },
  // MiniMax - M2
  "MiniMax-M2": {
    inputPerMillion: 2.1,
    outputPerMillion: 8.4,
    cacheWritePerMillion: 2.625,
    cacheReadPerMillion: 0.21,
    currency: "CNY",
    symbol: "¥",
  },
  // MiniMax - M2 Stable
  "MiniMax-M2-Stable": {
    inputPerMillion: 2.1,
    outputPerMillion: 8.4,
    cacheWritePerMillion: 2.625,
    cacheReadPerMillion: 0.21,
    currency: "CNY",
    symbol: "¥",
  },
  // MiniMax - M2 Highspeed
  "MiniMax-M2-highspeed": {
    inputPerMillion: 2.1,
    outputPerMillion: 8.4,
    cacheWritePerMillion: 2.625,
    cacheReadPerMillion: 0.21,
    currency: "CNY",
    symbol: "¥",
  },
  // MiniMax - M2 (MiniMaxAI prefix variant)
  "MiniMaxAI/MiniMax-M2": {
    inputPerMillion: 2.1,
    outputPerMillion: 8.4,
    cacheWritePerMillion: 2.625,
    cacheReadPerMillion: 0.21,
    currency: "CNY",
    symbol: "¥",
  },
  // MiniMax - M2.7
  "MiniMax-M2.7": {
    inputPerMillion: 2.1,
    outputPerMillion: 8.4,
    cacheWritePerMillion: 2.625,
    cacheReadPerMillion: 0.21,
    currency: "CNY",
    symbol: "¥",
  },
  // MiniMax - M2.7 Highspeed
  "MiniMax-M2.7-highspeed": {
    inputPerMillion: 2.1,
    outputPerMillion: 8.4,
    cacheWritePerMillion: 2.625,
    cacheReadPerMillion: 0.21,
    currency: "CNY",
    symbol: "¥",
  },
  // MiniMax - M2.5
  "MiniMax-M2.5": {
    inputPerMillion: 2.1,
    outputPerMillion: 8.4,
    cacheWritePerMillion: 2.625,
    cacheReadPerMillion: 0.21,
    currency: "CNY",
    symbol: "¥",
  },
  // MiniMax - M2.5 Highspeed
  "MiniMax-M2.5-highspeed": {
    inputPerMillion: 2.1,
    outputPerMillion: 8.4,
    cacheWritePerMillion: 2.625,
    cacheReadPerMillion: 0.21,
    currency: "CNY",
    symbol: "¥",
  },
  // MiniMax - M2.1
  "MiniMax-M2.1": {
    inputPerMillion: 2.1,
    outputPerMillion: 8.4,
    cacheWritePerMillion: 2.625,
    cacheReadPerMillion: 0.21,
    currency: "CNY",
    symbol: "¥",
  },
  // Qwen - Max
  "qwen-max": {
    inputPerMillion: 3.2,
    outputPerMillion: 12.8,
    currency: "CNY",
    symbol: "¥",
  },
  // Qwen3 - Max
  "qwen3-max": {
    inputPerMillion: 3.2,
    outputPerMillion: 12.8,
    currency: "CNY",
    symbol: "¥",
  },
  // Qwen3 - Max Preview
  "qwen3-max-preview": {
    inputPerMillion: 3.2,
    outputPerMillion: 12.8,
    currency: "CNY",
    symbol: "¥",
  },
  // Qwen - Max Latest
  "qwen-max-latest": {
    inputPerMillion: 2.4,
    outputPerMillion: 9.6,
    currency: "CNY",
    symbol: "¥",
  },
  // Qwen - Plus
  "qwen-plus": {
    inputPerMillion: 0.8,
    outputPerMillion: 2,
    currency: "CNY",
    symbol: "¥",
  },
  // Qwen - Turbo
  "qwen-turbo": {
    inputPerMillion: 0.3,
    outputPerMillion: 0.6,
    currency: "CNY",
    symbol: "¥",
  },
  // Qwen - Flash
  "qwen-flash": {
    inputPerMillion: 0.15,
    outputPerMillion: 1.5,
    currency: "CNY",
    symbol: "¥",
  },
  // Qwen - Long
  "qwen-long": {
    inputPerMillion: 0.5,
    outputPerMillion: 2,
    currency: "CNY",
    symbol: "¥",
  },
  // QwQ - Plus
  "qwq-plus": {
    inputPerMillion: 1.6,
    outputPerMillion: 4,
    currency: "CNY",
    symbol: "¥",
  },
  // QwQ - Plus Latest
  "qwq-plus-latest": {
    inputPerMillion: 1.6,
    outputPerMillion: 4,
    currency: "CNY",
    symbol: "¥",
  },
  // Kimi - K2.5
  "kimi-k2.5": {
    inputPerMillion: 4,
    outputPerMillion: 21,
    cacheReadPerMillion: 0.7,
    currency: "CNY",
    symbol: "¥",
  },
  // Kimi - K2 Preview (0905)
  "kimi-k2-0905-preview": {
    inputPerMillion: 4,
    outputPerMillion: 16,
    cacheReadPerMillion: 1,
    currency: "CNY",
    symbol: "¥",
  },
  // Kimi - K2 Preview (0711)
  "kimi-k2-0711-preview": {
    inputPerMillion: 4,
    outputPerMillion: 16,
    cacheReadPerMillion: 1,
    currency: "CNY",
    symbol: "¥",
  },
  // Kimi - K2 Turbo Preview
  "kimi-k2-turbo-preview": {
    inputPerMillion: 8,
    outputPerMillion: 58,
    cacheReadPerMillion: 1,
    currency: "CNY",
    symbol: "¥",
  },
  // Kimi - K2 Thinking
  "kimi-k2-thinking": {
    inputPerMillion: 4,
    outputPerMillion: 16,
    cacheReadPerMillion: 1,
    currency: "CNY",
    symbol: "¥",
  },
  // Kimi - K2 Thinking Turbo
  "kimi-k2-thinking-turbo": {
    inputPerMillion: 8,
    outputPerMillion: 58,
    cacheReadPerMillion: 1,
    currency: "CNY",
    symbol: "¥",
  },
  // Moonshot - V1 8K
  "moonshot-v1-8k": {
    inputPerMillion: 2,
    outputPerMillion: 10,
    currency: "CNY",
    symbol: "¥",
  },
  // Moonshot - V1 32K
  "moonshot-v1-32k": {
    inputPerMillion: 5,
    outputPerMillion: 20,
    currency: "CNY",
    symbol: "¥",
  },
  // Moonshot - V1 128K
  "moonshot-v1-128k": {
    inputPerMillion: 10,
    outputPerMillion: 30,
    currency: "CNY",
    symbol: "¥",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip a trailing date suffix (e.g. "-20260509") from a model ID so that
 * lookups work regardless of whether the caller received a dated variant.
 */
function stripDateSuffix(modelId: string): string {
  return modelId.replace(/-\d{8}$/, "");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a human-readable display name for a model.
 * Falls back to the raw model ID if no mapping exists.
 */
export function getDisplayName(modelId: string): string {
  const key = stripDateSuffix(modelId);
  return MODEL_DISPLAY_NAMES[key] ?? key;
}

/**
 * Look up pricing data for a model.
 * Returns `undefined` if the model is not in the pricing table.
 */
export function getModelPrice(modelId: string): ModelPrice | undefined {
  const key = stripDateSuffix(modelId);
  return PRICING_TABLE[key];
}

/**
 * Calculate the cost (in the model's native currency) for a given usage.
 *
 * All token counts are raw counts (not per-million). The function divides
 * by 1,000,000 internally.
 *
 * Returns 0 if the model is not found in the pricing table.
 */
export function calculateModelCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens?: number,
  cacheReadTokens?: number,
): number {
  const price = getModelPrice(modelId);
  if (!price) return 0;

  const inputCost = (inputTokens / 1_000_000) * price.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * price.outputPerMillion;
  const cacheWriteCost =
    cacheCreationTokens && price.cacheWritePerMillion
      ? (cacheCreationTokens / 1_000_000) * price.cacheWritePerMillion
      : 0;
  const cacheReadCost =
    cacheReadTokens && price.cacheReadPerMillion
      ? (cacheReadTokens / 1_000_000) * price.cacheReadPerMillion
      : 0;

  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}

/**
 * Get the currency symbol for a model's pricing (e.g. "$" or "¥").
 * Falls back to "$" if the model is unknown.
 */
export function getCurrencySymbol(modelId: string): string {
  const price = getModelPrice(modelId);
  return price?.symbol ?? "$";
}

export type Provider = "anthropic" | "openai" | "deepseek" | "glm" | "minimax" | "qwen" | "kimi" | "unknown";

export function getProvider(modelId: string): Provider {
  const key = stripDateSuffix(modelId).toLowerCase();
  if (key.startsWith("claude") || key.startsWith("kiro-claude")) return "anthropic";
  if (key.startsWith("gpt") || key === "o1" || key.startsWith("o1-") || key.startsWith("o3") || key.startsWith("o4")) return "openai";
  if (key.startsWith("deepseek")) return "deepseek";
  if (key.startsWith("glm")) return "glm";
  if (key.startsWith("minimax") || key.startsWith("minimaxai")) return "minimax";
  if (key.startsWith("qwen") || key.startsWith("qwq")) return "qwen";
  if (key.startsWith("kimi") || key.startsWith("moonshot")) return "kimi";
  return "unknown";
}
