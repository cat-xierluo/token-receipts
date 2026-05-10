# token-receipts

> Fork 自 [chrishutchinson/token-receipts](https://github.com/chrishutchinson/token-receipts)，在原版基础上做了多模型适配和本地化改造。

原版是个很酷的项目——每次 Claude Code 会话结束，自动生成一张热敏打印机风格的收据，显示 token 用量和费用。

我在日常使用中主要跑 DeepSeek、GLM 这些国产模型，原版只支持 Anthropic 的定价，所以做了一些改动：

- **多模型定价**：内置 64 个模型定价条目，覆盖 Claude/DeepSeek/GLM/MiniMax/OpenAI/Qwen/Kimi 七家供应商
- **双币种**：USD 和 CNY 自动切换，国产模型显示人民币价格
- **供应商 logo**：收据根据模型自动匹配对应供应商的 ASCII logo
- **Codex CLI 支持**：自动解析 `~/.codex/sessions/` 下的 OpenAI Codex 会话，生成带 OpenAI logo 的收据
- **Transcript 直读**：直接从 `~/.claude/projects/` 的 JSONL 文件读取 token 数据，不依赖 ccusage
- **喵喵机打印**：支持通过 BLE 蓝牙连接 MXW01 热敏打印机，直接打印收据到纸上
- **自动保存到桌面**：HTML 收据生成后自动保存到 `~/Desktop/`

![示例打印收据照片](thermal-receipt.jpeg)

## 安装

```bash
npx token-receipts setup
```

每次退出 Claude Code 会话时，收据自动生成并在浏览器中打开。

### 手动生成

```bash
npx token-receipts generate
```

## 命令

### `generate`

```bash
# 为最近一次会话生成收据
npx token-receipts generate

# 生成 HTML（自动保存到桌面）
npx token-receipts generate --output html

# 通过 UUID 前缀指定会话
npx token-receipts generate --session 9356d5e2

# 直接指定 transcript JSONL 文件（支持 Claude 和 Codex）
npx token-receipts generate --session ~/.codex/sessions/2026/05/09/rollout-xxx.jsonl

# 通过 BLE 打印到喵喵机
npx token-receipts generate --output bt

# 覆盖位置信息
npx token-receipts generate --location "Paris, France"
```

**选项：**

- `-s, --session <id>` - 通过会话 ID、UUID 前缀或 JSONL 文件路径生成
- `-o, --output <format>` - 输出格式："html"、"console"、"printer" 或 "bt"
- `-l, --location <text>` - 覆盖位置检测
- `-p, --printer <name>` - 打印机接口（例如 "usb"、"tcp://192.168.1.100"）

### `daily`

```bash
# 汇总今天的所有会话
npx token-receipts daily

# 指定日期
npx token-receipts daily --date 2026-05-09

# 昨天的会话
npx token-receipts daily --date yesterday

# 打印到喵喵机
npx token-receipts daily --output bt
```

自动扫描 Claude Code 和 Codex CLI 的会话，汇总当天所有模型的 token 用量和费用。

### `setup`

```bash
npx token-receipts setup       # 安装 hook
npx token-receipts setup --uninstall  # 卸载
```

### `config`

```bash
npx token-receipts config --show
npx token-receipts config --set location="Shanghai, China"
npx token-receipts config --set timezone="Asia/Shanghai"
```

## 喵喵机 BLE 打印

支持通过蓝牙连接 [MXW01](https://github.com/nicepkg/mxw01-thermal-printer) 热敏打印机（喵喵机），直接将收据打印到 384px 宽的热敏纸上。

### 安装依赖

喵喵机打印依赖两个额外的 npm 包（因为涉及原生蓝牙模块，设为可选依赖，不阻塞安装）：

```bash
npm install mxw01-thermal-printer @stoprocent/noble
```

macOS 用户如果遇到蓝牙权限问题，需要授予 Node.js 蓝牙访问权限：**系统设置 → 隐私与安全性 → 蓝牙**。

### 使用

```bash
# 打印最近一次会话的收据
npx token-receipts generate --output bt

# 打印某次会话
npx token-receipts generate --session <id> --output bt

# 打印今日汇总
npx token-receipts daily --output bt
```

打印前请确保：
1. 喵喵机已开机，蓝牙指示灯闪烁
2. 打印机在电脑蓝牙范围内（约 3 米）
3. 首次连接可能需要几秒扫描

## Codex CLI 支持

除了 Claude Code，也支持解析 [OpenAI Codex CLI](https://github.com/openai/codex) 的会话文件。Codex 的 session 存储在 `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`，格式与 Claude 不同，但 token 用量和费用计算方式一致。

使用方式：
- `--session` 直接指定 Codex JSONL 文件路径，自动检测格式
- `daily` 命令同时扫描 Claude 和 Codex 会话并合并汇总

## 工作原理

1. 退出 Claude Code 时 SessionEnd hook 触发
2. 直接从 transcript JSONL 读取 token 用量和模型信息，按模型聚合计算费用
3. 生成带供应商 logo、token 明细、双币种（USD/CNY）的收据
4. HTML 自动保存到桌面 + `~/.token-receipts/projects/`，浏览器自动打开

## 系统要求

- Node.js >= 22.0.0
- Claude Code（或 OpenAI Codex CLI）

## 路线图

- [x] HTML 收据 + 终端 ASCII + 热敏打印
- [x] 多模型支持（7 家供应商，64 个定价条目）
- [x] Transcript 直读 + 双币种 + 供应商 logo
- [x] Codex CLI 会话支持
- [x] 喵喵机 BLE 蓝牙打印
- [ ] 图片导出（PNG/JPEG）
- [ ] NPM 发布

## 许可证

MIT（原项目作者 Chris Hutchinson）
