# 系统架构

> Last updated: 2026-05-08

## 项目愿景

为 AI 编程会话生成精美的收据，将冰冷的使用数据转化为可收藏的纪念品。

## 当前进展概览

- ✅ 完成端到端收据生成流程
- ✅ 支持 HTML 和终端 ASCII 艺术输出
- ✅ 支持热敏打印机打印
- ✅ 完成 SessionEnd hook 自动化集成

## 阶段状态概览

| 阶段 | 目标摘要 | 当前状态 | 备注 |
| :--- | :--- | :--- | :--- |
| 基础功能 | 收据生成、HTML/终端输出 | ✅ 已完成 | 支持 ccusage 数据 |
| 热敏打印 | Epson TM-T88V 支持 | ✅ 已完成 | USB/TCP 两种模式 |
| 多模型支持 | 支持非 Anthropic 模型 | 🔄 计划中 | 从 session 直接读取 |
| 导出功能 | PNG/JPEG 图片导出 | ⏳ 未开始 | |

## 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI 入口                            │
│                   (bin/token-receipts.js)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                     GenerateCommand                         │
│              (命令解析 + 模式检测)                           │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ Hook 模式检测   │  │ 手动模式检测    │                   │
│  │ (stdin.isTTY)   │  │ (无参数)        │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                      数据层                                  │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  DataFetcher    │  │ TranscriptParser│                  │
│  │  (ccusage CLI)  │  │  (JSONL 解析)   │                   │
│  └─────────────────┘  └─────────────────┘                   │
│           │                    │                            │
│           └──────────┬─────────┘                            │
│                      ▼                                      │
│              CcusageSession                                │
│              + TranscriptData                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                      生成层                                  │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ ReceiptGenerator│  │  HtmlRenderer   │                  │
│  │  (ASCII 文本)   │  │  (HTML 样式)    │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                      输出层                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ 浏览器   │  │  终端    │  │ 打印机   │                   │
│  │ 自动打开 │  │  ASCII   │  │ ESC/POS  │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件

#### 命令层 (`src/commands/`)

| 文件 | 职责 | 关键逻辑 |
|------|------|----------|
| `generate.ts` | 主生成命令 | 自动检测 hook/手动模式，`readStdinIfAvailable()` |
| `setup.ts` | Hook 安装 | 修改 `~/.claude/settings.json`，带备份 |
| `config.ts` | 配置管理 | CRUD 操作 `~/.token-receipts.config.json` |

#### 核心逻辑层 (`src/core/`)

| 文件 | 职责 | 外部依赖 |
|------|------|----------|
| `data-fetcher.ts` | 获取会话用量数据 | `ccusage session --id --json` |
| `transcript-parser.ts` | 解析会话记录 | `~/.claude/projects/*.jsonl` |
| `receipt-generator.ts` | 生成 ASCII 文本收据 | 无 |
| `html-renderer.ts` | 生成 HTML 收据 | 内联 CSS |
| `config-manager.ts` | 配置文件读写 | `~/.token-receipts.config.json` |

#### 工具层 (`src/utils/`)

| 文件 | 职责 | 说明 |
|------|------|------|
| `location.ts` | 位置检测 | 优先级：CLI > 配置 > geoip-lite > "The Cloud" |
| `formatting.ts` | 格式化工具 | 货币、数字、日期、时长 |
| `ascii-art.ts` | ASCII 艺术 | Claude logo 生成 |

### 数据流

#### Hook 模式（自动）

```
1. 用户退出 Claude Code
2. SessionEnd hook 触发
3. hook 执行: npx token-receipts generate --output html
4. stdin 传递: {session_id, transcript_path, cwd, ...}
5. DataFetcher.fetchSessionById(sessionId)
6. TranscriptParser.parseTranscript(transcriptPath)
7. HtmlRenderer.render(session, transcript)
8. 保存到 ~/.token-receipts/projects/[slug].html
9. 浏览器自动打开
10. 静默退出（无控制台输出）
```

#### 手动模式

```
1. 用户执行: token-receipts generate
2. DataFetcher.fetchSessionData()
3. TranscriptParser.parseTranscript()
4a. --output console → ReceiptGenerator → 控制台输出
4b. --output html → HtmlRenderer → 文件保存
5. 正常退出
```

### 类型定义

```
CcusageSession
├── sessionId: string
├── inputTokens: number
├── outputTokens: number
├── cacheCreationTokens?: number
├── cacheReadTokens?: number
├── totalTokens: number
├── totalCost: number
├── modelsUsed?: string[]
└── modelBreakdowns?: ModelBreakdown[]
    └── ModelBreakdown
        ├── modelName: string
        ├── inputTokens: number
        ├── outputTokens: number
        ├── cacheCreationTokens?: number
        ├── cacheReadTokens?: number
        └── cost: number
```

### 配置管理

配置文件位置：`~/.token-receipts.config.json`

```typescript
interface Config {
  version: "1.0.0";
  location?: string;      // 默认位置
  timezone?: string;      // 时区
  printer?: string;       // 打印机接口
}
```

### 关键设计决策

1. **SessionEnd hook 无法输出控制台** → 选择 HTML + 浏览器方案
2. **ccusage 数据可能有延迟** → 使用 `--id` 获取准确总量
3. **最小化配置** → 移除不必要的配置项，命令行参数优先
4. **ESM only** → Node 22+ 要求

## 目录结构

```
token-receipts/
├── bin/
│   └── token-receipts.js      # CLI 入口
├── src/
│   ├── commands/                # 命令层
│   ├── core/                   # 核心逻辑层
│   ├── types/                  # 类型定义
│   ├── utils/                  # 工具函数
│   └── index.ts                # 主导出
├── docs/                       # 文档
│   ├── ARCHITECTURE.md
│   └── ROADMAP.md
├── status/                    # 协作文档
│   ├── TASKS.md
│   ├── DECISIONS.md
│   └── JOURNAL.md
├── templates/                  # 模板（未使用）
├── dist/                       # 编译输出
├── README.md
├── CHANGELOG.md
└── CLAUDE.md
```
