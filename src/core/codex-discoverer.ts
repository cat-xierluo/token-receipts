import { readdir } from "fs/promises";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

export class CodexDiscoverer {
  private sessionsDir: string;
  private archivedDir: string;

  constructor(sessionsDir?: string) {
    const codexRoot = dirname(sessionsDir ?? join(homedir(), ".codex", "sessions"));
    this.sessionsDir = join(codexRoot, "sessions");
    this.archivedDir = join(codexRoot, "archived_sessions");
  }

  async discoverSessions(targetDate: string): Promise<string[]> {
    const [y, m, d] = targetDate.split("-");
    const dayDir = join(this.sessionsDir, y, m, d);

    const active = await this.readDir(dayDir);
    const archived = await this.filterArchived(targetDate);
    return [...active, ...archived].sort();
  }

  async discoverMonthSessions(yearMonth: string): Promise<string[]> {
    const [y, m] = yearMonth.split("-");
    const monthDir = join(this.sessionsDir, y, m);

    const active = await this.readMonthDir(monthDir);
    const archived = await this.filterArchivedMonth(yearMonth);
    return [...active, ...archived].sort();
  }

  private async readDir(dir: string): Promise<string[]> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      return entries
        .filter((e) => e.isFile() && e.name.endsWith(".jsonl"))
        .map((e) => join(dir, e.name));
    } catch {
      return [];
    }
  }

  private async readMonthDir(monthDir: string): Promise<string[]> {
    try {
      const files: string[] = [];
      const dayEntries = await readdir(monthDir, { withFileTypes: true });
      for (const dayDir of dayEntries) {
        if (!dayDir.isDirectory()) continue;
        const dayPath = join(monthDir, dayDir.name);
        const entries = await this.readDir(dayPath);
        files.push(...entries);
      }
      return files;
    } catch {
      return [];
    }
  }

  private async filterArchived(targetDate: string): Promise<string[]> {
    const files = await this.readDir(this.archivedDir);
    return files.filter((f) => this.extractDate(f) === targetDate);
  }

  private async filterArchivedMonth(yearMonth: string): Promise<string[]> {
    const files = await this.readDir(this.archivedDir);
    return files.filter((f) => this.extractDate(f).startsWith(yearMonth));
  }

  private extractDate(filePath: string): string {
    const match = filePath.match(/rollout-(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : "";
  }
}
