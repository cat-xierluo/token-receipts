# 更新日志

所有重要的项目变更都将记录在此文件中。

## [未发布] - 日期待定

### 新增

- 多模型支持：DeepSeek（V4 Pro/Flash/Chat/Reasoner）、GLM（5.1/4 Plus/4 Flash）、MiniMax M2.7、OpenAI（GPT-4o/o1/o3/o4/o4-mini/GPT-5.4/GPT-5.5）、Qwen（Max/Plus/Turbo）、Kimi（K2/Latest）
- Transcript 直读：从 `~/.claude/projects/*.jsonl` 直接读取 token usage，不再依赖 ccusage
- 模型定价模块（`src/utils/model-pricing.ts`）：内置每百万 token 价格，支持 USD/CNY 双币种
- 自动保存到桌面/下载文件夹：HTML 收据生成后自动保存到 `~/Desktop/`（优先）或 `~/Downloads/`（降级）
- 统一模型名称映射：自动去除日期后缀（如 `-20260509`），显示友好名称
- 供应商 logo：收据根据主模型自动显示对应供应商的 ASCII logo（Anthropic/OpenAI/DeepSeek/GLM/MiniMax/Qwen/Kimi）
- ASCII logo 预览页：新增 `docs/ascii-logo-preview.html`，集中查看所有供应商 logo 和收据头部效果
- ASCII logo 预览生成脚本：新增 `npm run preview:logos`，从源码生成预览页，避免预览和最终收据显示不一致
- 精确定价：从各供应商开放平台收集官方定价，支持 USD（Anthropic/OpenAI）和 CNY（DeepSeek/GLM/MiniMax/Qwen/Kimi）双币种显示
- 喵喵机 BLE 蓝牙打印：通过 `@stoprocent/noble` + `mxw01-thermal-printer` 连接 MXW01 热敏打印机，收据直接打印到 384px 热敏纸
- Codex CLI 会话支持：解析 OpenAI Codex CLI 的 `rollout-*.jsonl` 文件，自动检测格式并生成带 OpenAI logo 的收据
- Codex 归档会话扫描：`daily` / `monthly` 自动扫描 `~/.codex/archived_sessions/`，已归档的 Codex 会话纳入汇总
- 日报（`daily`）：汇总当天 Claude Code + Codex CLI 所有会话的 token 用量和费用
- 月报（`monthly`）：汇总指定月份所有会话，支持 `--month YYYY-MM` / `this-month` / `last-month`
- 多币种统一换算：日报/月报中 USD 模型费用按实时汇率换算为 CNY，显示统一 total（汇率来源：frankfurter.app，24h 本地缓存）
- 随机名言页脚：每次收据附带一条 AI/编程相关名言

### 变更

- 统一 ASCII logo 展示盒：HTML 收据、PNG 导出、热敏截图和预览页共用 `ascii-art.ts` 的 logo 数据与整体缩放规则，超出 Claude 默认区域时缩放完整图形而不是裁切
- 规范化供应商 ASCII logo：保留 Claude 官方风格图标，其他供应商改为基于官方图形标识的单色小尺寸抽象，并统一本地 HTML 和图片导出的 logo 风格
- 提升 ASCII logo 还原度：OpenAI/MiniMax/Qwen/DeepSeek/Kimi 改为更高颗粒度字符稿，并在 HTML 页面中压缩字号和行高，使展示区域接近 Claude 默认 logo 高度
- 细化 OpenAI/Kimi/Z.ai logo：OpenAI 改为更清晰的交叠环形结构，Kimi 按官方 K-only 形态重画并保留右上角圆点，Z.ai/GLM 改为留白更规整的阶梯式 Z
- 移除公开分享功能：删除指向原项目服务的 Share Publicly 入口、远端上传脚本和 Cloudflare Worker 分享页代码
- 项目从 `claude-receipts` 重命名为 `token-receipts`
- 配置文件路径从 `~/.claude-receipts.config.json` 改为 `~/.token-receipts.config.json`
- 数据获取主路径从 ccusage CLI 改为 Transcript 直读，ccusage 降级为手动模式的可选后备
- Hook 安装命令从 `npx claude-receipts@latest` 改为 `npx token-receipts@latest`
- 喵喵机打印布局优化：修复网址重复显示、session 名溢出、日期截断、名言间距不一致等问题
- 日报/月报模型按费用降序排列

### 计划中

- 图片导出（PNG/JPEG）
- NPM 发布

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
