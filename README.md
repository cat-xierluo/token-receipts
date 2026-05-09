# Claude Receipts

> **作者寄语：**
>
> 这是我最喜欢的创意项目之一（正好赶上 Opus 4.6）。
>
> 我淘了一台二手收据打印机，接入 Claude Code 的 `SessionEnd` hook。每次会话结束，一张收据就会打印出来，显示该会话中各模型的费用明细和 token 数量。
>
> 虽然很简单，但收据很漂亮，我非常喜欢。
>
> 希望你也喜欢。

![示例打印收据照片](thermal-receipt.jpeg)

<details>

<summary><strong>更多照片 / 截图</strong></summary>

## 完整热敏收据

![示例打印收据照片](full-thermal-receipt.jpeg)

## HTML 收据

![示例收据截图](screenshot.jpeg)

</details>

## 安装

```bash
npx token-receipts setup
```

这将完成以下操作：

- 在全局 `~/.claude/settings.json` 中配置 `SessionEnd` hook
- 在 `~/.token-receipts.config.json` 创建配置文件

从现在起，每次退出 Claude Code 会话时，收据将自动生成并在浏览器中打开。

### 手动生成

为最近一次会话生成收据：

```bash
npx token-receipts generate
```

## 命令

### `generate`

为 Claude Code 会话生成收据。

```bash
# 为最近一次会话生成收据
npx token-receipts generate

# 生成 HTML（保存到 ~/.token-receipts/projects/）
npx token-receipts generate --output html

# 打印到热敏打印机
npx token-receipts generate --output printer --printer usb

# 多种输出（HTML + 打印机）
npx token-receipts generate --output html,printer

# 通过 UUID 前缀指定会话
npx token-receipts generate --session 9356d5e2

# 覆盖位置信息
npx token-receipts generate --location "Paris, France"
```

**选项：**

- `-s, --session <id>` - 通过会话 ID 或 UUID 前缀生成
- `-o, --output <format>` - 输出格式："html"、"console" 或 "printer"（支持多个，逗号分隔）
- `-l, --location <text>` - 覆盖位置检测
- `-p, --printer <name>` - 打印机接口（例如 "usb"、"tcp://192.168.1.100"）

**输出格式：**

- `html` - 精美的样式收据，保存到 `~/.token-receipts/projects/`
- `console` - 终端中的 ASCII 艺术展示
- `printer` - 发送到热敏打印机（需要 Epson TM-T88V 或兼容机型）

### `setup`

配置自动收据生成。

```bash
# 运行交互式设置
npx token-receipts setup

# 卸载 hook
npx token-receipts setup --uninstall
```

这会修改 `~/.claude/settings.json` 添加 SessionEnd hook 来自动生成收据。

### `config`

管理收据配置。

```bash
# 显示当前配置
npx token-receipts config --show

# 设置配置项
npx token-receipts config --set location="Kuala Lumpur, Malaysia"
npx token-receipts config --set timezone="Asia/Kuala_Lumpur"
npx token-receipts config --set printer=usb

# 重置为默认值
npx token-receipts config --reset
```

**可用设置：**

- `location` - 默认位置（字符串）
- `timezone` - 时区（字符串，例如 "Asia/Macau"）
- `printer` - 默认打印机接口（字符串，例如 "usb" 或 "tcp://192.168.1.100"）

## 配置

配置文件位于 `~/.token-receipts.config.json`。

**默认配置：**

```json
{
  "version": "1.0.0"
}
```

**可选设置：**

- `location` - 自定义位置字符串（否则自动检测）
- `timezone` - 日期格式化时区
- `printer` - 热敏打印默认打印机接口

### 位置检测

位置检测优先级：

1. `--location` 参数（如果提供）
2. 配置文件中的 `location` 设置
3. 通过 IP 地理定位自动检测（离线，使用 geoip-lite）
4. 默认值："The Cloud"

## 工作原理

1. **SessionEnd Hook**：退出 Claude Code 时，调用 `npx token-receipts generate --output html`，通过 stdin 传递会话 ID
2. **数据收集**：调用 `ccusage session --id <session-id>` 获取准确的会话 token/费用数据
3. **Transcript 解析**：读取会话 transcript JSONL 提取元数据（会话名、时间戳、消息数量）

### HTML 输出

4. **收据生成**：如果指定了 `--output html`，生成带 token 按模型分组的样式 HTML 收据
5. **输出**：HTML 保存到 `~/.token-receipts/projects/[session-name].html` 和/或打印到热敏打印机
6. **自动打开**：自动在默认浏览器中打开 HTML 收据（仅 hook 模式）

### 打印机输出

1. **热敏打印**：如果指定了 `--output printer`，将收据发送到热敏收据打印机

## 系统要求

- Node.js >= 22.0.0
- Claude Code（用于自动生成）

## 热敏打印

token-receipts 支持通过以下方式打印到 Epson TM-T88V 热敏打印机（及兼容机型）：

- **USB**：通过 `--printer usb` 自动检测（或 `config --set printer=usb`）
- **网络**：通过 TCP 直接连接 `--printer tcp://192.168.1.100`

> [!WARNING]
> 打印效果可能因机型而异。我只在 macOS 上用 Epson TM-T88V 测试过，其他型号可能有不同的功能或需要调整代码。欢迎提交 PR 来改进打印机兼容性。

收据包含：

- Claude ASCII logo
- 会话详情和位置
- 按模型的 token 分组（input、output、cache read/write）
- 总费用
- 指向 GitHub 仓库的二维码

## 故障排除

### "Cannot determine transcript path"

这意味着你尝试手动生成收据，但最近一次会话没有有效的项目路径。解决方案：

- 从 SessionEnd hook 中运行（使用 `setup` 命令）
- 在 Claude Code 会话中运行，让它自动生成

### "No session data found"

ccusage 找不到任何会话。确保你最近使用过 Claude Code，且 ccusage 正常工作：

```bash
npx ccusage session --json
```

### Hook 没有触发

检查 hook 是否已安装：

```bash
cat ~/.claude/settings.json
```

你应该看到指向 `token-receipts` 的 `SessionEnd` hook。

### 会话显示错误费用或缺失

非常短的会话（例如刚说"你好世界"就立即退出）可能还没有出现在 ccusage 中。Hook 会静默退出而不是打印错误的收据。对于存在的会话，包现在使用 `ccusage session --id` 获取准确的总费用，而不是子会话片段。

### 找不到打印机

如果使用 `--printer usb`，确保：

- 打印机通过 USB 连接
- 打印机是 Epson TM-T88V 或兼容的 ESC/POS 机型
- 在 Linux 上，可能需要 USB 设备访问权限（`/dev/usb/lp*`）

对于网络打印机，使用 `--printer tcp://<ip-address>`，端口 9100（默认 ESC/POS 端口）。

## 开发指南

## 路线图

- [x] HTML 收据，自动在浏览器中打开
- [x] 终端 ASCII 艺术模式
- [x] 真实热敏收据打印（Epson TM-T88V）
- [x] 准确的会话费用跟踪（通过 `ccusage --id`）
- [x] 通过 UUID 或前缀匹配会话
- [ ] 图片导出（PNG/JPEG）
- [ ] Opencode 插件（[opencode issue](https://github.com/anomalyco/opencode/issues/10524)）

## 许可证

MIT
