import type { CcusageSession } from "../types/ccusage.js";
import type { ParsedTranscript } from "../types/transcript.js";
import type { ReceiptConfig } from "../types/config.js";
import type { DailySummaryData } from "../types/daily.js";
import { getRandomQuote } from "../utils/quotes.js";
import {
  formatCurrency,
  formatNumber,
  formatDateTime,
  formatDuration,
} from "../utils/formatting.js";
import { getHeader, SEPARATOR, LIGHT_SEPARATOR } from "../utils/ascii-art.js";
import { getDisplayName, getProvider, getCurrencySymbol } from "../utils/model-pricing.js";

export interface ReceiptData {
  sessionData: CcusageSession;
  transcriptData: ParsedTranscript;
  location: string;
  config: ReceiptConfig;
}

export class ReceiptGenerator {
  /**
   * Generate a complete receipt as text
   */
  generateReceipt(data: ReceiptData): string {
    const lines: string[] = [];

    // Header — use logo from the primary model's provider
    const mainProvider = this.getMainProvider(data.sessionData);
    lines.push(SEPARATOR);
    lines.push(getHeader(mainProvider));
    lines.push(SEPARATOR);
    lines.push("");

    // Location and session info
    lines.push(this.centerText(`Location: ${data.location}`, 35));
    lines.push(
      this.centerText(`Session: ${data.transcriptData.sessionSlug}`, 35),
    );
    lines.push(
      this.centerText(
        formatDateTime(data.transcriptData.endTime, data.config.timezone),
        35,
      ),
    );
    lines.push("");

    // Line items header
    lines.push(SEPARATOR);
    lines.push(this.padLine("ITEM", "QTY", "PRICE"));
    lines.push(LIGHT_SEPARATOR);

    // Model breakdown
    if (
      data.sessionData.modelBreakdowns &&
      data.sessionData.modelBreakdowns.length > 0
    ) {
      for (const model of data.sessionData.modelBreakdowns) {
        const sym = getCurrencySymbol(model.modelName);
        lines.push(this.getModelName(model.modelName));

        // Input tokens
        lines.push(
          this.padLine(
            "  Input tokens",
            formatNumber(model.inputTokens),
            this.formatTokenCost(
              model.inputTokens,
              model.cost,
              data.sessionData.totalTokens,
              sym,
            ),
          ),
        );

        // Output tokens
        lines.push(
          this.padLine(
            "  Output tokens",
            formatNumber(model.outputTokens),
            this.formatTokenCost(
              model.outputTokens,
              model.cost,
              data.sessionData.totalTokens,
              sym,
            ),
          ),
        );

        // Cache tokens if present
        if (model.cacheCreationTokens && model.cacheCreationTokens > 0) {
          lines.push(
            this.padLine(
              "  Cache write",
              formatNumber(model.cacheCreationTokens),
              this.formatTokenCost(
                model.cacheCreationTokens,
                model.cost,
                data.sessionData.totalTokens,
                sym,
              ),
            ),
          );
        }

        if (model.cacheReadTokens && model.cacheReadTokens > 0) {
          lines.push(
            this.padLine(
              "  Cache read",
              formatNumber(model.cacheReadTokens),
              this.formatTokenCost(
                model.cacheReadTokens,
                model.cost,
                data.sessionData.totalTokens,
                sym,
              ),
            ),
          );
        }

        lines.push("");
      }
    }

    // Totals
    const totalSymbol = getCurrencySymbol(
      data.sessionData.modelBreakdowns?.[0]?.modelName ?? "",
    );
    lines.push(SEPARATOR);
    lines.push(
      this.padLine("SUBTOTAL", "", formatCurrency(data.sessionData.totalCost, totalSymbol)),
    );
    lines.push(LIGHT_SEPARATOR);
    lines.push(
      this.padLine("TOTAL", "", formatCurrency(data.sessionData.totalCost, totalSymbol)),
    );
    lines.push(SEPARATOR);
    lines.push("");

    // Footer
    const quote = getRandomQuote();
    lines.push(`CASHIER: ${this.getMainModel(data.sessionData)}`);
    lines.push("");
    lines.push("");
    const quoteParts = quote.split(" — ");
    lines.push(this.centerText(quoteParts[0], 35));
    if (quoteParts[1]) {
      lines.push(this.centerText(`— ${quoteParts[1]}`, 35));
    }
    lines.push("");
    lines.push("");
    lines.push(SEPARATOR);

    return lines.join("\n");
  }

  /**
   * Format a line with left, middle, and right alignment
   */
  private padLine(
    left: string,
    middle: string,
    right: string,
    width: number = 35,
  ): string {
    const rightLen = right.length;
    const leftLen = left.length;
    const middleLen = middle.length;

    // Calculate spacing
    const totalContent = leftLen + middleLen + rightLen;
    const availableSpace = width - totalContent;

    if (availableSpace < 0) {
      // If content is too long, just concatenate
      return `${left} ${middle} ${right}`;
    }

    // Distribute space: left...middle...right
    const middleSpace = Math.floor(availableSpace / 2);
    const rightSpace = availableSpace - middleSpace;

    return (
      left + " ".repeat(middleSpace) + middle + " ".repeat(rightSpace) + right
    );
  }

  /**
   * Center text in a given width
   */
  private centerText(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(padding) + text;
  }

  /**
   * Wrap text to a given width
   */
  private wrapText(text: string, width: number): string {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= width) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines.join("\n");
  }

  /**
   * Format token cost (proportional to model cost)
   */
  private formatTokenCost(
    tokens: number,
    modelCost: number,
    totalTokens: number,
    symbol: string = "$",
  ): string {
    const proportion = tokens / totalTokens;
    const cost = modelCost * proportion;
    return formatCurrency(cost, symbol);
  }

  /**
   * Get a clean model name
   */
  private getModelName(model: string): string {
    return getDisplayName(model);
  }

  /**
   * Get the main model used in the session
   */
  private getMainModel(sessionData: CcusageSession): string {
    if (sessionData.modelBreakdowns && sessionData.modelBreakdowns.length > 0) {
      return this.getModelName(sessionData.modelBreakdowns[0].modelName);
    }

    if (sessionData.modelsUsed && sessionData.modelsUsed.length > 0) {
      return this.getModelName(sessionData.modelsUsed[0]);
    }

    return "Claude";
  }

  /**
   * Get the provider of the primary model
   */
  private getMainProvider(sessionData: CcusageSession): ReturnType<typeof getProvider> {
    if (sessionData.modelBreakdowns && sessionData.modelBreakdowns.length > 0) {
      return getProvider(sessionData.modelBreakdowns[0].modelName);
    }
    if (sessionData.modelsUsed && sessionData.modelsUsed.length > 0) {
      return getProvider(sessionData.modelsUsed[0]);
    }
    return "anthropic";
  }

  /**
   * Generate a daily summary receipt
   */
  generateDailyReceipt(data: DailySummaryData): string {
    const lines: string[] = [];
    const { summary, location, config } = data;

    lines.push(SEPARATOR);
    lines.push(getHeader("anthropic"));
    lines.push(SEPARATOR);
    lines.push("");
    lines.push(this.centerText("DAILY SUMMARY", 35));

    const [y, m, d] = summary.date.split("-").map(Number);
    const dayStart = new Date(y, m - 1, d);
    const isToday = summary.date === new Date().toISOString().slice(0, 10);
    const dayEnd = isToday ? new Date() : new Date(y, m - 1, d, 23, 59);
    const timeEnd = dayEnd.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    lines.push(this.centerText(`${summary.date}  00:00 ~ ${timeEnd}`, 35));
    lines.push("");

    const durationDiff = dayEnd.getTime() - dayStart.getTime();
    const dHours = Math.floor(durationDiff / 3600000);
    const dMins = Math.floor((durationDiff % 3600000) / 60000);
    const durationLabel = dHours > 0 ? `${dHours}h ${dMins}m` : `${dMins}m`;

    lines.push(
      this.centerText(
        `${summary.sessionCount} sessions | ${durationLabel}`,
        35,
      ),
    );
    lines.push(this.centerText(`Location: ${location}`, 35));
    lines.push("");

    // Model breakdown
    lines.push(SEPARATOR);
    lines.push(this.padLine("ITEM", "QTY", "PRICE"));
    lines.push(LIGHT_SEPARATOR);

    for (const model of summary.modelSummaries) {
      const sym = getCurrencySymbol(model.modelName);
      lines.push(model.displayName);

      lines.push(
        this.padLine("  Input tokens", formatNumber(model.inputTokens), ""),
      );
      lines.push(
        this.padLine("  Output tokens", formatNumber(model.outputTokens), ""),
      );

      if (model.cacheCreationTokens > 0) {
        lines.push(
          this.padLine("  Cache write", formatNumber(model.cacheCreationTokens), ""),
        );
      }
      if (model.cacheReadTokens > 0) {
        lines.push(
          this.padLine("  Cache read", formatNumber(model.cacheReadTokens), ""),
        );
      }

      lines.push(
        this.padLine("", "", formatCurrency(model.estimatedCost, sym)),
      );
      lines.push("");
    }

    // Totals — unified CNY
    lines.push(SEPARATOR);
    lines.push(
      this.padLine("TOTAL", "", formatCurrency(summary.totalCostCNY, "¥")),
    );
    if (summary.hasUsdModel && summary.exchangeRate) {
      lines.push(
        this.centerText(`(USD→CNY: ${summary.exchangeRate.toFixed(2)})`, 35),
      );
    }
    lines.push(SEPARATOR);
    lines.push("");

    lines.push("CASHIER: Daily Summary");
    lines.push("");
    lines.push("");

    const quote = getRandomQuote();
    const quoteParts = quote.split(" — ");
    lines.push(this.centerText(quoteParts[0], 35));
    if (quoteParts[1]) {
      lines.push(this.centerText(`— ${quoteParts[1]}`, 35));
    }

    lines.push("");
    lines.push("");
    lines.push(SEPARATOR);

    return lines.join("\n");
  }

  generateMonthlyReceipt(data: DailySummaryData): string {
    const lines: string[] = [];
    const { summary, location, config } = data;

    lines.push(SEPARATOR);
    lines.push(getHeader("anthropic"));
    lines.push(SEPARATOR);
    lines.push("");
    lines.push(this.centerText("MONTHLY SUMMARY", 35));
    lines.push(this.centerText(summary.date, 35));
    lines.push("");

    const earliest = summary.earliestStart;
    const latest = summary.latestEnd;
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    lines.push(this.centerText(`${fmt(earliest)} ~ ${fmt(latest)}`, 35));

    lines.push(
      this.centerText(
        `${summary.sessionCount} sessions`,
        35,
      ),
    );
    lines.push(this.centerText(`Location: ${location}`, 35));
    lines.push("");

    // Model breakdown
    lines.push(SEPARATOR);
    lines.push(this.padLine("ITEM", "QTY", "PRICE"));
    lines.push(LIGHT_SEPARATOR);

    for (const model of summary.modelSummaries) {
      const sym = getCurrencySymbol(model.modelName);
      lines.push(model.displayName);

      lines.push(
        this.padLine("  Input tokens", formatNumber(model.inputTokens), ""),
      );
      lines.push(
        this.padLine("  Output tokens", formatNumber(model.outputTokens), ""),
      );

      if (model.cacheCreationTokens > 0) {
        lines.push(
          this.padLine("  Cache write", formatNumber(model.cacheCreationTokens), ""),
        );
      }
      if (model.cacheReadTokens > 0) {
        lines.push(
          this.padLine("  Cache read", formatNumber(model.cacheReadTokens), ""),
        );
      }

      lines.push(
        this.padLine("", "", formatCurrency(model.estimatedCost, sym)),
      );
      lines.push("");
    }

    // Totals — unified CNY
    lines.push(SEPARATOR);
    lines.push(
      this.padLine("TOTAL", "", formatCurrency(summary.totalCostCNY, "¥")),
    );
    if (summary.hasUsdModel && summary.exchangeRate) {
      lines.push(
        this.centerText(`(USD→CNY: ${summary.exchangeRate.toFixed(2)})`, 35),
      );
    }
    lines.push(SEPARATOR);
    lines.push("");

    lines.push("CASHIER: Monthly Summary");
    lines.push("");
    lines.push("");

    const quote = getRandomQuote();
    const quoteParts = quote.split(" — ");
    lines.push(this.centerText(quoteParts[0], 35));
    if (quoteParts[1]) {
      lines.push(this.centerText(`— ${quoteParts[1]}`, 35));
    }

    lines.push("");
    lines.push("");
    lines.push(SEPARATOR);

    return lines.join("\n");
  }
}
