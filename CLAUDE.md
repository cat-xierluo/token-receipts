# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

**token-receipts** 是一个 NPM 包，为 AI 编程会话生成精美的热敏打印机风格收据。它支持多模型（Claude、DeepSeek、GLM、MiniMax、OpenAI、Qwen 等），直接从 session transcript 读取 token 用量数据，无需外部依赖。集成 Claude Code 的 SessionEnd hook，在编码会话结束时自动创建收据并保存到桌面。

## 开发命令

```bash
# 将 TypeScript 编译为 JavaScript
npm run build

# 开发模式（监听）
npm run dev

# 本地测试 CLI（编译后）
node bin/token-receipts.js generate
node bin/token-receipts.js generate --output html
node bin/token-receipts.js config --show
node bin/token-receipts.js setup

# 本地链接以便测试（如同全局安装）
npm link
token-receipts generate

# 准备发布
npm run prepublishOnly  # 自动运行 build
```

## 架构

### 数据流

包有两种运行模式：

1. **Hook 模式**（自动）：SessionEnd hook → stdin JSON → 生成 HTML → 打开浏览器
2. **手动模式**：CLI 命令 → 获取最近会话 → 输出到终端/HTML

```
SessionEnd Hook
  ↓ (stdin 包含 session_id, transcript_path)
GenerateCommand
  ↓
TranscriptDataFetcher (主路径：直接读取 JSONL) ← → DataFetcher (降级：调用 ccusage CLI)
  ↓
ReceiptGenerator (创建文本) + HtmlRenderer (创建样式 HTML)
  ↓
自动保存到 ~/Desktop/[slug].html + ~/.token-receipts/projects/[slug].html + 打开浏览器
```

### 核心组件

**命令** (`src/commands/`)

- `generate.ts` - 主命令；通过 stdin 检测是否来自 hook
- `setup.ts` - 修改 `~/.claude/settings.json` 安装 SessionEnd hook
- `config.ts` - 管理 `~/.token-receipts.config.json` 用户配置

**核心逻辑** (`src/core/`)

- `transcript-data-fetcher.ts` - **主路径**：直接从 transcript JSONL 提取 token 用量，按模型聚合，计算费用
- `data-fetcher.ts` - **降级路径**：执行 `npx ccusage session --json --breakdown` 获取用量数据（仅手动模式无 transcriptPath 时使用）
- `transcript-parser.ts` - 解析 `~/.claude/projects/[path].jsonl` 获取会话元数据（slug、时间戳、消息数量）及 token usage
- `receipt-generator.ts` - 创建带 Claude logo、位置、费用的 ASCII 文本收据
- `html-renderer.ts` - 生成带嵌入式 CSS 的独立 HTML（热敏打印机美学）
- `config-manager.ts` - 处理 `~/.token-receipts.config.json` 的读写

**工具** (`src/utils/`)

- `model-pricing.ts` - 模型定价表（每百万 token 价格）和费用计算，支持 Anthropic、OpenAI、DeepSeek、GLM、MiniMax、Qwen
- `location.ts` - 位置检测链：CLI 参数 → 配置 → IP 地理定位（geoip-lite）→ 默认值
- `formatting.ts` - 货币、数字、日期/时间、时长格式化
- `ascii-art.ts` - Claude logo 和文本收据分隔符

### 关键实现细节

**SessionEnd Hook 集成**

- Hook 通过 stdin 接收 JSON：`{session_id, transcript_path, cwd, ...}`
- `GenerateCommand.readStdinIfAvailable()` 检查 `stdin.isTTY`（false = 来自 hook）
- 来自 hook 时：直接使用 `transcript_path`，自动打开浏览器，无控制台输出
- Hook 无法输出到控制台（会话结束后运行），因此采用 HTML + 浏览器方式

**Transcript 直读数据格式**

- Transcript 文件位于 `~/.claude/projects/[project-path]/[session-id].jsonl`
- Token 用量在 `message.usage` 内部（不是顶层 `usage`）：
  - `message.usage.input_tokens` / `output_tokens`
  - `message.usage.cache_read_input_tokens` / `cache_creation_input_tokens`
- 模型信息在 `message.model`（包括非 Anthropic 模型：deepseek-v4-pro、glm-5.1 等）
- 费用根据 `src/utils/model-pricing.ts` 中的定价表计算（`costUSD` 始终为 null）
- `<synthetic>` 模型条目需要过滤
- TranscriptDataFetcher 聚合所有 assistant 消息的 usage，按模型分组
- 返回与 CcusageSession 兼容的结构，确保下游组件无感切换

**ccusage 数据格式**（降级模式）

- 实际字段名为驼峰命名：`sessionId`、`inputTokens`、`modelBreakdowns` 等
- 会话 ID 较复杂；显示名称与实际 ID 不同
- `projectPath` 格式：`"project-name/actual-session-id"` - 通过分割获取会话 ID
- 只有具有有效 `projectPath`（不是 "Unknown Project"）的会话才可用

**文件命名**

- HTML 文件使用会话 slug（例如 `quirky-crafting-floyd.html`），而不是会话 ID
- Session slug 来自 transcript JSONL 中的第一条用户消息
- 如果 slug 不可用，则回退到会话 ID

**输出模式**

- `--output html`：保存到 `~/.token-receipts/projects/[slug].html`，并自动保存到桌面（优先）或下载文件夹（降级）
- `--output console`：在终端显示 ASCII 艺术（手动模式的默认选项）
- Hook 始终使用 `--output html`（设置时指定）
- 自动保存路径检测：`~/Desktop/` 优先，`~/Downloads/` 降级

**配置理念**

- 最小化配置：仅 `version`、可选的 `location`、可选的 `timezone`
- 无 `outputDirectory`、`enablePNG`、`enableConsole`、`format` - 初始设计简化后移除
- 输出格式在命令级指定，而非配置级

**视觉设计**

- 黑白热敏打印机美学（除深色页面背景外无彩色背景）
- Claude ASCII logo（非带表情符号的"商店"名）
- "Thank you for building!"（非"购物"相关）
- 深色页面背景（#3a3a3a）使白色收据突出

## 类型系统

所有类型位于 `src/types/`：

- `ccusage.ts` - 匹配 ccusage CLI 实际 JSON 输出（驼峰命名字段）
- `transcript.ts` - JSONL 消息结构和解析后的摘要
- `config.ts` - 最小化用户配置
- `session-hook.ts` - SessionEnd stdin JSON 格式

## 包结构

- **仅 ESM**（`"type": "module"`）- 需要 Node 22+
- **bin 入口**：`bin/token-receipts.js` 从 `dist/cli.js` 导入
- **导出**：主导出来自 `src/index.ts` 用于程序化使用
- **分发文件**：`dist/`、`bin/`、`templates/`（模板目前未使用）

## 已知限制

- 无法从 SessionEnd hook 输出到控制台（终端已关闭）
- Hook 模式依赖 transcriptPath（由 Claude Code SessionEnd hook 提供）
- 手动模式无 transcriptPath 时降级到 ccusage（需安装 ccusage）
- 未在定价表中的模型费用显示为 $0.00
- 浏览器自动打开使用平台特定命令（`open`、`start`、`xdg-open`）

## Hook 安装

Setup 命令修改 `~/.claude/settings.json`：

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "npx token-receipts@latest generate --output html"
          }
        ]
      }
    ]
  }
}
```

修改前始终备份 settings.json。使用 `@latest` 确保用户无需重新安装即可获取更新。
