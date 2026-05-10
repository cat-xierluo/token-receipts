import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  LOGO_BOX,
  PROVIDER_LOGOS,
  getLogoRenderData,
} from "../dist/utils/ascii-art.js";

const PROVIDERS = [
  "anthropic",
  "openai",
  "deepseek",
  "glm",
  "minimax",
  "qwen",
  "kimi",
  "unknown",
];

const DISPLAY_NAMES = {
  anthropic: "Anthropic / Claude",
  openai: "OpenAI",
  deepseek: "DeepSeek",
  glm: "Z.ai / GLM",
  minimax: "MiniMax",
  qwen: "Qwen",
  kimi: "Kimi",
  unknown: "Unknown fallback",
};

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const receiptRule = "━".repeat(LOGO_BOX.columns);

const renderReceiptPreview = (provider) => {
  const logo = getLogoRenderData(provider);
  const receiptBottom = [
    receiptRule,
    "          Location: Preview",
    `          Provider: ${provider}`,
    "─".repeat(LOGO_BOX.columns),
    "ITEM                 QTY      PRICE",
    "Input tokens       12,345    $0.12",
    "Output tokens       6,789    $0.34",
    receiptRule,
  ].join("\n");

  return `<article class="preview-card">
    <div class="provider">
      <h2>${escapeHtml(DISPLAY_NAMES[provider] ?? provider)}</h2>
      <div class="width">${logo.width} cols x ${logo.rows} rows · ${logo.fontSizePx}px</div>
    </div>
    <div class="receipt">
      <pre>${receiptRule}</pre>
      <div class="logo" style="${logo.style}">
        <pre class="logo-mark">${escapeHtml(logo.display)}</pre>
      </div>
      <pre>${escapeHtml(receiptBottom)}</pre>
    </div>
  </article>`;
};

const renderRawMark = (provider) => {
  const logo = getLogoRenderData(provider);

  return `<article class="raw-card">
    <div class="raw-title">${escapeHtml(DISPLAY_NAMES[provider] ?? provider)} · ${logo.width} cols x ${logo.rows} rows</div>
    <pre>${escapeHtml(PROVIDER_LOGOS[provider])}</pre>
  </article>`;
};

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASCII Logo Preview - token-receipts</title>
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      background: #2f2f2f;
      color: #222;
      font-family: "Courier New", Courier, monospace;
      padding: 32px;
    }

    .page {
      max-width: 1120px;
      margin: 0 auto;
    }

    .topbar {
      color: #f8f8f8;
      margin-bottom: 28px;
    }

    h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0;
    }

    .source {
      margin: 0;
      color: #d8d8d8;
      line-height: 1.5;
      font-size: 14px;
    }

    .source code {
      color: #fff;
      background: #1e1e1e;
      padding: 2px 5px;
      border-radius: 3px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
      gap: 28px;
      align-items: start;
    }

    .preview-card,
    .raw-gallery {
      background: #f8f8f8;
      box-shadow: 0 14px 40px rgba(0, 0, 0, 0.22);
    }

    .preview-card {
      padding: 18px 16px 22px;
    }

    .provider {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 10px;
      border-bottom: 1px dashed #aaa;
      padding-bottom: 8px;
    }

    .provider h2 {
      margin: 0;
      font-size: 16px;
      letter-spacing: 0;
    }

    .width {
      color: #666;
      font-size: 12px;
      white-space: nowrap;
    }

    .receipt {
      background: #f8f8f8;
      width: 480px;
      padding: 45px 20px;
      position: relative;
      color: #222;
      font-size: 20px;
      line-height: 1.25;
      margin: 0 auto;
      overflow: hidden;
    }

    .receipt pre,
    .raw-card pre {
      margin: 0;
      font-family: "Courier New", Courier, monospace;
      white-space: pre;
    }

    .receipt pre {
      font-size: inherit;
      line-height: inherit;
    }

    .logo {
      --logo-font-size: ${LOGO_BOX.baseFontSizePx}px;
      --logo-line-height: 1.2;
      --logo-scale: 1;
      width: ${LOGO_BOX.columns}ch;
      height: ${LOGO_BOX.heightPx}px;
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

    .raw-gallery {
      margin-top: 36px;
      padding: 24px;
    }

    .raw-gallery h2 {
      font-size: 18px;
      margin: 0 0 16px 0;
    }

    .raw-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .raw-card {
      border: 1px dashed #aaa;
      padding: 12px;
      min-height: 142px;
      overflow: hidden;
    }

    .raw-title {
      font-size: 13px;
      color: #555;
      margin-bottom: 8px;
    }

    .raw-card pre {
      font-size: 8px;
      line-height: 0.86;
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="topbar">
      <h1>ASCII Logo Preview</h1>
      <p class="source">
        Generated from <code>src/utils/ascii-art.ts</code>. Run <code>npm run preview:logos</code> after editing logo source data.
      </p>
    </header>

    <section class="grid">
      ${PROVIDERS.map(renderReceiptPreview).join("\n")}
    </section>

    <section class="raw-gallery">
      <h2>Raw ASCII Marks</h2>
      <div class="raw-grid">
        ${PROVIDERS.map(renderRawMark).join("\n")}
      </div>
    </section>
  </main>
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

    fitAsciiLogos();
    window.addEventListener('load', fitAsciiLogos);
  </script>
</body>
</html>
`;

await writeFile(resolve("docs/ascii-logo-preview.html"), html);
console.log("Generated docs/ascii-logo-preview.html");
