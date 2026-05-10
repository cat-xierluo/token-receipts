import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

export class SessionDiscoverer {
  private projectsDir: string;

  constructor(projectsDir?: string) {
    this.projectsDir = projectsDir ?? join(homedir(), ".claude", "projects");
  }

  async discoverSessions(targetDate: string): Promise<string[]> {
    const allFiles = await this.getAllJsonlFiles();
    return this.filterByMtime(allFiles, targetDate);
  }

  private async getAllJsonlFiles(): Promise<string[]> {
    const files: string[] = [];
    try {
      const entries = await readdir(this.projectsDir, {
        recursive: true,
        withFileTypes: true,
      });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".jsonl")) {
          files.push(join(entry.parentPath, entry.name));
        }
      }
    } catch {
      // projects dir doesn't exist yet
    }
    return files;
  }

  private async filterByMtime(
    files: string[],
    targetDate: string
  ): Promise<string[]> {
    const matches: string[] = [];
    const results = await Promise.allSettled(
      files.map(async (f) => {
        const s = await stat(f);
        return { path: f, mtime: s.mtime };
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        const d = r.value.mtime;
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (dateStr === targetDate) {
          matches.push(r.value.path);
        }
      }
    }
    return matches.sort();
  }

  async discoverMonthSessions(yearMonth: string): Promise<string[]> {
    const allFiles = await this.getAllJsonlFiles();
    return this.filterByMonth(allFiles, yearMonth);
  }

  private async filterByMonth(
    files: string[],
    yearMonth: string
  ): Promise<string[]> {
    const matches: string[] = [];
    const results = await Promise.allSettled(
      files.map(async (f) => {
        const s = await stat(f);
        return { path: f, mtime: s.mtime };
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        const d = r.value.mtime;
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (ym === yearMonth) {
          matches.push(r.value.path);
        }
      }
    }
    return matches.sort();
  }
}
