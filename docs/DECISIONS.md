# 决策记录

> Last updated: 2026-05-09

## 决策记录

### [DEC-002] - 2026-05-08 - 从 Transcript 直接读取 Token Usage

**背景**

分析多个 session transcript JSONL 文件，确认完整的数据结构：

- Token 在 `message.usage` 内部（不在顶层 `usage`）
- 模型在 `message.model`（含非 Anthropic 模型：deepseek-v4-pro、glm-5.1 等）
- `costUSD` 始终为 null，需自行计算
- `<synthetic>` 模型条目需要过滤

**决策**

采用 Transcript 直读方案，完全替代 ccusage：

1. 解析 transcript JSONL → 提取所有 `message.usage` 数据
2. 按 `message.model` 分组聚合 token 消耗
3. 根据模型定价表计算费用

**理由**

- Transcript 是 Claude Code 的原生数据源，所有模型（包括第三方）都有 usage 数据
- 消除了对 ccusage 的依赖，支持任何 Claude Code 配置的模型

**影响**

- `DataFetcher` 重写为从 TranscriptParser 获取数据
- 新增模型定价配置（`model-pricing.ts`）
- ccusage 降级为手动模式可选后备

---

### [DEC-001] - 2026-05-08 - 多模型支持技术方案

**决策**

采用 Transcript 直读方案（见 DEC-002），不再依赖 ccusage。

---

## 工作日志

### 2026-05-09 (Claude)

- **目标**：扩展模型支持 + 文档整合
- **操作**：
  - 扩展 `model-pricing.ts` 至 64 个定价条目，新增 GLM-5/4.7/4.5、MiniMax M2/M2.5/M2.1、Qwen3-Max/Flash、Kimi K2.5/K2 等
  - 新增 Kimi 供应商 + ASCII logo
  - 按供应商动态显示 logo 和币种符号（USD/CNY）
  - 精简 CLAUDE.md（177→45 行）和 README.md（移除过时的 ccusage 依赖描述）
  - 整合 docs/ + status/ 文档结构，移除 status/ 目录
  - 更新 ROADMAP.md 反映当前进度 + NPM 发布任务
- **结果**：代码和文档均已更新，构建通过
- **下一步**：NPM 发布（v2.0.0）

### 2026-05-09 (Claude)

- **目标**：更新模型精确定价 + 添加供应商 logo
- **操作**：
  - 从各供应商开放平台收集官方定价数据
  - 新增 `getProvider()` 函数和 `Provider` 类型
  - 更新 `ascii-art.ts` 和 `html-renderer.ts` 动态 logo
  - 修复币种显示
- **结果**：收据正确显示供应商 logo + 正确币种

### 2026-05-08 22:30 (Claude)

- **目标**：研究 session transcript 中是否包含 token usage 数据
- **结果**：确认可以从 transcript 直接读取 token usage
- **下一步**：扩展 TranscriptParser + 设计定价配置

### 2026-05-08 14:30 (Claude)

- **目标**：完成项目中文本地化，建立文档结构
- **结果**：文档结构已建立，确认多模型支持可行
