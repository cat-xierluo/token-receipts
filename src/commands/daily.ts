import chalk from "chalk";
import { exec } from "child_process";
import { SessionDiscoverer } from "../core/session-discoverer.js";
import { DailyAggregator } from "../core/daily-aggregator.js";
import { ReceiptGenerator } from "../core/receipt-generator.js";
import { HtmlRenderer } from "../core/html-renderer.js";
import { MiaoMiaoJiRenderer } from "../core/miaomiaoji-renderer.js";
import { ConfigManager } from "../core/config-manager.js";
import { LocationDetector } from "../utils/location.js";
import { getCurrencySymbol } from "../utils/model-pricing.js";
import { formatCurrency } from "../utils/formatting.js";
import { join } from "node:path";
import { homedir } from "node:os";
import { mkdirSync, writeFileSync } from "node:fs";

export interface DailyOptions {
  date?: string;
  output?: string[];
  location?: string;
}

export class DailyCommand {
  async execute(options: DailyOptions): Promise<void> {
    const targetDate = this.resolveDate(options.date);
    console.log(chalk.blue(`- Scanning sessions for ${targetDate}...`));

    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();

    const discoverer = new SessionDiscoverer();
    const files = await discoverer.discoverSessions(targetDate);

    if (files.length === 0) {
      console.log(chalk.yellow(`No sessions found for ${targetDate}.`));
      console.log(
        chalk.gray(
          "Try a different date: token-receipts daily --date YYYY-MM-DD",
        ),
      );
      return;
    }

    console.log(chalk.gray(`  Found ${files.length} session(s)`));

    const aggregator = new DailyAggregator();
    const summary = await aggregator.aggregate(files, targetDate);

    const locationDetector = new LocationDetector();
    const location =
      options.location ?? config.location ?? (await locationDetector.getLocation(config));

    const data = { summary, location, config };

    const outputs = options.output ?? ["console"];
    const totalSymbol = getCurrencySymbol(summary.allModelsUsed[0] ?? "");

    for (const format of outputs) {
      if (format === "console") {
        const generator = new ReceiptGenerator();
        const receipt = generator.generateDailyReceipt(data);
        console.log("");
        console.log(receipt);
        console.log("");
        console.log(
          chalk.green(
            `${summary.sessionCount} sessions, ${formatCurrency(summary.totalCost, totalSymbol)} total`,
          ),
        );
      }

      if (format === "bt") {
        const htmlRenderer = new HtmlRenderer();
        const html = await htmlRenderer.generateDailyHtml(data);
        const btRenderer = new MiaoMiaoJiRenderer();
        console.log(chalk.blue("Printing daily summary via BLE..."));
        await btRenderer.printHtml(html);
        console.log(chalk.green("✔ Daily summary printed via MXW01"));
      }

      if (format === "html") {
        const renderer = new HtmlRenderer();
        const html = await renderer.generateDailyHtml(data);

        const receiptDir = join(homedir(), ".token-receipts", "projects");
        mkdirSync(receiptDir, { recursive: true });
        const filename = `daily-${targetDate}.html`;
        const filePath = join(receiptDir, filename);
        writeFileSync(filePath, html);

        const desktopDir = this.getDesktopDir();
        if (desktopDir) {
          const desktopPath = join(desktopDir, filename);
          writeFileSync(desktopPath, html);
          console.log(chalk.green(`✔ Receipt saved to: ${desktopPath}`));
        }

        console.log(chalk.green(`✔ Receipt saved to: ${filePath}`));
        this.openInBrowser(filePath);
      }
    }
  }

  private async openInBrowser(filePath: string): Promise<void> {
    const execAsync = (cmd: string) =>
      new Promise<void>((resolve, reject) =>
        exec(cmd, (err) => (err ? reject(err) : resolve())),
      );
    try {
      if (process.platform === "darwin") {
        await execAsync(`open "${filePath}"`);
      } else if (process.platform === "linux") {
        await execAsync(`xdg-open "${filePath}"`);
      }
    } catch {
      // best-effort
    }
  }

  private resolveDate(input?: string): string {
    if (!input || input === "today") {
      return new Date().toISOString().slice(0, 10);
    }
    if (input === "yesterday") {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    throw new Error(
      `Invalid date format "${input}". Use YYYY-MM-DD, "today", or "yesterday".`,
    );
  }

  private getDesktopDir(): string | null {
    const home = homedir();
    const desktop = join(home, "Desktop");
    try {
      mkdirSync(desktop, { recursive: true });
      return desktop;
    } catch {
      return null;
    }
  }
}
