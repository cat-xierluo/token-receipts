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
  // OpenAI
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
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
  "glm-4-plus": "GLM-4 Plus",
  "glm-4-flash": "GLM-4 Flash",
  // MiniMax
  "MiniMax-M2.7-highspeed": "MiniMax M2.7 Highspeed",
  // Qwen
  "qwen-max": "Qwen Max",
  "qwen-plus": "Qwen Plus",
  "qwen-turbo": "Qwen Turbo",
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
  // DeepSeek - V4 Pro
  "deepseek-v4-pro": {
    inputPerMillion: 2.5,
    outputPerMillion: 10,
    cacheWritePerMillion: 2.5,
    cacheReadPerMillion: 0.5,
    currency: "USD",
    symbol: "$",
  },
  // DeepSeek - V4 Flash
  "deepseek-v4-flash": {
    inputPerMillion: 0.3,
    outputPerMillion: 1.2,
    cacheWritePerMillion: 0.3,
    cacheReadPerMillion: 0.06,
    currency: "USD",
    symbol: "$",
  },
  // DeepSeek - Chat
  "deepseek-chat": {
    inputPerMillion: 0.27,
    outputPerMillion: 1.1,
    cacheWritePerMillion: 0.27,
    cacheReadPerMillion: 0.07,
    currency: "USD",
    symbol: "$",
  },
  // DeepSeek - Reasoner
  "deepseek-reasoner": {
    inputPerMillion: 0.55,
    outputPerMillion: 2.19,
    cacheWritePerMillion: 0.55,
    cacheReadPerMillion: 0.14,
    currency: "USD",
    symbol: "$",
  },
  // GLM - free / Chinese market pricing
  "glm-5.1": {
    inputPerMillion: 0,
    outputPerMillion: 0,
    currency: "CNY",
    symbol: "¥",
  },
  "glm-4-plus": {
    inputPerMillion: 0,
    outputPerMillion: 0,
    currency: "CNY",
    symbol: "¥",
  },
  "glm-4-flash": {
    inputPerMillion: 0,
    outputPerMillion: 0,
    currency: "CNY",
    symbol: "¥",
  },
  // MiniMax
  "MiniMax-M2.7-highspeed": {
    inputPerMillion: 0,
    outputPerMillion: 0,
    currency: "CNY",
    symbol: "¥",
  },
  // Qwen
  "qwen-max": {
    inputPerMillion: 0,
    outputPerMillion: 0,
    currency: "CNY",
    symbol: "¥",
  },
  "qwen-plus": {
    inputPerMillion: 0,
    outputPerMillion: 0,
    currency: "CNY",
    symbol: "¥",
  },
  "qwen-turbo": {
    inputPerMillion: 0,
    outputPerMillion: 0,
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
