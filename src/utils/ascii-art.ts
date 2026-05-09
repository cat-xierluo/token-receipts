/**
 * Monospace receipt headers, one per model provider.
 *
 * These are compact, black-and-white sketches based on each provider's public
 * logo/icon shape. Keep them small enough for the 35-character receipt width.
 */

import type { Provider } from "./model-pricing.js";

const logo = (lines: string[]): string => lines.join("\n");

export const PROVIDER_LOGOS: Record<Provider, string> = {
  anthropic: logo([
    "     ▐▛███▜▌",
    "    ▝▜█████▛▘",
    "      ▘▘ ▝▝   ",
  ]),
  openai: logo([
    "      ╭──╮",
    "    ╭─╯  ╰─╮",
    "   ╭╯ ╭──╮ ╰╮",
    "   ╰─╮╰──╯╭─╯",
    "     ╰────╯",
  ]),
  deepseek: logo([
    "      __╭╮",
    "   ___╱  ╰╮",
    "  ╱  ◉    │",
    "  ╲__╱╲___╯",
  ]),
  glm: logo([
    "     ╱╱╱╱",
    "       ╱",
    "     ╱╱╱",
  ]),
  minimax: logo([
    "    ╭╮  ╭╮  ╭╮",
    "  ╭─╯│  ││  │╰─╮",
    "  │ ╭╯  │╰╮ ╰╮ │",
    "  ╰─╯   ╰─╯  ╰─╯",
  ]),
  qwen: logo([
    "      ╭╲__╱╮",
    "   ╭──╯    ╰──╮",
    "   ╰──╮    ╭──╯",
    "      ╰╱__╲╯",
  ]),
  kimi: logo([
    "     ╭────╮",
    "     │ K •│",
    "     ╰────╯",
  ]),
  unknown: logo([
    "     ╭─────╮",
    "     │ AI  │",
    "     ╰─────╯",
  ]),
};

export function getHeader(provider: Provider = "anthropic"): string {
  return PROVIDER_LOGOS[provider] ?? PROVIDER_LOGOS.unknown;
}

export const CLAUDE_LOGO = PROVIDER_LOGOS.anthropic;

export const SEPARATOR = "━".repeat(35);
export const LIGHT_SEPARATOR = "─".repeat(35);
