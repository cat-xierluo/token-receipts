# token-receipts

> Fork 自 [chrishutchinson/token-receipts](https://github.com/chrishutchinson/token-receipts)，在原版基础上做了多模型适配和本地化改造。

原版是个很酷的项目——每次 Claude Code 会话结束，自动生成一张热敏打印机风格的收据，显示 token 用量和费用。

我在日常使用中主要跑 DeepSeek、GLM 这些国产模型，原版只支持 Anthropic 的定价，所以做了一些改动：

- **多模型定价**：内置 64 个模型定价条目，覆盖 Claude/DeepSeek/GLM/MiniMax/OpenAI/Qwen/Kimi 七家供应商
- **双币种**：USD 和 CNY 自动切换，国产模型显示人民币价格
- **供应商 logo**：收据根据模型自动匹配对应供应商的 ASCII logo
- **Logo 预览页**：打开 `docs/ascii-logo-preview.html` 可一次查看所有供应商 ASCII 效果
- **Transcript 直读**：直接从 `~/.claude/projects/` 的 JSONL 文件读取 token 数据，不依赖 ccusage
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

# 覆盖位置信息
npx token-receipts generate --location "Paris, France"
```

**选项：**

- `-s, --session <id>` - 通过会话 ID 或 UUID 前缀生成
- `-o, --output <format>` - 输出格式："html"、"console" 或 "printer"
- `-l, --location <text>` - 覆盖位置检测
- `-p, --printer <name>` - 打印机接口（例如 "usb"、"tcp://192.168.1.100"）

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

## 工作原理

1. 退出 Claude Code 时 SessionEnd hook 触发
2. 直接从 transcript JSONL 读取 token 用量和模型信息，按模型聚合计算费用
3. 生成带供应商 logo、token 明细、双币种（USD/CNY）的收据
4. HTML 自动保存到桌面 + `~/.token-receipts/projects/`，浏览器自动打开

## 系统要求

- Node.js >= 22.0.0
- Claude Code

## 路线图

- [x] HTML 收据 + 终端 ASCII + 热敏打印
- [x] 多模型支持（7 家供应商，64 个定价条目）
- [x] Transcript 直读 + 双币种 + 供应商 logo
- [ ] 图片导出（PNG/JPEG）
- [ ] NPM 发布

## 许可证

MIT（原项目作者 Chris Hutchinson）
