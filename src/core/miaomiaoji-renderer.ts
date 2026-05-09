/**
 * MXW01 BLE thermal printer renderer.
 *
 * Flow: HTML receipt → Playwright screenshot (full design width) →
 *       canvas resize to 384px → grayscale RGBA → print via BLE.
 * Renders at the HTML's native width first, then downscales to printer width
 * for crisp text on thermal paper.
 */

import { createRequire } from "module";
import { tmpdir } from "os";
import { join } from "path";
import { unlink } from "fs/promises";
import { HtmlRenderer } from "./html-renderer.js";
import type { ReceiptData } from "./receipt-generator.js";

const require = createRequire(import.meta.url);
const PRINT_WIDTH = 384;
const TOTAL_TIMEOUT_MS = 60000;

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
    const imageData = await this.htmlToImageData(html);
    await this.sendToPrinter(imageData);
  }

  /**
   * Screenshot the .receipt element at its design width using Playwright,
   * then downscale to PRINT_WIDTH (384px) and convert to grayscale RGBA.
   */
  private async htmlToImageData(html: string): Promise<{
    data: Uint8ClampedArray;
    width: number;
    height: number;
  }> {
    const playwright = require("playwright") as typeof import("playwright");

    // Strip external scripts to avoid page load timeout
    const cleanHtml = html.replace(
      /<script[^>]*src=['"].*?['"].*?<\/script>/g,
      "",
    );

    const browser = await playwright.chromium.launch();

    try {
      // Step 1: screenshot at design width (let CSS render at intended size)
      const page1 = await browser.newPage();
      await page1.setViewportSize({ width: 520, height: 1200 });
      await page1.setContent(cleanHtml, { waitUntil: "domcontentloaded" });
      await page1.waitForSelector(".receipt");

      const receiptEl = await page1.$(".receipt");
      if (!receiptEl) throw new Error("No .receipt element found in HTML");

      const box = await receiptEl.boundingBox();
      if (!box) throw new Error("Could not get receipt bounding box");
      const origWidth = Math.round(box.width);
      const origHeight = Math.round(box.height);
      await receiptEl.screenshot({ type: "png" });
      const screenshotBuf = await receiptEl.screenshot({ type: "png" });
      await page1.close();

      // Step 2: downscale to PRINT_WIDTH and extract grayscale RGBA
      const base64Png = screenshotBuf.toString("base64");
      const targetW = PRINT_WIDTH;
      const targetH = Math.round(origHeight * (PRINT_WIDTH / origWidth));

      const page2 = await browser.newPage();
      await page2.goto("about:blank");
      await page2.evaluate(`window.__pngB64 = "${base64Png}";`);
      await page2.evaluate(`window.__tw = ${targetW};`);
      await page2.evaluate(`window.__th = ${targetH};`);

      const extractScript = `
        (async () => {
          const img = new Image();
          const loaded = new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Image load failed"));
          });
          img.src = "data:image/png;base64," + window.__pngB64;
          await loaded;

          const w = window.__tw;
          const h = window.__th;
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);

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
        brightness: 140,
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
