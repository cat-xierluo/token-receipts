# 决策记录

> Last updated: 2026-05-08

## 决策记录

### [DEC-002] - 2026-05-08 - 从 Transcript 直接读取 Token Usage

**背景**

通过实际分析多个 session transcript JSONL 文件，确认了完整的数据结构：

**Transcript 文件路径**：`~/.claude/projects/[project-path]/[session-id].jsonl`

**Assistant 消息的完整结构**（含 token 数据）：

```
顶层字段:
  type: "assistant"
  uuid, parentUuid, sessionId, timestamp, cwd, gitBranch, version...
  └── message:
        ├── model: "deepseek-v4-pro" | "glm-5.1" | "claude-sonnet-4-5" ...
        ├── role: "assistant"
        ├── content: [...]
        ├── stop_reason: "tool_use" | "end_turn"
        ├── usage:                          ← 关键数据！在 message 内部
        │     ├── input_tokens: 43471
        │     ├── output_tokens: 366
        │     ├── cache_creation_input_tokens: 0
        │     ├── cache_read_input_tokens: 192
        │     ├── server_tool_use: { web_search_requests, web_fetch_requests }
        │     ├── cache_creation: { ephemeral_1h_input_tokens, ephemeral_5m_input_tokens }
        │     ├── service_tier: "standard"
        │     └── speed: "standard"
        └── (无 costUSD 字段 — 始终为 null)
```

**关键发现**：

1. **`message.usage` 内含完整 token 数据** — 不在顶层 `usage`（那个是 null），而在 `message.usage`
2. **`message.model` 记录实际使用的模型** — 包括非 Anthropic 模型（deepseek-v4-pro、glm-5.1 等）
3. **无费用数据** — `costUSD` 始终为 null，需要根据 token 数量 + 模型定价自行计算
4. **`<synthetic>` 模型需要过滤** — 类似 ccusage 的处理方式

**实测多模型 Session 数据**：

```
模型: deepseek-v4-flash  | 214 条 | input: 793,011  | output: 80,634  | cache_read: 24,267,648
模型: deepseek-v4-pro   |  94 条 | input: 419,001  | output: 36,405  | cache_read: 12,745,856
模型: glm-5.1           |  78 条 | input: 653,885  | output: 30,408  | cache_read:  7,236,736
```

**决策**

采用 **Transcript 直读方案**，完全替代 ccusage：

1. 解析 transcript JSONL → 提取所有 `message.usage` 数据
2. 按 `message.model` 分组聚合 token 消耗
3. 根据模型定价表计算费用（内置 + 可配置自定义价格）
4. 过滤 `<synthetic>` 和 `model == null` 的条目

**理由**

- Transcript 是 Claude Code 的原生数据源，所有模型（包括第三方）都有 usage 数据
- ccusage 本身也是从 transcript 中聚合数据，只是多了 Anthropic API 的费用校验
- 直读方案消除了对 ccusage 的依赖，支持任何 Claude Code 配置的模型
- 数据实时性更好，无 ccusage 的处理延迟

**影响**

- `DataFetcher` 需要重写，改为从 TranscriptParser 获取数据
- `TranscriptParser` 需要扩展，解析 `message.usage` 和 `message.model`
- 需要新增模型定价配置（`src/types/config.ts` 扩展）
- 可以移除 `ccusage` 依赖（或保留为可选）

---

### [DEC-001] - 2026-05-08 - 多模型支持技术方案

**背景**

当前 token-receipts 依赖 ccusage 获取会话数据，但 ccusage 只能跟踪 Anthropic API 用量。用户希望支持第三方模型。

**决策**

采用 Transcript 直读方案（见 DEC-002），不再依赖 ccusage。

---

## 工作日志

### 2026-05-08 22:30 (Claude)

- **目标**：研究 session transcript 中是否包含 token usage 数据
- **操作**：
  - 分析多个 transcript JSONL 文件的数据结构
  - 发现 `message.usage` 包含完整的 token 数据
  - 发现 `message.model` 记录所有模型（包括 deepseek、glm 等）
  - 确认 `costUSD` 始终为 null，需自行计算
  - 实测多模型 session 的数据聚合
- **结果**：
  - **确认可以从 transcript 直接读取 token usage**
  - 数据结构清晰：`message.usage.input_tokens` / `output_tokens` / `cache_read_input_tokens` / `cache_creation_input_tokens`
  - 模型信息在 `message.model` 中
- **下一步**：
  - 扩展 `TranscriptParser` 解析 usage 和 model
  - 设计模型定价配置
  - 重写 `DataFetcher` 为 Transcript 直读模式

### 2026-05-08 14:30 (Claude)

- **目标**：完成项目中文本地化，建立文档结构
- **操作**：翻译文档、创建 docs/ 和 status/ 目录结构
- **结果**：文档结构已建立，确认多模型支持可行
