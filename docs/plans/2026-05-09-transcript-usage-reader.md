# 多模型 Transcript 直读 + 自动保存 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 从 session transcript JSONL 直接读取 token usage 和模型信息，替代 ccusage 依赖，支持所有模型；收据自动保存到桌面/下载文件夹。

**Architecture:** 扩展 TranscriptParser 解析 `message.usage` 和 `message.model`，新建 ModelPricing 模块根据 token 数 × 模型定价计算费用，重写数据获取层为纯 transcript 直读。输出路径改为桌面/下载文件夹。

**Tech Stack:** TypeScript, Node.js 22+, 现有依赖

---

### Task 1: 扩展 Transcript 类型定义

**Files:**
- Modify: `src/types/transcript.ts`

**Step 1: 更新类型定义**

在 `TranscriptMessage` 中添加 `message.usage` 的完整类型，新增 `TranscriptUsage` 和 `ModelUsageSummary` 类型：

```typescript
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
  type: "user" | "assistant" | "file-history-snapshot" | "attachment" | "last-prompt" | "permission-mode";
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
  usage?: UsageData | null;  // 顶层 usage 通常为 null
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
```

**Step 2: 验证编译**

Run: `npm run build`
Expected: 编译通过

**Step 3: Commit**

```bash
git add src/types/transcript.ts
git commit -m "feat: 扩展 transcript 类型定义，添加 usage 和 model 支持多模型"
```

---

### Task 2: 新建 ModelPricing 模块

**Files:**
- Create: `src/utils/model-pricing.ts`

**Step 1: 创建模型定价模块**

```typescript
// 模型定价表（每百万 token 的美元价格）
// 数据来源：各模型官方定价页

export interface ModelPrice {
  inputPerMillion: number;       // 输入价格 / 百万 token
  outputPerMillion: number;      // 输出价格 / 百万 token
  cacheWritePerMillion?: number; // 缓存写入价格
  cacheReadPerMillion?: number;  // 缓存读取价格
  currency: string;
  symbol: string;
}

// 模型显示名称映射
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
  "o1": "OpenAI o1",
  "o1-pro": "OpenAI o1 Pro",
  "o3": "OpenAI o3",
  "o3-mini": "OpenAI o3 Mini",
  "o4-mini": "OpenAI o4 Mini",
  // DeepSeek
  "deepseek-v4-pro": "DeepSeek V4 Pro",
  "deepseek-v4-flash": "DeepSeek V4 Flash",
  "deepseek-chat": "DeepSeek Chat",
  "deepseek-reasoner": "DeepSeek Reasoner",
  // GLM / 智谱
  "glm-5.1": "GLM-5.1",
  "glm-4-plus": "GLM-4 Plus",
  "glm-4-flash": "GLM-4 Flash",
  // MiniMax
  "MiniMax-M2.7-highspeed": "MiniMax M2.7",
  // Qwen
  "qwen-max": "Qwen Max",
  "qwen-plus": "Qwen Plus",
  "qwen-turbo": "Qwen Turbo",
};

// 定价表（USD per million tokens）
const PRICING_TABLE: Record<string, ModelPrice> = {
  // Anthropic Claude
  "claude-opus-4-7": { inputPerMillion: 15, outputPerMillion: 75, cacheWritePerMillion: 18.75, cacheReadPerMillion: 1.50, currency: "USD", symbol: "$" },
  "claude-opus-4-6": { inputPerMillion: 15, outputPerMillion: 75, cacheWritePerMillion: 18.75, cacheReadPerMillion: 1.50, currency: "USD", symbol: "$" },
  "claude-opus-4-5": { inputPerMillion: 15, outputPerMillion: 75, cacheWritePerMillion: 18.75, cacheReadPerMillion: 1.50, currency: "USD", symbol: "$" },
  "claude-sonnet-4-6": { inputPerMillion: 3, outputPerMillion: 15, cacheWritePerMillion: 3.75, cacheReadPerMillion: 0.30, currency: "USD", symbol: "$" },
  "claude-sonnet-4-5": { inputPerMillion: 3, outputPerMillion: 15, cacheWritePerMillion: 3.75, cacheReadPerMillion: 0.30, currency: "USD", symbol: "$" },
  "claude-haiku-4-5": { inputPerMillion: 0.80, outputPerMillion: 4, cacheWritePerMillion: 1, cacheReadPerMillion: 0.08, currency: "USD", symbol: "$" },
  "claude-3-5-sonnet": { inputPerMillion: 3, outputPerMillion: 15, cacheWritePerMillion: 3.75, cacheReadPerMillion: 0.30, currency: "USD", symbol: "$" },
  "claude-3-opus": { inputPerMillion: 15, outputPerMillion: 75, cacheWritePerMillion: 18.75, cacheReadPerMillion: 1.50, currency: "USD", symbol: "$" },
  "claude-3-haiku": { inputPerMillion: 0.25, outputPerMillion: 1.25, cacheWritePerMillion: 0.30, cacheReadPerMillion: 0.03, currency: "USD", symbol: "$" },
  // DeepSeek
  "deepseek-v4-pro": { inputPerMillion: 2.50, outputPerMillion: 10, cacheWritePerMillion: 2.50, cacheReadPerMillion: 0.50, currency: "USD", symbol: "$" },
  "deepseek-v4-flash": { inputPerMillion: 0.30, outputPerMillion: 1.20, cacheWritePerMillion: 0.30, cacheReadPerMillion: 0.06, currency: "USD", symbol: "$" },
  "deepseek-chat": { inputPerMillion: 0.27, outputPerMillion: 1.10, cacheWritePerMillion: 0.27, cacheReadPerMillion: 0.05, currency: "USD", symbol: "$" },
  "deepseek-reasoner": { inputPerMillion: 4, outputPerMillion: 16, cacheWritePerMillion: 4, cacheReadPerMillion: 0.80, currency: "USD", symbol: "$" },
  // GLM / 智谱
  "glm-5.1": { inputPerMillion: 0, outputPerMillion: 0, currency: "CNY", symbol: "¥" },
  "glm-4-plus": { inputPerMillion: 0.05, outputPerMillion: 0.05, currency: "CNY", symbol: "¥" },
  "glm-4-flash": { inputPerMillion: 0, outputPerMillion: 0, currency: "CNY", symbol: "¥" },
  // MiniMax
  "MiniMax-M2.7-highspeed": { inputPerMillion: 0, outputPerMillion: 0, currency: "CNY", symbol: "¥" },
  // OpenAI
  "gpt-4o": { inputPerMillion: 2.50, outputPerMillion: 10, cacheReadPerMillion: 1.25, currency: "USD", symbol: "$" },
  "gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.60, cacheReadPerMillion: 0.075, currency: "USD", symbol: "$" },
  "o3": { inputPerMillion: 2, outputPerMillion: 8, cacheReadPerMillion: 1, currency: "USD", symbol: "$" },
  "o3-mini": { inputPerMillion: 1.10, outputPerMillion: 4.40, cacheReadPerMillion: 0.55, currency: "USD", symbol: "$" },
  "o4-mini": { inputPerMillion: 1.10, outputPerMillion: 4.40, cacheReadPerMillion: 0.55, currency: "USD", symbol: "$" },
};

/**
 * 获取模型显示名称
 */
export function getDisplayName(modelId: string): string {
  const cleaned = modelId.replace(/-\d{8}$/, "");
  return MODEL_DISPLAY_NAMES[cleaned] || cleaned;
}

/**
 * 获取模型定价
 */
export function getModelPrice(modelId: string): ModelPrice | undefined {
  const cleaned = modelId.replace(/-\d{8}$/, "");
  return PRICING_TABLE[cleaned];
}

/**
 * 计算模型费用
 */
export function calculateModelCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens: number = 0,
  cacheReadTokens: number = 0,
): number {
  const pricing = getModelPrice(modelId);
  if (!pricing) return 0;

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  const cacheWriteCost = cacheCreationTokens > 0 && pricing.cacheWritePerMillion
    ? (cacheCreationTokens / 1_000_000) * pricing.cacheWritePerMillion
    : 0;
  const cacheReadCost = cacheReadTokens > 0 && pricing.cacheReadPerMillion
    ? (cacheReadTokens / 1_000_000) * pricing.cacheReadPerMillion
    : 0;

  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}

/**
 * 获取货币符号
 */
export function getCurrencySymbol(modelId: string): string {
  const pricing = getModelPrice(modelId);
  return pricing?.symbol || "$";
}
```

**Step 2: 验证编译**

Run: `npm run build`
Expected: 编译通过

**Step 3: Commit**

```bash
git add src/utils/model-pricing.ts
git commit -m "feat: 新建模型定价模块，支持多模型费用计算"
```

---

### Task 3: 重写 TranscriptParser 解析 usage 数据

**Files:**
- Modify: `src/core/transcript-parser.ts`

**Step 1: 重写 TranscriptParser**

核心改动：解析每条 `message.usage` 和 `message.model`，按模型聚合 token 消耗，利用 ModelPricing 计算费用。

```typescript
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
    const expandedPath = transcriptPath.replace(/^~/, process.env.HOME || "");

    if (!existsSync(expandedPath)) {
      throw new Error(`Transcript file not found: ${transcriptPath}`);
    }

    const content = await readFile(expandedPath, "utf-8");
    const lines = content.trim().split("\n");

    const messages: TranscriptMessage[] = lines
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));

    const userMessages = messages.filter((m) => m.type === "user");
    const assistantMessages = messages.filter((m) => m.type === "assistant");

    const firstUserMessage = userMessages[0];
    const firstPrompt = this.extractPromptText(firstUserMessage);
    const sessionSlug = firstUserMessage?.slug || "unknown-session";

    const timestamps = messages
      .filter((m) => m.timestamp)
      .map((m) => new Date(m.timestamp));
    const startTime = timestamps[0] || new Date();
    const endTime = timestamps[timestamps.length - 1] || new Date();

    // 按 message.model 聚合 usage
    const modelMap = new Map<string, {
      inputTokens: number;
      outputTokens: number;
      cacheCreationTokens: number;
      cacheReadTokens: number;
      messageCount: number;
    }>();

    for (const msg of assistantMessages) {
      const model = msg.message?.model;
      const usage = msg.message?.usage;
      if (!model || model === "<synthetic>" || !usage) continue;

      const existing = modelMap.get(model) || {
        inputTokens: 0, outputTokens: 0,
        cacheCreationTokens: 0, cacheReadTokens: 0, messageCount: 0,
      };
      existing.inputTokens += usage.input_tokens || 0;
      existing.outputTokens += usage.output_tokens || 0;
      existing.cacheCreationTokens += usage.cache_creation_input_tokens || 0;
      existing.cacheReadTokens += usage.cache_read_input_tokens || 0;
      existing.messageCount += 1;
      modelMap.set(model, existing);
    }

    // 构建 modelSummaries
    const modelSummaries: ModelUsageSummary[] = [...modelMap.entries()]
      .map(([modelName, stats]) => {
        const totalTokens = stats.inputTokens + stats.outputTokens + stats.cacheCreationTokens + stats.cacheReadTokens;
        const estimatedCost = calculateModelCost(
          modelName, stats.inputTokens, stats.outputTokens,
          stats.cacheCreationTokens, stats.cacheReadTokens,
        );
        return {
          modelName,
          displayName: getDisplayName(modelName),
          messageCount: stats.messageCount,
          inputTokens: stats.inputTokens,
          outputTokens: stats.outputTokens,
          cacheCreationTokens: stats.cacheCreationTokens,
          cacheReadTokens: stats.cacheReadTokens,
          totalTokens,
          estimatedCost,
        };
      })
      .sort((a, b) => b.totalTokens - a.totalTokens);

    // 汇总
    const totalCost = modelSummaries.reduce((s, m) => s + m.estimatedCost, 0);
    const totalTokens = modelSummaries.reduce((s, m) => s + m.totalTokens, 0);
    const totalInputTokens = modelSummaries.reduce((s, m) => s + m.inputTokens, 0);
    const totalOutputTokens = modelSummaries.reduce((s, m) => s + m.outputTokens, 0);
    const totalCacheCreationTokens = modelSummaries.reduce((s, m) => s + m.cacheCreationTokens, 0);
    const totalCacheReadTokens = modelSummaries.reduce((s, m) => s + m.cacheReadTokens, 0);
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

  private extractPromptText(message: TranscriptMessage | undefined): string {
    if (!message?.message?.content) return "No prompt available";
    const content = message.message.content;
    if (typeof content === "string") return this.truncateText(content, 100);
    if (Array.isArray(content)) {
      const textParts = content
        .filter((part) => part.type === "text" && part.text)
        .map((part) => part.text)
        .join(" ");
      return this.truncateText(textParts, 100);
    }
    return "No prompt available";
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  }
}
```

**Step 2: 验证编译**

Run: `npm run build`
Expected: 编译通过（由于 `ParsedTranscript` 接口变了，下游文件可能报错，这是预期的，后续 Task 修复）

**Step 3: Commit**

```bash
git add src/core/transcript-parser.ts
git commit -m "feat: 重写 TranscriptParser，从 message.usage 直接读取 token 和模型数据"
```

---

### Task 4: 新建 TranscriptDataFetcher 替代 ccusage

**Files:**
- Create: `src/core/transcript-data-fetcher.ts`

**Step 1: 创建新的数据获取器**

这个模块不调用 ccusage，直接从 transcript 获取所有需要的数据。

```typescript
import { TranscriptParser } from "./transcript-parser.js";
import type { ParsedTranscript } from "../types/transcript.js";
import type { CcusageSession, ModelBreakdown } from "../types/ccusage.js";

/**
 * Transcript 直读数据获取器
 * 不依赖 ccusage，直接从 transcript JSONL 解析 session 用量数据
 */
export class TranscriptDataFetcher {
  private parser = new TranscriptParser();

  /**
   * 从 transcript 文件获取 session 数据
   * 返回与 CcusageSession 兼容的结构，方便下游使用
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
```

**Step 2: 验证编译**

Run: `npm run build`
Expected: 编译通过

**Step 3: Commit**

```bash
git add src/core/transcript-data-fetcher.ts
git commit -m "feat: 新建 TranscriptDataFetcher，不依赖 ccusage 直接读取 session 数据"
```

---

### Task 5: 更新 GenerateCommand 使用直读模式

**Files:**
- Modify: `src/commands/generate.ts`

**Step 1: 重构 execute 方法**

核心改动：
1. Hook 模式下直接用 `TranscriptDataFetcher`，不走 ccusage
2. 手动模式优先尝试直读，ccusage 作为降级方案
3. 输出路径改为桌面/下载文件夹

关键修改点：

```typescript
// 新增 import
import { TranscriptDataFetcher } from "../core/transcript-data-fetcher.js";
import { homedir } from "os";
import { existsSync } from "fs";

// 在 GenerateCommand 类中添加
private transcriptDataFetcher = new TranscriptDataFetcher();

// 重写 execute 的数据获取部分
// Hook 模式：直接用 transcriptPath
if (stdinData) {
  transcriptPath = stdinData.transcript_path;
  actualSessionId = stdinData.session_id;
}

// --- 新的数据获取逻辑 ---
let sessionData;
let transcriptData;

if (transcriptPath) {
  // 有 transcriptPath 时，优先直读（支持所有模型）
  const result = await this.transcriptDataFetcher.fetchFromTranscript(transcriptPath);
  sessionData = result.sessionData;
  transcriptData = result.transcriptData;
} else {
  // 手动模式无 transcriptPath，降级到 ccusage
  try {
    if (actualSessionId) {
      sessionData = await this.dataFetcher.fetchSessionById(actualSessionId);
    } else {
      sessionData = await this.dataFetcher.fetchSessionData(options.session);
    }
  } catch (err) {
    throw err;
  }
  // 从 ccusage 数据推断 transcriptPath
  if (!transcriptPath && sessionData.projectPath) {
    const parts = sessionData.projectPath.split("/");
    actualSessionId = parts[parts.length - 1];
    transcriptPath = `${homedir()}/.claude/projects/${sessionData.projectPath}.jsonl`;
  }
  if (transcriptPath) {
    transcriptData = await this.transcriptParser.parseTranscript(transcriptPath);
  }
}
```

**Step 2: 更新 outputToHtml 保存到桌面/下载**

```typescript
private async outputToHtml(
  receiptData: ReceiptData,
  receipt: string,
  sessionId: string,
  sessionSlug: string | undefined,
  isFromHook: boolean,
): Promise<void> {
  const fileName = sessionSlug || sessionId;
  const html = this.htmlRenderer.generateHtml(receiptData, receipt);

  // 保存到项目目录（保留原有行为）
  const home = homedir();
  const projectDir = `${home}/.token-receipts/projects`;
  const projectPath = `${projectDir}/${fileName}.html`;
  await this.saveHtmlFile(html, projectPath);

  // 自动保存到桌面或下载文件夹
  const autoSavePath = this.getAutoSavePath(fileName);
  if (autoSavePath) {
    await this.saveHtmlFile(html, autoSavePath);
  }

  if (isFromHook) {
    // 优先打开自动保存的文件
    await this.openInBrowser(autoSavePath || projectPath);
  }
}

/**
 * 获取自动保存路径：桌面 > 下载
 */
private getAutoSavePath(fileName: string): string | null {
  const home = homedir();
  const desktop = `${home}/Desktop`;
  const downloads = `${home}/Downloads`;

  if (existsSync(desktop)) return `${desktop}/${fileName}.html`;
  if (existsSync(downloads)) return `${downloads}/${fileName}.html`;
  return null;
}
```

**Step 3: 更新 ReceiptData 类型的构建**

因为 `transcriptData` 现在包含了 model 数据，需要确保 `receiptData` 构建时正确传入。

**Step 4: 验证编译**

Run: `npm run build`
Expected: 编译通过

**Step 5: Commit**

```bash
git add src/commands/generate.ts
git commit -m "feat: GenerateCommand 使用 transcript 直读 + 自动保存到桌面/下载"
```

---

### Task 6: 更新 HtmlRenderer 和 ReceiptGenerator 模型名称

**Files:**
- Modify: `src/core/html-renderer.ts`
- Modify: `src/core/receipt-generator.ts`

**Step 1: 统一使用 model-pricing 的 getDisplayName**

两个文件中的 `getModelName` 方法改为调用 `model-pricing.ts` 的 `getDisplayName`，避免重复维护映射表。

```typescript
import { getDisplayName } from "../utils/model-pricing.js";

// 替换所有 getModelName 方法为:
private getModelName(model: string): string {
  return getDisplayName(model);
}
```

**Step 2: 验证编译**

Run: `npm run build`
Expected: 编译通过

**Step 3: Commit**

```bash
git add src/core/html-renderer.ts src/core/receipt-generator.ts
git commit -m "refactor: 统一模型名称映射，使用 model-pricing 模块"
```

---

### Task 7: 本地测试验证

**Step 1: 编译项目**

```bash
npm run build
```

**Step 2: 用当前 session 测试**

```bash
# Hook 模式测试（需要 transcript path）
node bin/token-receipts.js generate --session f66eec88 --output html

# 手动模式测试
node bin/token-receipts.js generate --output console
node bin/token-receipts.js generate --output html
```

**Step 3: 验证输出**

- 检查桌面是否生成 HTML 文件
- 打开 HTML 验证模型名称和 token 数据是否正确
- 检查费用计算是否合理

**Step 4: 修复编译和运行时问题**

**Step 5: Commit**

```bash
git add -A
git commit -m "fix: 修复编译和运行时问题"
```

---

### Task 8: 更新文档

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/ARCHITECTURE.md`

更新所有文档反映新架构：
- 移除 ccusage 必须依赖的说明
- 添加多模型支持说明
- 添加自动保存到桌面/下载的说明
- 更新架构图
