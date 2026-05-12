import { stdin } from "process";
import { homedir } from "os";
import { existsSync } from "fs";
import chalk from "chalk";
import boxen from "boxen";
import ora from "ora";
import { exec } from "child_process";
import { promisify } from "util";
import { DataFetcher } from "../core/data-fetcher.js";
import { TranscriptParser } from "../core/transcript-parser.js";
import { TranscriptDataFetcher } from "../core/transcript-data-fetcher.js";
import { CodexDataFetcher } from "../core/codex-data-fetcher.js";
import { ReceiptGenerator } from "../core/receipt-generator.js";
import { HtmlRenderer } from "../core/html-renderer.js";
import { ThermalPrinterRenderer } from "../core/thermal-printer.js";
import { MiaoMiaoJiRenderer } from "../core/miaomiaoji-renderer.js";
import { TypewriterVideoRenderer } from "../core/typewriter-video-renderer.js";
import { LivePhotoAssembler } from "../core/live-photo-assembler.js";
import { ConfigManager } from "../core/config-manager.js";
import { LocationDetector } from "../utils/location.js";
import type { SessionEndHookData } from "../types/session-hook.js";
import type { ReceiptData } from "../core/receipt-generator.js";

const execAsync = promisify(exec);

export type OutputFormat = "html" | "console" | "printer" | "bt" | "livephoto" | "video" | "gif";

export interface GenerateOptions {
  session?: string;
  output?: string[];
  location?: string;
  printer?: string;
}

export class GenerateCommand {
  private dataFetcher = new DataFetcher();
  private transcriptParser = new TranscriptParser();
  private transcriptDataFetcher = new TranscriptDataFetcher();
  private codexDataFetcher = new CodexDataFetcher();
  private receiptGenerator = new ReceiptGenerator();
  private htmlRenderer = new HtmlRenderer();
  private thermalPrinter = new ThermalPrinterRenderer();
  private miaomiaojiRenderer = new MiaoMiaoJiRenderer();
  private videoRenderer = new TypewriterVideoRenderer();
  private livePhotoAssembler = new LivePhotoAssembler();
  private configManager = new ConfigManager();
  private locationDetector = new LocationDetector();

  async execute(options: GenerateOptions): Promise<void> {
    const spinner = ora("Generating receipt...").start();

    try {
      // Check if stdin has data (called from hook)
      const stdinData = await this.readStdinIfAvailable();
      let transcriptPath: string | undefined;
      let actualSessionId: string | undefined;

      if (stdinData) {
        // Called from SessionEnd hook - use the transcript path directly!
        transcriptPath = stdinData.transcript_path;
        actualSessionId = stdinData.session_id;
      }

      // If --session looks like a direct file path, use it as transcriptPath
      if (!transcriptPath && options.session) {
        const expanded = options.session.replace(/^~/, process.env.HOME || "");
        if (existsSync(expanded) && expanded.endsWith(".jsonl")) {
          transcriptPath = expanded;
        }
      }

      // Load config
      const config = await this.configManager.loadConfig();

      // --- 新的数据获取逻辑 ---
      let sessionData;
      let transcriptData;

      if (transcriptPath) {
        // Auto-detect: Codex vs Claude session
        const isCodexSession = transcriptPath.includes("/.codex/sessions/") || transcriptPath.includes("/.codex/archived_sessions/");
        const fetcher = isCodexSession ? this.codexDataFetcher : this.transcriptDataFetcher;
        spinner.text = isCodexSession ? "Reading Codex transcript..." : "Reading transcript...";
        const result =
          await fetcher.fetchFromTranscript(transcriptPath);
        sessionData = result.sessionData;
        transcriptData = result.transcriptData;
      } else {
        // 手动模式无 transcriptPath，降级到 ccusage
        spinner.text = "Fetching session data...";
        try {
          if (actualSessionId) {
            sessionData =
              await this.dataFetcher.fetchSessionById(actualSessionId);
          } else {
            sessionData =
              await this.dataFetcher.fetchSessionData(options.session);
          }
        } catch (err) {
          if (stdinData) {
            spinner.stop();
            return;
          }
          throw err;
        }
        // 从 ccusage 数据推断 transcriptPath
        if (
          !transcriptPath &&
          sessionData.projectPath &&
          sessionData.projectPath !== "Unknown Project"
        ) {
          const parts = sessionData.projectPath.split("/");
          actualSessionId = parts[parts.length - 1];
          transcriptPath = `${homedir()}/.claude/projects/${sessionData.projectPath}.jsonl`;
        }
        if (transcriptPath) {
          // 有 transcriptPath 时，使用直读模式获取准确的模型数据
          spinner.text = "Reading transcript...";
          const result =
            await this.transcriptDataFetcher.fetchFromTranscript(transcriptPath);
          sessionData = result.sessionData;
          transcriptData = result.transcriptData;
        } else {
          throw new Error(
            "Cannot determine transcript path. Session has no valid project path.",
          );
        }
      }

      // Get location
      const location =
        options.location || (await this.locationDetector.getLocation(config));

      // Generate receipt data
      spinner.text = "Generating receipt...";
      const receiptData = {
        sessionData,
        transcriptData,
        location,
        config,
      };

      const receipt = this.receiptGenerator.generateReceipt(receiptData);

      spinner.succeed("Receipt generated!");

      // Determine if we should output to console and/or file
      const isFromHook = !!stdinData;
      const outputFormats = [
        ...new Set(options.output || (isFromHook ? ["html"] : ["console"])),
      ] as OutputFormat[];

      const errors: Array<{ format: OutputFormat; error: Error }> = [];

      for (const format of outputFormats) {
        try {
          switch (format) {
            case "printer":
              await this.outputToPrinter(receiptData, options, config, spinner);
              break;
            case "html":
              await this.outputToHtml(
                receiptData,
                receipt,
                actualSessionId || sessionData.sessionId,
                transcriptData.sessionSlug,
                isFromHook,
              );
              break;
            case "console":
              this.outputToConsole(receipt);
              break;
            case "bt":
              await this.outputToBt(receiptData, options, config as unknown as Record<string, unknown>, spinner);
              break;
            case "livephoto":
            case "video":
            case "gif":
              await this.outputToVideo(receiptData, format, transcriptData.sessionSlug || actualSessionId || sessionData.sessionId, spinner);
              break;
          }
        } catch (err) {
          const error =
            err instanceof Error ? err : new Error("Unknown error");
          errors.push({ format, error });

          if (outputFormats.length > 1 && !isFromHook) {
            console.log(
              chalk.yellow(
                `\n⚠ ${format} output failed: ${error.message}`,
              ),
            );
          }
        }
      }

      if (errors.length === outputFormats.length) {
        // All outputs failed — throw the first error
        throw errors[0].error;
      }
    } catch (error) {
      spinner.fail("Failed to generate receipt");

      if (error instanceof Error) {
        console.error(chalk.red(`Error: ${error.message}`));
      } else {
        console.error(chalk.red("An unknown error occurred"));
      }

      process.exit(1);
    }
  }

  /**
   * Export receipt as video (Live Photo, MP4, or GIF) with typewriter animation
   */
  private async outputToVideo(
    receiptData: ReceiptData,
    format: "livephoto" | "video" | "gif",
    sessionId: string,
    spinner: ReturnType<typeof ora>,
  ): Promise<void> {
    spinner.start("Rendering typewriter animation...");

    const renderResult = await this.videoRenderer.render(receiptData, { format });

    spinner.text = "Assembling video...";

    const outputDir = `${homedir()}/Downloads`;
    const basename = this.sanitizeFileName(
      `${sessionId}-${format === "livephoto" ? "livephoto" : format}`,
    );

    const result = await this.livePhotoAssembler.assemble({
      framesDir: (renderResult as any)._framesDir,
      frameCount: (renderResult as any)._frameCount,
      stillPath: renderResult.stillPath,
      outputDir,
      basename,
      format,
      fps: 24,
      tmpDir: (renderResult as any)._tmpDir,
    });

    spinner.succeed(`${format} exported!`);
    console.log(chalk.green(`  Video: ${result.videoPath}`));
    if (result.stillPath) {
      console.log(chalk.green(`  Cover: ${result.stillPath}`));
    }
  }

  /**
   * Send receipt to MXW01 printer via BLE
   */
  private async outputToBt(
    receiptData: ReceiptData,
    _options: GenerateOptions,
    _config: Record<string, unknown>,
    spinner: ReturnType<typeof ora>,
  ): Promise<void> {
    spinner.start("Scanning for MXW01 printer via BLE...");
    await this.miaomiaojiRenderer.printReceipt(receiptData);
    spinner.succeed("Receipt printed via MXW01 BLE printer");
  }

  /**
   * Send receipt to thermal printer
   */
  private async outputToPrinter(
    receiptData: ReceiptData,
    options: GenerateOptions,
    config: { printer?: string },
    spinner: ReturnType<typeof ora>,
  ): Promise<void> {
    const printerInterface = options.printer || config.printer;
    if (!printerInterface) {
      throw new Error(
        'No printer specified. Use --printer <name> or set via: token-receipts config --set printer=EPSON_TM_T88V',
      );
    }

    spinner.start("Sending to printer...");
    await this.thermalPrinter.printReceipt(receiptData, printerInterface);
    spinner.succeed(`Receipt sent to printer: ${printerInterface}`);
  }

  /**
   * Save receipt as HTML and optionally open in browser
   */
  private async outputToHtml(
    receiptData: ReceiptData,
    receipt: string,
    sessionId: string,
    sessionSlug: string | undefined,
    isFromHook: boolean,
  ): Promise<void> {
    const fileName = this.sanitizeFileName(sessionSlug || sessionId);
    const home = homedir();
    const html = await this.htmlRenderer.generateHtml(receiptData, receipt);

    // 保存到项目目录
    const projectDir = `${home}/.token-receipts/projects`;
    const projectPath = `${projectDir}/${fileName}.html`;
    await this.saveHtmlFile(html, projectPath);

    // 自动保存到桌面或下载文件夹（无感保存）
    const autoSavePath = this.getAutoSavePath(fileName);
    if (autoSavePath) {
      await this.saveHtmlFile(html, autoSavePath);
    }

    if (isFromHook) {
      await this.openInBrowser(autoSavePath || projectPath);
    } else {
      console.log(chalk.cyan("\nTip: Open in browser to view!"));
    }
  }

  /**
   * 获取自动保存路径：优先桌面，其次下载文件夹
   */
  private getAutoSavePath(fileName: string): string | null {
    const home = homedir();
    const downloads = `${home}/Downloads`;
    const desktop = `${home}/Desktop`;

    if (existsSync(downloads)) return `${downloads}/${fileName}.html`;
    if (existsSync(desktop)) return `${desktop}/${fileName}.html`;
    return null;
  }

  /**
   * Display receipt to console with formatting
   */
  private outputToConsole(receipt: string): void {
    this.displayToConsole(receipt);
  }

  /**
   * Check if stdin has data and read it
   */
  private async readStdinIfAvailable(): Promise<SessionEndHookData | null> {
    return new Promise((resolve) => {
      // Check if stdin is a TTY (interactive terminal) or piped
      if (stdin.isTTY) {
        resolve(null);
        return;
      }

      let data = "";
      const timeout = setTimeout(() => {
        resolve(null);
      }, 100); // 100ms timeout to avoid hanging

      stdin.setEncoding("utf-8");

      stdin.on("data", (chunk) => {
        data += chunk;
      });

      stdin.on("end", () => {
        clearTimeout(timeout);
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch {
          resolve(null);
        }
      });

      // If no data after timeout, continue without stdin
      stdin.resume();
    });
  }

  /**
   * Display receipt to console with formatting
   */
  private displayToConsole(receipt: string): void {
    console.log(
      boxen(receipt, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan",
      }),
    );
  }

  /**
   * Save receipt to a file
   */
  private async saveToFile(
    receipt: string,
    outputPath: string,
    sessionId: string,
  ): Promise<void> {
    const { writeFile, mkdir } = await import("fs/promises");
    const { dirname, resolve } = await import("path");

    const resolvedPath = resolve(this.expandPath(outputPath));
    const dir = dirname(resolvedPath);

    // Ensure directory exists
    await mkdir(dir, { recursive: true });

    // Write receipt to file
    await writeFile(resolvedPath, receipt, "utf-8");

    console.log(chalk.green(`Receipt saved to: ${resolvedPath}`));
  }

  /**
   * Save HTML file
   */
  private async saveHtmlFile(html: string, outputPath: string): Promise<void> {
    const { writeFile, mkdir } = await import("fs/promises");
    const { dirname, resolve } = await import("path");

    const resolvedPath = resolve(this.expandPath(outputPath));
    const dir = dirname(resolvedPath);

    // Ensure directory exists
    await mkdir(dir, { recursive: true });

    // Write HTML to file
    await writeFile(resolvedPath, html, "utf-8");

    console.log(chalk.green(`Receipt saved to: ${resolvedPath}`));
  }

  /**
   * Open file in default browser
   */
  private async openInBrowser(filePath: string): Promise<void> {
    const platform = process.platform;

    try {
      if (platform === "darwin") {
        // macOS
        await execAsync(`open "${filePath}"`);
      } else if (platform === "win32") {
        // Windows
        await execAsync(`start "" "${filePath}"`);
      } else {
        // Linux
        await execAsync(`xdg-open "${filePath}"`);
      }
    } catch (error) {
      // Silently fail - file is still saved
      // Can't log error in hook context anyway
    }
  }

  /**
   * Expand ~ to home directory
   */
  private expandPath(path: string): string {
    if (path.startsWith("~/")) {
      const home = process.env.HOME || process.env.USERPROFILE || "";
      return path.replace(/^~/, home);
    }
    return path;
  }

  /**
   * Sanitize a string for use as a file name
   */
  private sanitizeFileName(name: string): string {
    return name
      .replace(/[/\\:*?"<>|]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 60);
  }
}
