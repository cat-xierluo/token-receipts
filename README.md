# token-receipts

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

为 AI 编程会话生成收据。支持多模型（Claude/DeepSeek/GLM/MiniMax/OpenAI/Qwen/Kimi），自动识别供应商并显示对应 logo 和币种。

```bash
# 为最近一次会话生成收据
npx token-receipts generate

# 生成 HTML（自动保存到桌面）
npx token-receipts generate --output html

# 打印到热敏打印机
npx token-receipts generate --output printer --printer usb

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

### `setup`

配置自动收据生成。

```bash
# 运行交互式设置
npx token-receipts setup

# 卸载 hook
npx token-receipts setup --uninstall
```

### `config`

管理收据配置。

```bash
# 显示当前配置
npx token-receipts config --show

# 设置配置项
npx token-receipts config --set location="Kuala Lumpur, Malaysia"
npx token-receipts config --set timezone="Asia/Kuala_Lumpur"

# 重置为默认值
npx token-receipts config --reset
```

## 工作原理

1. **SessionEnd Hook**：退出 Claude Code 时，调用 `npx token-receipts generate --output html`，通过 stdin 传递会话 ID
2. **Transcript 直读**：直接从 `~/.claude/projects/` 下的 JSONL 文件读取 token 用量和模型信息，按模型聚合计算费用
3. **收据生成**：生成带供应商 logo、token 明细、双币种（USD/CNY）的热敏打印机风格收据
4. **自动保存**：HTML 保存到桌面（优先）和 `~/.token-receipts/projects/`，hook 模式自动打开浏览器

> 如果 transcript 路径不可用（手动模式），会降级到 `ccusage` 获取数据。

## 系统要求

- Node.js >= 22.0.0
- Claude Code（用于自动生成）

## 故障排除

### "Cannot determine transcript path"

手动生成收据时找不到最近会话的 transcript 路径。解决方案：

- 使用 `npx token-receipts setup` 安装 hook，让收据在会话结束时自动生成
- 确保你在 Claude Code 会话目录中运行

### Hook 没有触发

检查 hook 是否已安装：

```bash
cat ~/.claude/settings.json
```

你应该看到指向 `token-receipts` 的 `SessionEnd` hook。

### 找不到打印机

如果使用 `--printer usb`，确保：

- 打印机通过 USB 连接
- 打印机是 Epson TM-T88V 或兼容的 ESC/POS 机型
- 在 Linux 上，可能需要 USB 设备访问权限（`/dev/usb/lp*`）

对于网络打印机，使用 `--printer tcp://<ip-address>`，端口 9100（默认 ESC/POS 端口）。

## 路线图

- [x] HTML 收据，自动在浏览器中打开
- [x] 终端 ASCII 艺术模式
- [x] 真实热敏收据打印（Epson TM-T88V）
- [x] 多模型支持（Claude/DeepSeek/GLM/MiniMax/OpenAI/Qwen/Kimi）
- [x] Transcript 直读 token 用量（不依赖 ccusage）
- [x] 供应商 logo + 双币种（USD/CNY）
- [ ] 图片导出（PNG/JPEG）
- [ ] Opencode 插件

## 许可证

MIT
