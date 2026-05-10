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

  async discoverMonthSessions(yearMonth: string): Promise<string[]> {
    const [y, m] = yearMonth.split("-");
    const monthDir = join(this.sessionsDir, y, m);

    try {
      const files: string[] = [];
      const dayEntries = await readdir(monthDir, { withFileTypes: true });
      for (const dayDir of dayEntries) {
        if (!dayDir.isDirectory()) continue;
        const dayPath = join(monthDir, dayDir.name);
        try {
          const entries = await readdir(dayPath, { withFileTypes: true });
          for (const e of entries) {
            if (e.isFile() && e.name.endsWith(".jsonl")) {
              files.push(join(dayPath, e.name));
            }
          }
        } catch {
          // skip unreadable day dirs
        }
      }
      return files.sort();
    } catch {
      return [];
    }
  }
}
