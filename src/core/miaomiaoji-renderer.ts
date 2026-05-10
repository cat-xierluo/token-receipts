/**
 * MXW01 BLE thermal printer renderer.
 *
 * Flow: HTML receipt → Playwright screenshot at 384px → RGBA pixels → print via BLE.
 * Injects print-specific CSS overrides so fonts render at correct size on 384px paper.
 */

import { createRequire } from "module";
import { HtmlRenderer } from "./html-renderer.js";
import type { ReceiptData } from "./receipt-generator.js";

const require = createRequire(import.meta.url);
const PRINT_WIDTH = 384;
const TOTAL_TIMEOUT_MS = 60000;

/** CSS overrides injected before screenshot to fit 384px thermal paper */
const PRINT_CSS = `<style>
  body {
    background: #fff !important;
    padding: 0 !important;
    min-height: auto !important;
  }
  .receipt {
    width: ${PRINT_WIDTH}px !important;
    padding: 32px 6px 24px !important;
    font-size: 20px !important;
    font-weight: bold !important;
    box-shadow: none !important;
    background: #fff !important;
    border-radius: 0 !important;
    position: static !important;
  }
  .receipt * {
    font-weight: bold !important;
  }
  .logo {
    --logo-font-size: 16px !important;
    height: auto !important;
    margin-bottom: 8px !important;
  }
  .receipt-edge {
    position: static !important;
    width: 100% !important;
    height: 15px !important;
    overflow: hidden !important;
    background: repeating-linear-gradient(
      90deg,
      #000 0px, #000 10px,
      #fff 10px, #fff 20px
    ) !important;
  }
  .receipt-edge .stripe { display: none !important; }
  .receipt-container { gap: 0 !important; }
  .qr-section { visibility: collapse !important; }
  .qr-code, img[src^="data:image"] { display: none !important; }
  .generated-by { display: block !important; visibility: visible !important; }
  .generated-by {
    font-size: 15px !important;
    text-align: center !important;
    margin-top: 28px !important;
    padding-top: 16px !important;
  }
  .generated-by a { font-size: 15px !important; }
  .footer-message {
    margin: 30px 0 !important;
    padding: 8px 0 !important;
    line-height: 1.6 !important;
  }
  .meta .value { font-weight: bold !important; }
  .total { font-size: 22px !important; }
</style>`;

export class MiaoMiaoJiRenderer {
  private htmlRenderer = new HtmlRenderer();

  async printReceipt(
    data: ReceiptData,
    _portPath?: string,
    _printOptions?: { density?: number },
  ): Promise<void> {
    const html = await this.htmlRenderer.generateHtml(data, "");
    await this.printHtml(html);
  }

  async printHtml(html: string): Promise<void> {
    // Ensure quote author is on a new line
    html = html.replace(
      /(<div class="footer-message">)([^<]*)( — )([^<]*)(<\/div>)/g,
      "$1$2<br>— $4$5",
    );
    // Extract generated-by and move it before receipt-edge-bottom, then remove qr-section
    const genByMatch = html.match(
      /(<div class="generated-by">[\s\S]*?<\/div>)\s*<\/div>/,
    );
    if (genByMatch) {
      // Insert generated-by before the HTML receipt-edge-bottom element (identified by id)
      html = html.replace(
        /(<div class="receipt-edge receipt-edge-bottom" id="edge-bottom")/,
        genByMatch[1] + "\n$1",
      );
      // Remove the entire qr-section div (including img and old generated-by)
      html = html.replace(/<div class="qr-section">[\s\S]*?<\/div>\s*<\/div>/, "");
    }
    const imageData = await this.htmlToImageData(html);
    await this.sendToPrinter(imageData);
  }

  /**
   * Screenshot the .receipt element at PRINT_WIDTH using Playwright,
   * then extract grayscale RGBA pixels for thermal printing.
   */
  private async htmlToImageData(html: string): Promise<{
    data: Uint8ClampedArray;
    width: number;
    height: number;
  }> {
    const playwright = require("playwright") as typeof import("playwright");

    // Strip external scripts + inject print CSS overrides
    let cleanHtml = html.replace(
      /<script[^>]*src=['"].*?['"].*?<\/script>/g,
      "",
    );
    cleanHtml = cleanHtml.replace("</head>", `${PRINT_CSS}</head>`);

    const browser = await playwright.chromium.launch();

    try {
      const page = await browser.newPage();
      await page.setViewportSize({ width: PRINT_WIDTH, height: 1200 });
      await page.setContent(cleanHtml, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".receipt");

      const receiptEl = await page.$(".receipt");
      if (!receiptEl) throw new Error("No .receipt element found in HTML");

      const screenshotBuf = await receiptEl.screenshot({ type: "png" });
      const base64Png = screenshotBuf.toString("base64");
      await page.close();

      // Extract grayscale RGBA from screenshot
      const page2 = await browser.newPage();
      await page2.goto("about:blank");
      await page2.evaluate(`window.__pngB64 = "${base64Png}";`);

      const extractScript = `
        (async () => {
          const img = new Image();
          const loaded = new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Image load failed"));
          });
          img.src = "data:image/png;base64," + window.__pngB64;
          await loaded;

          const w = img.naturalWidth;
          const h = img.naturalHeight;
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, w, h);
          const pixels = imageData.data;

          for (let i = 0; i < w * h; i++) {
            const r = pixels[i * 4];
            const g = pixels[i * 4 + 1];
            const b = pixels[i * 4 + 2];
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            pixels[i * 4] = gray;
            pixels[i * 4 + 1] = gray;
            pixels[i * 4 + 2] = gray;
            pixels[i * 4 + 3] = 255;
          }

          return { data: Array.from(pixels), width: w, height: h };
        })()
      `;
      const result: { data: number[]; width: number; height: number } =
        await page2.evaluate(extractScript);
      await page2.close();

      return {
        data: new Uint8ClampedArray(result.data),
        width: result.width,
        height: result.height,
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * Send RGBA image data to MXW01 via BLE.
   */
  private async sendToPrinter(imageData: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  }): Promise<void> {
    const { ThermalPrinterClient, NodeBluetoothAdapter } = this.loadLibrary();

    const adapter = new NodeBluetoothAdapter();
    const printer = new ThermalPrinterClient(adapter);

    const timeout = setTimeout(() => {
      try { printer.dispose(); } catch { /* ignore */ }
    }, TOTAL_TIMEOUT_MS);

    try {
      await printer.connect();
      await printer.print(imageData, {
        dither: "steinberg",
        brightness: 120,
        intensity: 255,
      });
    } finally {
      clearTimeout(timeout);
      try { await printer.disconnect(); } catch { /* ignore */ }
    }
  }

  private loadLibrary() {
    try {
      const mod = require("mxw01-thermal-printer");
      return {
        ThermalPrinterClient: mod.ThermalPrinterClient as typeof import("mxw01-thermal-printer").ThermalPrinterClient,
        NodeBluetoothAdapter: mod.NodeBluetoothAdapter as typeof import("mxw01-thermal-printer").NodeBluetoothAdapter,
      };
    } catch {
      throw new Error(
        "mxw01-thermal-printer package is required.\n" +
          "Install it with: npm install mxw01-thermal-printer @stoprocent/noble\n" +
          "Then make sure your MXW01 printer is turned on and nearby.",
      );
    }
  }
}
