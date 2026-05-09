/**
 * ASCII art headers for receipts — one per provider
 */

import type { Provider } from "./model-pricing.js";

const LOGOS: Record<Provider, string> = {
  anthropic: `     ▐▛███▜▌
    ▝▜█████▛▘
      ▘▘ ▝▝   `,
  openai: `     ┌──○──┐
     │  ⬡  │
     └─────┘`,
  deepseek: `     ╭─────╮
     │ D/S │
     ╰─────╯`,
  glm: `     ┌─────┐
     │ GLM │
     └─────┘`,
  minimax: `     ╭─────╮
     │ M/M │
     ╰─────╯`,
  qwen: `     ┌─────┐
     │ 通义 │
     └─────┘`,
  kimi: `     ┌─────┐
     │ KIM │
     └─────┘`,
  unknown: `     ╭─────╮
     │ AI  │
     ╰─────╯`,
};

export function getHeader(provider: Provider = "anthropic"): string {
  return LOGOS[provider] ?? LOGOS.unknown;
}

export const CLAUDE_LOGO = LOGOS.anthropic;

export const SEPARATOR = "━".repeat(35);
export const LIGHT_SEPARATOR = "─".repeat(35);
