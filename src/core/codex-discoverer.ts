import { readdir } from "fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

export class CodexDiscoverer {
  private sessionsDir: string;

  constructor(sessionsDir?: string) {
    this.sessionsDir = sessionsDir ?? join(homedir(), ".codex", "sessions");
  }

  async discoverSessions(targetDate: string): Promise<string[]> {
    const [y, m, d] = targetDate.split("-");
    const dayDir = join(this.sessionsDir, y, m, d);

    try {
      const entries = await readdir(dayDir, { withFileTypes: true });
      return entries
        .filter((e) => e.isFile() && e.name.endsWith(".jsonl"))
        .map((e) => join(dayDir, e.name))
        .sort();
    } catch {
      return [];
    }
  }
}
