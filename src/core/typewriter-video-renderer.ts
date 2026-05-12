import { existsSync, mkdirSync, mkdtempSync } from "fs";
import { createRequire } from "module";
import { homedir } from "os";
import { join } from "path";
import { HtmlRenderer } from "./html-renderer.js";
import type { ReceiptData } from "./receipt-generator.js";
import type {
  VideoRenderOptions,
  VideoRenderResult,
} from "../types/video.js";

const require = createRequire(import.meta.url);

const DEFAULT_WIDTH = 480;
const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;
const FPS = 24;
const SCALE_FACTOR = VIDEO_WIDTH / DEFAULT_WIDTH; // 2.25

const PAPER_FEED_CSS = `
<style>
  body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    min-height: ${VIDEO_HEIGHT}px;
  }
  .receipt {
    transform: translateY(100%);
  }
</style>
`;

export class TypewriterVideoRenderer {
  private htmlRenderer = new HtmlRenderer();

  async render(
    data: ReceiptData,
    options: VideoRenderOptions,
  ): Promise<VideoRenderResult> {
    const width = options.width || DEFAULT_WIDTH;

    const html = await this.htmlRenderer.generateHtml(data, "");

    let animHtml = html.replace("</head>", `${PAPER_FEED_CSS}</head>`);
    animHtml = animHtml.replace(
      /<script[^>]*src=['"].*?['"].*?<\/script>/g,
      "",
    );

    const playwright = require("playwright") as typeof import("playwright");
    const browser = await playwright.chromium.launch();

    try {
      // Pass 1: measure receipt height + first separator position at natural width
      const measurePage = await browser.newPage();
      await measurePage.setViewportSize({ width, height: 2000 });
      await measurePage.setContent(animHtml, {
        waitUntil: "domcontentloaded",
      });
      await measurePage.waitForSelector(".receipt");
      const measures: { receiptHeight: number; separatorTop: number } =
        await measurePage.evaluate(() => {
          const receipt = (globalThis as any).document.querySelector(".receipt");
          const receiptHeight = receipt
            ? Math.ceil(receipt.getBoundingClientRect().height)
            : 800;
          // Find the first model-header separator ("钢琴分块" divider)
          const sep = receipt
            ? receipt.querySelector(".model-header")
            : null;
          const receiptTop = receipt
            ? receipt.getBoundingClientRect().top
            : 0;
          const separatorTop = sep
            ? Math.ceil(sep.getBoundingClientRect().top - receiptTop)
            : 0;
          return { receiptHeight, separatorTop };
        });
      await measurePage.close();

      const { receiptHeight, separatorTop } = measures;

      const tmpDir = mkdtempSync(
        join(homedir(), ".token-receipts", "video-"),
      );
      const framesDir = join(tmpDir, "frames");
      mkdirSync(framesDir, { recursive: true });

      // Pass 2: capture frames on 1080×1920 canvas
      const page = await browser.newPage();
      await page.setViewportSize({ width: VIDEO_WIDTH, height: VIDEO_HEIGHT });

      const scaledHeight = Math.ceil(receiptHeight * SCALE_FACTOR);

      // Compute animation end: align first separator with viewport top.
      // Fall back to receipt-top alignment if no separator found.
      const startY = VIDEO_HEIGHT;
      let endY: number;
      if (separatorTop > 0) {
        // Align separator line with viewport top
        endY = -(separatorTop * SCALE_FACTOR);
      } else if (scaledHeight > VIDEO_HEIGHT) {
        endY = 0;
      } else {
        endY = VIDEO_HEIGHT - scaledHeight;
      }

      const canvasCss = `
        <style>
          body {
            margin: 0;
            padding: 0;
            width: ${VIDEO_WIDTH}px;
            height: ${VIDEO_HEIGHT}px;
            overflow: hidden;
            background: #3a3a3a;
            position: relative;
          }
          .receipt {
            position: absolute;
            left: 50%;
            margin-left: -${DEFAULT_WIDTH / 2}px;
            top: ${startY}px;
            transform: scale(${SCALE_FACTOR});
            transform-origin: top center;
          }
          .action-btn, #save-img-btn { display: none !important; }
        </style>
      `;
      let canvasHtml = html.replace("</head>", `${canvasCss}</head>`);
      canvasHtml = canvasHtml.replace(
        /<script[^>]*src=['"].*?['"].*?<\/script>/g,
        "",
      );

      await page.setContent(canvasHtml, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".receipt");

      // Animation ~4.5s + hold ~0.5s ≈ 5s
      const targetDurationMs = 4500;
      const totalAnimFrames = Math.ceil((targetDurationMs / 1000) * FPS);
      const holdFrames = Math.round(FPS * 0.5);
      const frameIntervalMs = Math.round(1000 / FPS);

      let frameIndex = 0;

      for (let i = 0; i < totalAnimFrames; i++) {
        const progress = i / (totalAnimFrames - 1);
        // Ease-in-out (cubic bezier): slow start, fast middle, slow end
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        const currentY = startY + (endY - startY) * eased;

        await page.evaluate(
          (ty) => {
            const el = (globalThis as any).document.querySelector(".receipt");
            if (el) el.style.top = `${ty}px`;
          },
          currentY,
        );

        await this.captureFrame(page, framesDir, frameIndex++);
        if (i < totalAnimFrames - 1) {
          await this.sleep(frameIntervalMs);
        }
      }

      for (let i = 0; i < holdFrames; i++) {
        await this.captureFrame(page, framesDir, frameIndex++);
        if (i < holdFrames - 1) {
          await this.sleep(frameIntervalMs);
        }
      }

      const stillPath = join(tmpDir, "still.jpg");
      await page.screenshot({
        type: "jpeg",
        quality: 95,
        path: stillPath,
      });

      await page.close();

      return {
        videoPath: "",
        stillPath: existsSync(stillPath) ? stillPath : undefined,
        _tmpDir: tmpDir,
        _framesDir: framesDir,
        _frameCount: frameIndex,
      } as VideoRenderResult & { _tmpDir: string; _framesDir: string; _frameCount: number };
    } finally {
      await browser.close();
    }
  }

  private async captureFrame(
    page: import("playwright").Page,
    framesDir: string,
    index: number,
  ): Promise<void> {
    const framePath = join(
      framesDir,
      `frame-${String(index).padStart(5, "0")}.png`,
    );
    await page.screenshot({ type: "png", path: framePath });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
