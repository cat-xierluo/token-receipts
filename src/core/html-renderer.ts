import type { ReceiptData } from "./receipt-generator.js";
import type { DailySummaryData } from "../types/daily.js";
import {
  formatCurrency,
  formatNumber,
  formatDateTime,
  formatDuration,
} from "../utils/formatting.js";
import { getLogoRenderData } from "../utils/ascii-art.js";
import {
  getDisplayName,
  getProvider,
  getCurrencySymbol,
} from "../utils/model-pricing.js";
import type { Provider } from "../utils/model-pricing.js";
import { getRandomQuote } from "../utils/quotes.js";

// Embedded receipt data used by the local PNG export button.
export interface ReceiptExportData {
  sessionSlug: string;
  location: string;
  sessionDate: string;
  timezone?: string;
  totalCost: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  modelBreakdowns: Array<{
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens?: number;
    cacheReadTokens?: number;
    cost: number;
  }>;
  userMessageCount: number;
  assistantMessageCount: number;
  totalMessages: number;
}

const GITHUB_URL = "https://github.com/cat-xierluo/token-receipts";

export class HtmlRenderer {
  /**
   * Extract browser-safe data for local image export.
   */
  getExportData(data: ReceiptData): ReceiptExportData {
    return {
      sessionSlug: data.transcriptData.sessionSlug,
      location: data.location,
      sessionDate: data.transcriptData.endTime.toISOString(),
      timezone: data.config.timezone,
      totalCost: data.sessionData.totalCost,
      totalTokens: data.sessionData.totalTokens,
      inputTokens: data.sessionData.inputTokens,
      outputTokens: data.sessionData.outputTokens,
      cacheCreationTokens: data.sessionData.cacheCreationTokens || 0,
      cacheReadTokens: data.sessionData.cacheReadTokens || 0,
      modelBreakdowns: (data.sessionData.modelBreakdowns || []).map((m) => ({
        modelName: m.modelName,
        inputTokens: m.inputTokens,
        outputTokens: m.outputTokens,
        cacheCreationTokens: m.cacheCreationTokens,
        cacheReadTokens: m.cacheReadTokens,
        cost: m.cost,
      })),
      userMessageCount: data.transcriptData.userMessageCount,
      assistantMessageCount: data.transcriptData.assistantMessageCount,
      totalMessages: data.transcriptData.totalMessages,
    };
  }

  /**
   * Generate HTML receipt with embedded CSS
   */
  async generateHtml(data: ReceiptData, receiptText: string): Promise<string> {
    const exportData = this.getExportData(data);
    const mainProvider = this.getMainProvider(data);
    const logo = getLogoRenderData(mainProvider);
    const quote = getRandomQuote();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Receipt - ${data.transcriptData.sessionSlug}</title>
  <style>
${this.sharedCss()}
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="receipt">
      <div class="receipt-edge receipt-edge-top" id="edge-top"></div>
      <div class="header">
        <div class="logo" style="${logo.style}">
          <pre class="logo-mark">${this.escapeHtml(logo.display)}</pre>
        </div>
        <div class="meta">
          <div class="meta-row">
            <div>Location</div><div class="dots">....................</div><div class="value">${this.escapeHtml(data.location)}</div>
          </div>
          <div class="meta-row">
            <div>Session</div><div class="dots">....................</div><div class="value value-session">${this.escapeHtml(data.transcriptData.sessionSlug)}</div>
          </div>
          <div class="meta-row">
            <div>Date</div><div class="dots">....................</div><div class="value">${formatDateTime(data.transcriptData.endTime, data.config.timezone)}</div>
          </div>
        </div>
      </div>

      <div class="separator"></div>

      ${this.renderLineItems(data)}

      <div class="total-section">
        <div class="total">
          <span>TOTAL</span>
          <span>${formatCurrency(data.sessionData.totalCost, mainProvider ? getCurrencySymbol(data.sessionData.modelBreakdowns?.[0]?.modelName ?? "") : "$")}</span>
        </div>
      </div>

      <div class="footer">
        <div>CASHIER: ${this.getMainModel(data)}</div>
        <div class="footer-message">${this.escapeHtml(quote).replace(/ — /g, "<br>— ")}</div>
        <div class="generated-by">
          Print your own <strong>token receipts</strong> with<br>
          <a href="${GITHUB_URL}" style="color: #333;">github.com/cat-xierluo/token-receipts</a>
        </div>
      </div>
      <div class="receipt-edge receipt-edge-bottom" id="edge-bottom"></div>
    </div>

    <div class="actions">
      <button class="action-btn" id="save-img-btn" onclick="saveAsImage('png')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <span id="save-img-btn-text">Save PNG</span>
      </button>
    </div>
  </div>

  <!-- Embedded receipt data for local image export -->
  <script id="receipt-data" type="application/json">
${JSON.stringify(exportData, null, 2)}
  </script>

  <script>
    function fitAsciiLogos() {
      document.querySelectorAll('.logo').forEach((logo) => {
        const mark = logo.querySelector('.logo-mark');
        if (!mark) return;
        mark.style.setProperty('--logo-fit-scale', '1');
        const boxWidth = logo.clientWidth;
        const boxHeight = logo.clientHeight;
        const markWidth = mark.scrollWidth;
        const markHeight = mark.scrollHeight;
        if (!boxWidth || !boxHeight || !markWidth || !markHeight) return;
        const requestedScale = Number.parseFloat(getComputedStyle(mark).getPropertyValue('--logo-scale')) || 1;
        const measuredScale = Math.min(1, boxWidth / markWidth, boxHeight / markHeight);
        const nextScale = Math.min(requestedScale, measuredScale < 1 ? measuredScale * 0.96 : 1);
        mark.style.setProperty('--logo-fit-scale', String(Math.max(0.1, Math.floor(nextScale * 1000) / 1000)));
      });
    }

    // Generate piano-key stripes for receipt edges
    function fillEdgeStripes(el, offset) {
      if (!el) return;
      let html = '';
      for (let x = offset; x < 540; x += 20) {
        html += '<div class="stripe" style="left:' + x + 'px"></div>';
      }
      el.innerHTML = html;
    }
    fillEdgeStripes(document.getElementById('edge-top'), 0);
    fillEdgeStripes(document.getElementById('edge-bottom'), 10);
    fitAsciiLogos();
    window.addEventListener('load', fitAsciiLogos);

    // Add keyboard shortcut to close window
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.close();
      }
    });

    // Log receipt info
    console.log('Claude Receipt Generated!');
    console.log('Session:', '${this.escapeHtml(data.transcriptData.sessionSlug)}');
    console.log('Cost:', '${formatCurrency(data.sessionData.totalCost, getCurrencySymbol(data.sessionData.modelBreakdowns?.[0]?.modelName ?? ""))}');
    console.log('Press ESC to close');
  </script>

  <script src="https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js"></script>
  <script>
    async function saveAsImage(format) {
      const btn = document.getElementById('save-img-btn');
      const btnText = document.getElementById('save-img-btn-text');
      btn.disabled = true;
      btnText.textContent = 'Saving...';

      try {
        fitAsciiLogos();
        const receipt = document.querySelector('.receipt');
        const dataUrl = await htmlToImage.toPng(receipt, {
          quality: 1,
          pixelRatio: 3,
          backgroundColor: '#ffffff',
          style: { boxShadow: 'none', animation: 'none' },
        });

        const link = document.createElement('a');
        link.download = '${this.escapeHtml(data.transcriptData.sessionSlug)}.' + format;
        link.href = dataUrl;
        link.click();

        btnText.textContent = 'Saved!';
        btn.classList.add('success');
        setTimeout(() => { btn.disabled = false; btn.classList.remove('success'); btnText.textContent = 'Save PNG'; }, 2000);
      } catch (err) {
        console.error('Save image failed:', err);
        btnText.textContent = 'Failed';
        btn.classList.add('error');
        setTimeout(() => { btn.disabled = false; btn.classList.remove('error'); btnText.textContent = 'Save PNG'; }, 2000);
      }
    }
  </script>
</body>
</html>`;
  }

  /**
   * Render line items HTML
   * Shows token counts and model subtotals (not per-token-type costs, which would be inaccurate)
   */
  private renderLineItems(data: ReceiptData): string {
    let html = '<div style="margin: 20px 0;">';

    if (
      data.sessionData.modelBreakdowns &&
      data.sessionData.modelBreakdowns.length > 0
    ) {
      for (const model of data.sessionData.modelBreakdowns) {
        const sym = getCurrencySymbol(model.modelName);
        // Model name with its subtotal cost
        html += `<div class="model-header">
          <span class="model-name">${this.escapeHtml(this.getModelName(model.modelName))}</span>
          <span class="model-cost">${formatCurrency(model.cost, sym)}</span>
        </div>`;

        html += `<div class="line-item">
          <span>  Input tokens</span>
          <span>${formatNumber(model.inputTokens)}</span>
        </div>`;

        html += `<div class="line-item">
          <span>  Output tokens</span>
          <span>${formatNumber(model.outputTokens)}</span>
        </div>`;

        if (model.cacheCreationTokens && model.cacheCreationTokens > 0) {
          html += `<div class="line-item">
            <span>  Cache write</span>
            <span>${formatNumber(model.cacheCreationTokens)}</span>
          </div>`;
        }

        if (model.cacheReadTokens && model.cacheReadTokens > 0) {
          html += `<div class="line-item">
            <span>  Cache read</span>
            <span>${formatNumber(model.cacheReadTokens)}</span>
          </div>`;
        }
      }
    }

    html += "</div>";
    return html;
  }

  /**
   * Get clean model name
   */
  private getModelName(model: string): string {
    return getDisplayName(model);
  }

  /**
   * Get main model
   */
  private getMainModel(data: ReceiptData): string {
    if (
      data.sessionData.modelBreakdowns &&
      data.sessionData.modelBreakdowns.length > 0
    ) {
      return this.getModelName(data.sessionData.modelBreakdowns[0].modelName);
    }

    if (data.sessionData.modelsUsed && data.sessionData.modelsUsed.length > 0) {
      return this.getModelName(data.sessionData.modelsUsed[0]);
    }

    return "Claude";
  }

  /**
   * Get the provider of the primary model
   */
  private getMainProvider(data: ReceiptData): Provider {
    if (
      data.sessionData.modelBreakdowns &&
      data.sessionData.modelBreakdowns.length > 0
    ) {
      return getProvider(data.sessionData.modelBreakdowns[0].modelName);
    }
    if (data.sessionData.modelsUsed && data.sessionData.modelsUsed.length > 0) {
      return getProvider(data.sessionData.modelsUsed[0]);
    }
    return "anthropic";
  }

  /**
   * Generate daily summary HTML receipt
   */
  async generateDailyHtml(data: DailySummaryData): Promise<string> {
    const { summary, location, config } = data;
    const logo = getLogoRenderData("anthropic");
    const [y, m, d] = summary.date.split("-").map(Number);
    const dayStart = new Date(y, m - 1, d);
    const isToday = summary.date === new Date().toISOString().slice(0, 10);
    const dayEnd = isToday ? new Date() : new Date(y, m - 1, d, 23, 59);
    const durationStr = this.formatDayDuration(dayStart, dayEnd);
    const timeEnd = dayEnd.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    const dateDisplay = `${summary.date}  00:00 ~ ${timeEnd}`;
    const quote = getRandomQuote();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Receipt - ${summary.date}</title>
  <style>
${this.sharedCss()}
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="receipt">
      <div class="receipt-edge receipt-edge-top" id="edge-top"></div>
      <div class="header">
        <div class="logo" style="${logo.style}">
          <pre class="logo-mark">${this.escapeHtml(logo.display)}</pre>
        </div>
        <div style="text-align:center; margin-top:10px;">
          <div style="font-size:18px; font-weight:bold; letter-spacing:2px;">DAILY SUMMARY</div>
          <div style="font-size:14px; margin-top:5px;">${dateDisplay}</div>
        </div>
        <div class="meta" style="margin-top:15px;">
          <div class="meta-row">
            <div>Location</div><div class="dots">....................</div><div class="value">${this.escapeHtml(location)}</div>
          </div>
          <div class="meta-row">
            <div>Sessions</div><div class="dots">....................</div><div class="value">${summary.sessionCount}</div>
          </div>
          <div class="meta-row">
            <div>Duration</div><div class="dots">....................</div><div class="value">${durationStr}</div>
          </div>
        </div>
      </div>

      <div class="separator"></div>

      ${this.renderDailyLineItems(summary)}

      <div class="total-section">
        <div class="total">
          <span>TOTAL</span>
          <span>${formatCurrency(summary.totalCostCNY, "¥")}</span>
        </div>
        ${summary.hasUsdModel && summary.exchangeRate ? `<div class="exchange-rate-note">(USD→CNY: ${summary.exchangeRate.toFixed(2)})</div>` : ""}
      </div>

      <div class="footer">
        <div>CASHIER: Daily Summary</div>
        <div class="footer-message">${this.escapeHtml(quote).replace(/ — /g, "<br>— ")}</div>
        <div class="generated-by">
          Print your own <strong>token receipts</strong> with<br>
          <a href="${GITHUB_URL}" style="color: #333;">github.com/cat-xierluo/token-receipts</a>
        </div>
      </div>
      <div class="receipt-edge receipt-edge-bottom" id="edge-bottom"></div>
    </div>

    <div class="actions">
      <button class="action-btn" id="save-img-btn" onclick="saveAsImage('png')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <span id="save-img-btn-text">Save PNG</span>
      </button>
    </div>
  </div>

  <script>
    function fitAsciiLogos() {
      document.querySelectorAll('.logo').forEach((logo) => {
        const mark = logo.querySelector('.logo-mark');
        if (!mark) return;
        mark.style.setProperty('--logo-fit-scale', '1');
        const boxWidth = logo.clientWidth;
        const boxHeight = logo.clientHeight;
        const markWidth = mark.scrollWidth;
        const markHeight = mark.scrollHeight;
        if (!boxWidth || !boxHeight || !markWidth || !markHeight) return;
        const requestedScale = Number.parseFloat(getComputedStyle(mark).getPropertyValue('--logo-scale')) || 1;
        const measuredScale = Math.min(1, boxWidth / markWidth, boxHeight / markHeight);
        const nextScale = Math.min(requestedScale, measuredScale < 1 ? measuredScale * 0.96 : 1);
        mark.style.setProperty('--logo-fit-scale', String(Math.max(0.1, Math.floor(nextScale * 1000) / 1000)));
      });
    }

    function fillEdgeStripes(el, offset) {
      if (!el) return;
      let html = '';
      for (let x = offset; x < 540; x += 20) {
        html += '<div class="stripe" style="left:' + x + 'px"></div>';
      }
      el.innerHTML = html;
    }
    fillEdgeStripes(document.getElementById('edge-top'), 0);
    fillEdgeStripes(document.getElementById('edge-bottom'), 10);
    fitAsciiLogos();
    window.addEventListener('load', fitAsciiLogos);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') window.close();
    });

    console.log('Daily Receipt Generated!');
    console.log('Date:', '${summary.date}');
    console.log('Sessions:', ${summary.sessionCount});
    console.log('Press ESC to close');
  </script>

  <script src="https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js"></script>
  <script>
    async function saveAsImage(format) {
      const btn = document.getElementById('save-img-btn');
      const btnText = document.getElementById('save-img-btn-text');
      btn.disabled = true;
      btnText.textContent = 'Saving...';

      try {
        fitAsciiLogos();
        const receipt = document.querySelector('.receipt');
        const dataUrl = await htmlToImage.toPng(receipt, {
          quality: 1,
          pixelRatio: 3,
          backgroundColor: '#ffffff',
          style: { boxShadow: 'none', animation: 'none' },
        });

        const link = document.createElement('a');
        link.download = 'daily-${summary.date}.' + format;
        link.href = dataUrl;
        link.click();

        btnText.textContent = 'Saved!';
        btn.classList.add('success');
        setTimeout(() => { btn.disabled = false; btn.classList.remove('success'); btnText.textContent = 'Save PNG'; }, 2000);
      } catch (err) {
        console.error('Save image failed:', err);
        btnText.textContent = 'Failed';
        btn.classList.add('error');
        setTimeout(() => { btn.disabled = false; btn.classList.remove('error'); btnText.textContent = 'Save PNG'; }, 2000);
      }
    }
  </script>
</body>
</html>`;
  }

  private sharedCss(): string {
    return `    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 20px;
      background: #3a3a3a;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .receipt-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 40px;
    }

    .receipt {
      background: #f8f8f8;
      width: 480px;
      padding: 45px 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      position: relative;
      animation: slideIn 0.5s ease-out;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .receipt-edge {
      position: absolute;
      left: 0;
      right: 0;
      height: 15px;
      overflow: hidden;
      background: #3a3a3a;
    }

    .receipt-edge-top { top: 0; }
    .receipt-edge-bottom { bottom: 0; }

    .receipt-edge .stripe {
      position: absolute;
      top: 0;
      width: 10px;
      height: 15px;
      background: #f8f8f8;
    }

    .header {
      text-align: center;
      padding: 20px 0;
    }

    .logo {
      --logo-font-size: 20px;
      --logo-line-height: 1.2;
      --logo-scale: 1;
      width: 35ch;
      height: 120px;
      overflow: hidden;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 10px auto;
      text-align: left;
    }

    .logo .logo-mark {
      margin: 0;
      font: inherit;
      font-size: var(--logo-font-size);
      line-height: var(--logo-line-height);
      white-space: pre;
      flex: 0 0 auto;
      transform: scale(var(--logo-fit-scale, var(--logo-scale)));
      transform-origin: center;
    }

    .separator {
      border-bottom: 2px solid #333;
      margin: 15px 0;
    }

    .line-item {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      color: #555;
    }

    .model-header {
      display: flex;
      justify-content: space-between;
      padding: 8px 0 4px 0;
      margin-top: 10px;
      border-bottom: 1px dashed #ccc;
    }

    .model-header:first-child { margin-top: 0; }

    .model-name { font-weight: bold; color: #333; }
    .model-cost { font-weight: bold; color: #333; }

    .total-section {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 2px solid #333;
    }

    .total {
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
    }

    .exchange-rate-note {
      text-align: center;
      color: #999;
      font-size: 0.85em;
      margin-top: 4px;
    }

    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px dashed #999;
      color: #666;
    }

    .footer-message { margin: 30px 0; color: #333; }

    .meta {
      margin: 10px 0;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .meta-row {
      color: #666;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 1px;
      text-align: left;
    }

    .meta .dots { overflow: hidden; text-wrap: auto; height: 1rem; }
    .meta .value { text-align: right; }
    .meta .value-session { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }

    .generated-by {
      padding-top: 25px;
      border-top: 1px dashed #999;
    }

    .actions { display: flex; justify-content: center; }

    .action-btn {
      background: #333;
      color: white;
      border: none;
      padding: 12px 24px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 16px;
      cursor: pointer;
      border-radius: 5px;
      transition: background 0.3s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn:hover { background: #000; }
    .action-btn:disabled { background: #666; cursor: not-allowed; }
    .action-btn.success { background: #2d5a27; }
    .action-btn.error { background: #8b2020; }

    @media print {
      body { background: white; }
      .receipt { box-shadow: none; width: 100%; }
      .actions { display: none; }
    }`;
  }

  private renderDailyLineItems(summary: import("../types/daily.js").DailySummary): string {
    let html = '<div style="margin: 20px 0;">';

    for (const model of summary.modelSummaries) {
      const sym = getCurrencySymbol(model.modelName);
      html += `<div class="model-header">
        <span class="model-name">${this.escapeHtml(model.displayName)}</span>
        <span class="model-cost">${formatCurrency(model.estimatedCost, sym)}</span>
      </div>`;

      html += `<div class="line-item">
        <span>  Input tokens</span>
        <span>${formatNumber(model.inputTokens)}</span>
      </div>`;

      html += `<div class="line-item">
        <span>  Output tokens</span>
        <span>${formatNumber(model.outputTokens)}</span>
      </div>`;

      if (model.cacheCreationTokens > 0) {
        html += `<div class="line-item">
          <span>  Cache write</span>
          <span>${formatNumber(model.cacheCreationTokens)}</span>
        </div>`;
      }

      if (model.cacheReadTokens > 0) {
        html += `<div class="line-item">
          <span>  Cache read</span>
          <span>${formatNumber(model.cacheReadTokens)}</span>
        </div>`;
      }
    }

    html += "</div>";
    return html;
  }

  /**
   * Escape HTML entities
   */
  private formatDayDuration(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
