# AGENTS.md

## 项目概述

**token-receipts** — NPM 包，为 AI 编程会话生成热敏打印机风格收据。支持多模型（Codex/DeepSeek/GLM/MiniMax/OpenAI/Qwen/Kimi），直接从 transcript JSONL 读取 token 用量，集成 Codex SessionEnd hook 自动生成。

## 开发命令

```bash
npm run build          # 编译 TS
npm run dev            # 监听模式
npm link               # 本地链接测试
npm run prepublishOnly # 发布前构建
```

编译后测试：`node bin/Codex-receipts.js generate --output html`

## 架构

```
SessionEnd Hook (stdin JSON) 或 CLI 手动模式
  ↓
GenerateCommand → TranscriptDataFetcher (主路径: 直读 JSONL) / DataFetcher (降级: ccusage CLI)
  ↓
ReceiptGenerator (ASCII) + HtmlRenderer (HTML) → 保存到 ~/Desktop/ + ~/.token-receipts/projects/
```

- `src/commands/` — CLI 命令（generate/setup/config）
- `src/core/` — 核心逻辑（数据获取、收据生成、HTML 渲染、配置管理）
- `src/utils/` — 工具（model-pricing 定价表、formatting 格式化、ascii-art logo、location 定位）
- `src/types/` — 类型定义

## 关键实现细节

**Transcript 数据格式**（主路径）

- 文件：`~/.Codex/projects/[project-path]/[session-id].jsonl`
- Token 在 `message.usage` 内（非顶层 `usage`）：`input_tokens` / `output_tokens` / `cache_read_input_tokens` / `cache_creation_input_tokens`
- 模型在 `message.model`（含非 Anthropic 模型）
- `costUSD` 始终为 null，费用由 `model-pricing.ts` 定价表计算
- 过滤 `<synthetic>` 和 `model == null` 条目

**ccusage 数据格式**（降级路径）

- 驼峰命名字段：`sessionId`、`inputTokens`、`modelBreakdowns`
- `projectPath` 格式：`"project-name/session-id"`

**Hook 集成**

- stdin JSON：`{session_id, transcript_path, cwd, ...}`
- 检测方式：`stdin.isTTY === false` → 来自 hook
- Hook 模式：自动打开浏览器，无控制台输出（会话已结束）

**设计约束**

- 仅 ESM，需 Node 22+
- HTML 文件用 session slug 命名（来自第一条用户消息）
- 收据风格：黑白热敏打印机美学，按供应商显示对应 ASCII logo 和币种（USD/CNY）
