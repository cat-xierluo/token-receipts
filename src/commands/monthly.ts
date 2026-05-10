import chalk from "chalk";
import { exec } from "child_process";
import { SessionDiscoverer } from "../core/session-discoverer.js";
import { CodexDiscoverer } from "../core/codex-discoverer.js";
import { DailyAggregator } from "../core/daily-aggregator.js";
import { ReceiptGenerator } from "../core/receipt-generator.js";
import { HtmlRenderer } from "../core/html-renderer.js";
import { MiaoMiaoJiRenderer } from "../core/miaomiaoji-renderer.js";
import { ConfigManager } from "../core/config-manager.js";
import { LocationDetector } from "../utils/location.js";
import { formatCurrency } from "../utils/formatting.js";
import { getUsdCnyRate } from "../utils/exchange-rate.js";
import { join } from "node:path";
import { homedir } from "node:os";
import { mkdirSync, writeFileSync } from "node:fs";

export interface MonthlyOptions {
  month?: string;
  output?: string[];
  location?: string;
}

export class MonthlyCommand {
  async execute(options: MonthlyOptions): Promise<void> {
    const targetMonth = this.resolveMonth(options.month);
    console.log(chalk.blue(`- Scanning sessions for ${targetMonth}...`));

    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();

    const claudeDiscoverer = new SessionDiscoverer();
    const codexDiscoverer = new CodexDiscoverer();
    const [claudeFiles, codexFiles] = await Promise.all([
      claudeDiscoverer.discoverMonthSessions(targetMonth),
      codexDiscoverer.discoverMonthSessions(targetMonth),
    ]);
    const files = [...claudeFiles, ...codexFiles];

    if (files.length === 0) {
      console.log(chalk.yellow(`No sessions found for ${targetMonth}.`));
      console.log(
        chalk.gray(
          "Try a different month: token-receipts monthly --month YYYY-MM",
        ),
      );
      return;
    }

    const claudeCount = claudeFiles.length;
    const codexCount = codexFiles.length;
    const parts = [`${files.length} session(s)`];
    if (claudeCount) parts.push(`${claudeCount} Claude`);
    if (codexCount) parts.push(`${codexCount} Codex`);
    console.log(chalk.gray(`  Found ${parts.join(" · ")}`));

    const aggregator = new DailyAggregator();
    const exchangeRate = await getUsdCnyRate();
    const summary = await aggregator.aggregate(files, targetMonth, exchangeRate);

    const locationDetector = new LocationDetector();
    const location =
      options.location ?? config.location ?? (await locationDetector.getLocation(config));

    const data = { summary, location, config };

    const outputs = options.output ?? ["console"];

    for (const format of outputs) {
      if (format === "console") {
        const generator = new ReceiptGenerator();
        const receipt = generator.generateMonthlyReceipt(data);
        console.log("");
        console.log(receipt);
        console.log("");
        console.log(
          chalk.green(
            `${summary.sessionCount} sessions, ${formatCurrency(summary.totalCostCNY, "¥")} total`,
          ),
        );
      }

      if (format === "bt") {
        const htmlRenderer = new HtmlRenderer();
        const html = await htmlRenderer.generateMonthlyHtml(data);
        const btRenderer = new MiaoMiaoJiRenderer();
        console.log(chalk.blue("Printing monthly summary via BLE..."));
        await btRenderer.printHtml(html);
        console.log(chalk.green("✔ Monthly summary printed via MXW01"));
      }

      if (format === "html") {
        const renderer = new HtmlRenderer();
        const html = await renderer.generateMonthlyHtml(data);

        const receiptDir = join(homedir(), ".token-receipts", "projects");
        mkdirSync(receiptDir, { recursive: true });
        const filename = `monthly-${targetMonth}.html`;
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

  private resolveMonth(input?: string): string {
    if (!input || input === "this-month") {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }
    if (input === "last-month") {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
    if (/^\d{4}-\d{2}$/.test(input)) {
      return input;
    }
    throw new Error(
      `Invalid month format "${input}". Use YYYY-MM, "this-month", or "last-month".`,
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
