# 决策记录

> Last updated: 2026-05-09

## 决策记录

### [DEC-005] - 2026-05-09 - ASCII Logo 还原优先，展示层压缩

**背景**

多供应商 logo 如果强行压缩到 5-8 行，会明显丢失 OpenAI 环形结、MiniMax 波形、Qwen 镂空折带等关键识别特征。用户更希望复刻原始图形，而不是为了行数紧凑牺牲还原度。

**选项**

1. 继续压缩字符稿 - 页面占位稳定，但品牌图形失真
2. 增加字符稿颗粒度并让页面自然撑开 - 还原度提升，但收据头部占位过大
3. 增加字符稿颗粒度，同时在 HTML 展示层按 provider 缩小字号和行高 - 保留原始形态，页面占位接近 Claude 默认 logo

**决策**

采用选项 3。ASCII 源数据保留较高行数和四象限块字符细节；HTML 收据和预览页使用固定 logo 展示盒，并为 OpenAI/DeepSeek/MiniMax/Qwen/Kimi 设置更紧的字号与行高。

**理由**

ASCII 源数据负责还原，页面 CSS 负责排版压缩。这样可以同时满足“像原 logo”和“不占太多页面空间”两个目标，也避免以后为了页面高度反复删减字符细节。

**影响**

- `ascii-art.ts` 中部分 provider logo 行数增加
- `html-renderer.ts` 通过 provider class 控制 logo 视觉尺寸
- `docs/ascii-logo-preview.html` 同步展示压缩后的实际收据效果和原始字符稿

---

### [DEC-004] - 2026-05-09 - 移除公开分享服务

**背景**

HTML 收据页中的 `Share Publicly` 按钮会把收据数据上传到 `https://receipts.chrishutchinson.dev`，这是原项目的公开服务，不属于当前 fork 的可控基础设施。继续保留该入口会让用户误以为分享功能由本项目维护，也会把会话摘要数据发送到第三方服务。

**选项**

1. 保留按钮并替换为自有服务 - 需要部署和维护新的公开 API/R2 存储
2. 仅隐藏按钮 - 代码和 worker 配置仍然容易被误用
3. 删除公开分享入口和 worker 分享页代码 - 保留本地 HTML/PNG 能力，避免外部依赖

**决策**

采用选项 3。生成页面只保留本地 HTML 展示和 Save PNG，不再包含远端分享 API 常量、公开上传脚本或 Cloudflare Worker 分享页实现。

**理由**

当前项目目标是本地生成可收藏的收据，不需要依赖原项目的公开端点。删除而非隐藏可以避免后续误触、误部署和隐私边界不清。

**影响**

- `HtmlRenderer` 不再渲染 `Share Publicly` 按钮
- 删除 `worker/` 下的公开分享 API、页面路由和部署配置
- 图片导出继续使用嵌入在本地 HTML 中的 receipt data

---

### [DEC-003] - 2026-05-09 - 供应商 ASCII Logo 以图形标识为准

**背景**

项目已支持多个 LLM API 来源，但部分 ASCII logo 使用了文字占位（如 `D/S`、`M/M`、`通义`、`KIM`），与收据头图应呈现供应商图形标识的目标不一致。同时 HTML 和终端各维护一份 logo，后续新增供应商容易出现漂移。

**选项**

1. 保留文字占位 - 实现简单，但品牌识别弱，且不符合图形 logo 目标
2. 引入真实图片/SVG - 还原度高，但破坏热敏打印机/终端的单色 ASCII 风格
3. 基于官方图形标识做小尺寸 ASCII 抽象 - 保持单色收据风格，同时提升品牌识别度

**决策**

采用选项 3。保留 Claude 现有官方风格图标；OpenAI、DeepSeek、Z.ai/GLM、MiniMax、Qwen、Kimi 按官方公开 logo/icon 的图形部分抽象为紧凑 ASCII，并把 logo 注册表集中在 `src/utils/ascii-art.ts`，HTML 渲染器直接复用。

**理由**

收据头图空间只有 35 字宽，完整 wordmark 不适合；图形标识更符合用户对 logo/icon 的预期。集中注册表可以保证终端、HTML、后续图片导出使用同一套视觉定义。

**影响**

- `ascii-art.ts` 成为供应商 ASCII logo 的唯一来源
- `html-renderer.ts` 不再维护重复 logo 常量
- 后续新增供应商时只需新增 provider 映射和一份图形 ASCII

---

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

### 2026-05-09 23:21 (Codex)

- **目标**：继续微调 OpenAI、Kimi、Z.ai/GLM 的 ASCII 还原度和规整度
- **操作**：
  - OpenAI 改为更清晰的交叠环形字符稿，强化内外空洞和层叠关系
  - Kimi 参考官方 K-only 图形重画，保留右上角圆点
  - Z.ai/GLM 改为由矩形条块组成的阶梯式 Z，并增加行间留白
  - 同步更新 HTML 收据和预览页中的 provider 缩放规则
  - 重新生成 `receipt-ascii-preview.png` 进行视觉检查
- **结果**：三个 logo 的形态更接近原图，展示区域仍保持与 Claude logo 接近的尺寸
- **下一步**：继续通过预览页做小幅视觉校准，避免再扩大页面占位

### 2026-05-09 18:53 (Codex)

- **目标**：提升 ASCII logo 还原度，同时限制页面展示尺寸
- **操作**：
  - 将 OpenAI/DeepSeek/MiniMax/Qwen/Kimi 改为更高颗粒度的块字符稿
  - 保留 Claude Code 原始 5 行热敏块字符形态
  - 在 HTML 收据和预览页中加入固定 logo 展示盒与 provider 级缩放
  - 生成 `receipt-ascii-preview.png` 截图检查页面布局
- **结果**：详细字符稿不会撑大收据头部，展示区域接近 Claude 默认 logo 高度
- **下一步**：如果继续微调，需要优先改 `src/utils/ascii-art.ts` 的原始字符稿，再检查预览页缩放效果

### 2026-05-09 18:11 (Codex)

- **目标**：提供 ASCII logo 集中预览页
- **操作**：
  - 新增 `docs/ascii-logo-preview.html`
  - 在页面中展示所有 provider 的原始 ASCII mark
  - 同时展示放入 35 字宽收据头部后的实际观感
  - 在 README/CHANGELOG/ROADMAP 中记录预览页入口
- **结果**：无需启动服务，直接打开 HTML 文件即可检查 ASCII logo 问题
- **下一步**：如果调整 `src/utils/ascii-art.ts`，同步更新该预览页中的 `logos` 数据

### 2026-05-09 17:52 (Codex)

- **目标**：移除公开分享页面和原项目分享端点
- **操作**：
  - 删除 HTML 收据中的 `Share Publicly` 按钮、分享结果区、远端 API 常量和上传脚本
  - 保留本地 `Save PNG` 导出，并将嵌入数据改名为本地导出数据
  - 删除 `worker/` 公开分享服务代码和 `receipts.chrishutchinson.dev` 部署配置
  - 清理运行时 CLI/热敏打印文案中的 share/original repo 残留
- **结果**：收据页面不再提供公开分享能力，也不再调用原项目服务
- **下一步**：继续以本地 HTML/PNG/打印输出为主，若未来需要分享功能，应先设计自有后端和隐私说明

### 2026-05-09 17:31 (Codex)

- **目标**：规范化多供应商 ASCII logo
- **操作**：
  - 查阅 OpenAI、Anthropic、DeepSeek、Z.ai、MiniMax、Qwen、Kimi 的公开 logo/icon 形态
  - 保留 Claude 现有官方风格图标
  - 将其他供应商从文字占位改为图形标识抽象
  - 将 HTML logo 常量迁移为复用 `ascii-art.ts`
  - 运行构建验证
- **结果**：终端和 HTML 收据共用同一套供应商图形 ASCII logo，构建通过
- **下一步**：如需进一步提升还原度，可为每个 provider 增加快照样例或视觉回归截图

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
