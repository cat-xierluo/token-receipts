# 项目路线图

> Last updated: 2026-05-09

## 项目愿景

为 AI 编程会话生成精美的收据，将冰冷的使用数据转化为可收藏的纪念品，让每一次编程体验都有仪式感。

## 阶段状态速览

| 阶段 | 目标摘要 | 当前状态 | 备注 |
| :--- | :--- | :--- | :--- |
| 阶段一：基础功能 | HTML/终端收据生成 | ✅ 已完成 | |
| 阶段二：热敏打印 | Epson TM-T88V 支持 | ✅ 已完成 | |
| 阶段三：多模型支持 | 多供应商 + Transcript 直读 | ✅ 已完成 | 8 供应商、64 定价条目 |
| 阶段四：发布与打磨 | NPM 发布、文档完善 | 🔄 进行中 | |
| 阶段五：图片导出 | PNG/JPEG 导出 | ⏳ 未开始 | |
| 阶段六：生态集成 | Opencode 插件 | ⏳ 未开始 | |

## 任务详情

### 阶段一：基础功能 ✅

- [x] HTML 收据生成，自动在浏览器打开
- [x] 终端 ASCII 艺术模式
- [x] SessionEnd hook 自动集成
- [x] 交互式配置命令

### 阶段二：热敏打印 ✅

- [x] 热敏收据打印（Epson TM-T88V）
- [x] USB 和 TCP 网络打印机支持

### 阶段三：多模型支持 ✅

- [x] Transcript 直读 token usage（不依赖 ccusage）
- [x] 模型定价模块（`model-pricing.ts`）：64 个定价条目，USD/CNY 双币种
- [x] 供应商 logo：Anthropic/OpenAI/DeepSeek/GLM/MiniMax/Qwen/Kimi 7 家 ASCII logo
- [x] 自动保存到桌面/下载文件夹
- [x] 统一模型名称映射

### 阶段四：发布与打磨 🔄

- [ ] NPM 发布（`token-receipts` v2.0.0）
  - [ ] 确认 npm 账号和包名可用
  - [ ] 更新 package.json 版本号（1.1.0 → 2.0.0，架构大改）
  - [ ] 更新 package.json description 和 keywords
  - [ ] 运行 `npm publish --access public`
  - [ ] 验证 `npx token-receipts@latest setup` 可用
- [ ] 重命名 bin 入口文件 `claude-receipts.js` → `token-receipts.js`
- [ ] 清理 docs/status 目录结构（已完成）
- [ ] 推送到 GitHub 远程

### 阶段五：图片导出 ⏳

- [ ] PNG 导出
- [ ] JPEG 导出

### 阶段六：生态集成 ⏳

- [ ] Opencode 插件支持

## 进度日志

- **2026-05-09**
  - 新增 `docs/ascii-logo-preview.html`：集中预览 7 家供应商和 unknown fallback 的 ASCII logo 及收据头部效果
  - 移除公开分享页面：删除指向原项目服务的 Share Publicly 入口、远端上传脚本和 Cloudflare Worker 分享页代码，保留本地 HTML/PNG/打印输出
  - 规范化供应商 ASCII logo：保留 Claude 官方风格图标，OpenAI/DeepSeek/Z.ai/MiniMax/Qwen/Kimi 改为基于官方图形标识的单色抽象，并让 HTML/终端复用同一 logo 注册表
  - 扩展模型支持至 64 个定价条目（新增 GLM-5/4.7/4.5、MiniMax M2/M2.5、Qwen3、Kimi K2.5/K2 等）
  - 按供应商动态显示 ASCII logo 和币种符号
  - 精简 CLAUDE.md 和 README.md
  - 整合 docs/ + status/ 文档结构

- **2026-05-08**
  - Transcript 直读功能开发完成
  - 模型定价模块开发完成
  - 自动保存到桌面功能开发完成
  - 文档中文本地化完成

- **2025-05-15** — **v1.1.0**：热敏打印、精确费用、会话匹配
- **2025-05-01** — **v1.0.0**：初始版本
