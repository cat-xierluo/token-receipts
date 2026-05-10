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

export const CLAUDE_LOGO = PROVIDER_LOGOS.anthropic;

export const SEPARATOR = "━".repeat(35);
export const LIGHT_SEPARATOR = "─".repeat(35);
