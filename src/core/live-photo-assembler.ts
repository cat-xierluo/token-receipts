import { existsSync, readdirSync, rmSync } from "fs";
import { copyFile, mkdir, rename, rm } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";

interface AssembleOptions {
  framesDir: string;
  frameCount: number;
  stillPath?: string;
  outputDir: string;
  basename: string;
  format: "livephoto" | "video" | "gif";
  fps?: number;
  keepTmp?: boolean;
  tmpDir?: string;
}

interface AssembleResult {
  videoPath: string;
  stillPath?: string;
}

export class LivePhotoAssembler {
  async assemble(options: AssembleOptions): Promise<AssembleResult> {
    const { format, outputDir } = options;
    await mkdir(outputDir, { recursive: true });

    switch (format) {
      case "livephoto":
        return this.assembleLivePhoto(options);
      case "video":
        return this.assembleVideo(options);
      case "gif":
        return this.assembleGif(options);
    }
  }

  /**
   * Live Photo: frames → MOV + JPEG → makelive --pvt → only .pvt output
   */
  private async assembleLivePhoto(options: AssembleOptions): Promise<AssembleResult> {
    const { outputDir, basename, stillPath, fps = 24 } = options;

    // Work in outputDir — makelive creates .pvt alongside source files
    const movPath = join(outputDir, `${basename}.mov`);
    const jpgPath = join(outputDir, `${basename}.jpg`);
    const pvtPath = join(outputDir, `${basename}.pvt`);

    // Remove old outputs if exist
    for (const p of [movPath, jpgPath]) {
      if (existsSync(p)) await rm(p);
    }
    if (existsSync(pvtPath)) rmSync(pvtPath, { recursive: true });

    // Frames → MOV via ffmpeg
    await this.framesToVideo(options.framesDir, movPath, fps);

    // Copy still as JPEG cover
    if (stillPath && existsSync(stillPath)) {
      await copyFile(stillPath, jpgPath);
    } else {
      this.run("ffmpeg", [
        "-y", "-i", join(options.framesDir, "frame-00000.png"),
        "-q:v", "2", jpgPath,
      ]);
    }

    let usedPvt = false;

    // Use makelive --pvt to create .pvt package
    try {
      this.run("makelive", ["--pvt", "--manual", jpgPath, movPath]);
      usedPvt = existsSync(pvtPath);
    } catch {
      // Fallback: just write metadata to files
      try {
        this.run("makelive", ["--manual", jpgPath, movPath]);
      } catch {
        // makelive not installed — files stay as-is
      }
    }

    // If .pvt was created, remove the loose .jpg and .mov
    if (usedPvt) {
      if (existsSync(jpgPath)) await rm(jpgPath);
      if (existsSync(movPath)) await rm(movPath);
    }

    // Cleanup temp frames
    if (!options.keepTmp && options.tmpDir) {
      await rm(options.tmpDir, { recursive: true, force: true });
    }

    return {
      videoPath: usedPvt ? pvtPath : movPath,
      stillPath: usedPvt ? undefined : jpgPath,
    };
  }

  /**
   * MP4 video: frames → MP4 (H.264)
   */
  private async assembleVideo(options: AssembleOptions): Promise<AssembleResult> {
    const { outputDir, basename, fps = 24 } = options;
    const mp4Path = join(outputDir, `${basename}.mp4`);

    await this.framesToVideo(options.framesDir, mp4Path, fps);

    if (!options.keepTmp && options.tmpDir) {
      await rm(options.tmpDir, { recursive: true, force: true });
    }

    return { videoPath: mp4Path };
  }

  /**
   * Animated GIF: frames → GIF (two-pass palette)
   */
  private async assembleGif(options: AssembleOptions): Promise<AssembleResult> {
    const { outputDir, basename, framesDir, tmpDir } = options;
    const palettePath = join(tmpDir || outputDir, "palette.png");
    const gifPath = join(outputDir, `${basename}.gif`);

    // Pass 1: generate palette
    this.run("ffmpeg", [
      "-y",
      "-framerate", "15",
      "-i", join(framesDir, "frame-%05d.png"),
      "-vf", "fps=15,scale=1080:-1:flags=lanczos,palettegen",
      palettePath,
    ]);

    // Pass 2: apply palette
    this.run("ffmpeg", [
      "-y",
      "-framerate", "15",
      "-i", join(framesDir, "frame-%05d.png"),
      "-i", palettePath,
      "-filter_complex", "fps=15,scale=1080:-1:flags=lanczos[x];[x][1:v]paletteuse",
      gifPath,
    ]);

    if (!options.keepTmp && options.tmpDir) {
      await rm(options.tmpDir, { recursive: true, force: true });
    }

    return { videoPath: gifPath };
  }

  /**
   * Convert frame PNGs to video (MOV or MP4) via ffmpeg
   */
  private async framesToVideo(
    framesDir: string,
    outputPath: string,
    fps: number,
  ): Promise<void> {
    this.run("ffmpeg", [
      "-y",
      "-hide_banner",
      "-loglevel", "error",
      "-framerate", String(fps),
      "-i", join(framesDir, "frame-%05d.png"),
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "18",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      outputPath,
    ]);
  }

  private run(cmd: string, args: string[]): void {
    const result = execSync(`${cmd} ${args.map((a) => `"${a}"`).join(" ")}`, {
      encoding: "utf-8",
      timeout: 60000,
      stdio: ["pipe", "pipe", "pipe"],
    });
  }
}
