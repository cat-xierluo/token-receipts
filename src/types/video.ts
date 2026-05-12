export interface VideoRenderOptions {
  typewriterSpeed?: number;
  format: "livephoto" | "video" | "gif";
  outputDir?: string;
  width?: number;
}

export interface VideoRenderResult {
  videoPath: string;
  stillPath?: string;
  contentId?: string;
}
