# 更新日志

所有重要的项目变更都将记录在此文件中。

## [未发布] - 日期待定

### 新增

- 多模型支持：DeepSeek（V4 Pro/Flash/Chat/Reasoner）、GLM（5.1/4 Plus/4 Flash）、MiniMax M2.7、OpenAI（GPT-4o/o1/o3/o4）、Qwen（Max/Plus/Turbo）
- Transcript 直读：从 `~/.claude/projects/*.jsonl` 直接读取 token usage，不再依赖 ccusage
- 模型定价模块（`src/utils/model-pricing.ts`）：内置每百万 token 价格，支持 USD/CNY 双币种
- 自动保存到桌面/下载文件夹：HTML 收据生成后自动保存到 `~/Desktop/`（优先）或 `~/Downloads/`（降级）
- 统一模型名称映射：自动去除日期后缀（如 `-20260509`），显示友好名称

### 变更

- 项目从 `claude-receipts` 重命名为 `token-receipts`
- 配置文件路径从 `~/.claude-receipts.config.json` 改为 `~/.token-receipts.config.json`
- 数据获取主路径从 ccusage CLI 改为 Transcript 直读，ccusage 降级为手动模式的可选后备
- Hook 安装命令从 `npx claude-receipts@latest` 改为 `npx token-receipts@latest`

### 计划中

- 图片导出（PNG/JPEG）
- Opencode 插件

## [1.1.0] - 2025-05-15

### 新增

- 热敏打印功能（Epson TM-T88V 及兼容机型）
- 准确的会话费用跟踪（通过 `ccusage --id`）
- 通过 UUID 或前缀匹配会话
- 多种输出格式支持（HTML + 打印机）
- 位置自动检测（geoip-lite）

### 修复

- 修复了短会话数据缺失的问题
- 改进了会话匹配逻辑

## [1.0.0] - 2025-05-01

### 新增

- 初始版本发布
- HTML 收据生成并自动在浏览器中打开
- 终端 ASCII 艺术模式
- SessionEnd hook 自动集成
- 交互式设置命令

