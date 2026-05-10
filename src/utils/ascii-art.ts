/**
 * Monospace receipt headers, one per model provider.
 *
 * These are compact, black-and-white block reductions of the providers'
 * icon shapes. They intentionally follow the Claude Code thermal printer mark:
 * low-resolution silhouettes made from CP437-friendly block characters.
 */

import type { Provider } from "./model-pricing.js";

const logo = (lines: string[]): string => lines.join("\n");
const RECEIPT_WIDTH = 35;
const LOGO_BOX_WIDTH_PX = 420;
const LOGO_BOX_HEIGHT_PX = 120;
const LOGO_BASE_FONT_SIZE_PX = 20;
const MONOSPACE_CHAR_WIDTH_RATIO = 0.62;
const LOGO_SCALE_GUTTER = 0.94;

const PROVIDER_LINE_HEIGHT: Partial<Record<Provider, number>> = {
  anthropic: 1.2,
  openai: 0.78,
  deepseek: 0.82,
  glm: 0.9,
  minimax: 0.78,
  qwen: 0.7,
  kimi: 0.72,
  unknown: 1,
};

export const LOGO_BOX = {
  columns: RECEIPT_WIDTH,
  widthPx: LOGO_BOX_WIDTH_PX,
  heightPx: LOGO_BOX_HEIGHT_PX,
  baseFontSizePx: LOGO_BASE_FONT_SIZE_PX,
};

const centerLine = (line: string): string => {
  const padding = Math.max(0, RECEIPT_WIDTH - Array.from(line).length);
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return `${" ".repeat(left)}${line}${" ".repeat(right)}`;
};

const centerLogo = (mark: string): string =>
  mark
    .split("\n")
    .map((line) => centerLine(line.trimEnd()))
    .join("\n");

const lineWidth = (line: string): number => Array.from(line).length;

const centerLogoToLocalWidth = (mark: string): string => {
  const lines = mark.split("\n").map((line) => line.trimEnd());
  const width = Math.max(...lines.map(lineWidth));

  return lines
    .map((line) => {
      const padding = Math.max(0, width - lineWidth(line));
      return `${" ".repeat(Math.floor(padding / 2))}${line}`;
    })
    .join("\n");
};

const getDisplayLogo = (provider: Provider, raw: string): string => {
  if (provider === "anthropic") return centerLogoToLocalWidth(raw);
  return raw;
};

export interface LogoRenderData {
  provider: Provider;
  raw: string;
  display: string;
  centered: string;
  width: number;
  rows: number;
  fontSizePx: number;
  lineHeight: number;
  scale: number;
  style: string;
}

export const CLAUDE_CODE_LOGO_LINES = [
  "▐██████████▌",
  "▐██ ████ ██▌",
  "▐██████████████▌",
  "▐██████████▌",
  "▀ ▀  ▀ ▀",
];

export const PROVIDER_LOGOS: Record<Provider, string> = {
  anthropic: logo(CLAUDE_CODE_LOGO_LINES),
  openai: logo([
    "        ▗▄█████▙▄",
    "      ▗▟█▛▀▀▀▀▀▜███████▄▖",
    "     ▗██▘   ▗▄███▀▀▀▀▀▀██▙▖",
    "   ▗▄▟█▌  ▄███▀▘  ▗▄▖   ▀██▖",
    " ▗▟████▌ ▐██▘  ▗▄█████▄▖ ▐█▌",
    "▗██▀ ██▌ ▐█▙▗▄███▛▘ ▝▀███▟█▛",
    "▟█▌  ██▌ ▐████▀▀███▄▖  ▝▀██▙▖",
    "██   ██▌ ▐█▛▘    ▝▜███▄▖  ▀██▖",
    "▜█▌  ▜██▄▟█▌      ▐█▛▀██▙  ▐█▙",
    "▝██▄  ▝▀███▙▖    ▗▟█▌ ▐██   ██",
    " ▝▜██▄▖  ▝▀███▄▄████▌ ▐██  ▐█▛",
    "  ▟█▛███▄▖ ▗▟███▀▘▜█▌ ▐██ ▄██▘",
    "  ▐█▌ ▝▀█████▀▘  ▗██▌ ▐████▛▘",
    "  ▝██▖   ▝▀▘  ▗▄███▀  ▐█▛▀▘",
    "   ▝▜██▄▄▄▄▄▄███▀▘   ▗██▘",
    "     ▝▀███████▙▄▄▄▄▄▟█▛▘",
    "             ▀▜█████▀▘",
  ]),
  deepseek: logo([
    "      ▗▄▄▄▄▄▄██▖   █▙",
    "   ▄██████████▙   ▐███▄ ▄▄▄█",
    " ▗██████████████▄  █████████",
    "▗█████████████████▖▝▜██████▘",
    "▟██▀▜███████████████▄███▀▘",
    "██▌    ▝▀███████▛▜██████",
    "███       ▀█████▙ ▜████▌",
    "▐██▙       ▝▜██████████",
    " ███▙    ▗▖  ▜████████▘",
    " ▝▜███▄  ▜██▄ ▀█████▛",
    "   ▀██████████▙▄██████▌",
    "     ▀▜█████████▀▘▝▀▀▀",
  ]),
  glm: logo([
    "██████████████████",
    "██████████████████",
    "",
    "             █████",
    "           █████",
    "         █████",
    "       █████",
    "     █████",
    "   █████",
    "",
    "██████████████████",
    "██████████████████",
  ]),
  minimax: logo([
    "           ▗████▖  ▄███▙▖",
    "           ██  ██  ██ ▐█▌",
    "           ██  ██  ██ ▐█▌",
    "    ▄▟█▙▖  ██  ██  ██ ▐█▌  ▄▟█▙▖",
    "   ▐█▛ ▜█▖ ██  ██  ██ ▐█▌ ▐█▛▝▜█",
    "▗  ▐█▌ ▐█▌ ██  ██  ██ ▐█▌ ▐█▌ ▐█",
    "█▌ ▐█▌ ▐█▌ ██  ██  ██ ▐█▌ ▐█▌ ▐█",
    "██▄▟█▘ ▐█▌ ██  ██  ██ ▐█▌ ▐█▌ ▐█",
    " ▀▀▀▘  ▐█▌ ██  ██  ██ ▐█▌ ▐█▌ ▐█",
    "       ▐█▌ ██  ▝▘  ██ ▐█▌ ▐█▌ ▝▀",
    "       ▐█▌ ▟█  ██  ██  ▀███▀",
    "        ▜███▀  ██  ██",
    "               ▀████▘",
  ]),
  qwen: logo([
    "          ▗██████▖",
    "         ▗█▘▝█████▖",
    "        ▗█▘  ▐█████████████▙",
    "       ▗█▘   ▟██████████████▙",
    "  ▄█████▘   ▟████████████████▙",
    " ▟██▖                      ▗█▘",
    "▟████▖                     █▘",
    "▜█████▖    ▜████████▛      ▜▖",
    " ▜█████▖    ▜██████▛        ▜▖",
    "  ▜█████▖    ▜████▛    ▗█▖   ▜▖",
    "   ▜█████▖    ▜██▛    ▗███▖   ▜▄",
    "   ▗██████▖    ▜▛    ▗█████████▛",
    "  ▗████████▖        ▗█████████▛",
    "  ▜████▀▀▀▀▘       ▗█████████▛",
    "   ▜██▘           ▗█████▛",
    "    ▜█████████▖  ▗█████▛",
    "             ▝█▖▗█████▛",
    "              ▝██████▛",
  ]),
  kimi: logo([
    "              ▗██▙",
    "              ▐███",
    "▄▄▖      ▗▄▄▄▖▝█▛▘",
    "███     ▄███▛",
    "███    ▟███▘",
    "███  ▗████▘",
    "███ ▗███▛",
    "███▟███▀",
    "███████▙▖",
    "█████████▄",
    "███▛▘ ▜████▄",
    "███    ▝▜████▄",
    "███      ▀████",
    "███        ▀██",
  ]),
  unknown: logo([
    "   ▄██████▄",
    "  ██  ██  ██",
    "  ██  ██  ██",
    "   ▀██████▀",
  ]),
};

export function getHeader(provider: Provider = "anthropic"): string {
  return centerLogo(PROVIDER_LOGOS[provider] ?? PROVIDER_LOGOS.unknown);
}

export function getLogoRenderData(provider: Provider = "anthropic"): LogoRenderData {
  const resolvedProvider = PROVIDER_LOGOS[provider] ? provider : "unknown";
  const raw = PROVIDER_LOGOS[resolvedProvider];
  const lines = raw.split("\n");
  const width = Math.max(...lines.map(lineWidth));
  const rows = lines.length;
  const lineHeight = PROVIDER_LINE_HEIGHT[resolvedProvider] ?? 0.85;
  const widthFitPx =
    width > 0
      ? LOGO_BOX_WIDTH_PX / (width * MONOSPACE_CHAR_WIDTH_RATIO)
      : LOGO_BASE_FONT_SIZE_PX;
  const heightFitPx =
    rows > 0
      ? LOGO_BOX_HEIGHT_PX / (rows * lineHeight)
      : LOGO_BASE_FONT_SIZE_PX;
  const estimatedFit = Math.min(
    1,
    widthFitPx / LOGO_BASE_FONT_SIZE_PX,
    heightFitPx / LOGO_BASE_FONT_SIZE_PX,
  );
  const scale =
    estimatedFit < 1
      ? Math.max(0.1, Math.floor(estimatedFit * LOGO_SCALE_GUTTER * 1000) / 1000)
      : 1;
  const fontSizePx = Math.floor(LOGO_BASE_FONT_SIZE_PX * scale * 100) / 100;

  return {
    provider: resolvedProvider,
    raw,
    display: getDisplayLogo(resolvedProvider, raw),
    centered: getHeader(resolvedProvider),
    width,
    rows,
    fontSizePx,
    lineHeight,
    scale,
    style: `--logo-font-size:${LOGO_BASE_FONT_SIZE_PX}px;--logo-line-height:${lineHeight};--logo-scale:${scale};`,
  };
}

export const CLAUDE_LOGO = PROVIDER_LOGOS.anthropic;

export const SEPARATOR = "━".repeat(35);
export const LIGHT_SEPARATOR = "─".repeat(35);
