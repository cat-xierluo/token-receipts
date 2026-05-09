/**
 * Renders ASCII text into a 384-dot-wide 1-bit bitmap for thermal printing.
 *
 * Uses the embedded bitmap font with configurable scale.
 * At scale=2 (default): each 5x7 glyph becomes 10x14, much more readable.
 * 35 chars × 10px = 350px, centered in 384px.
 */

import {
  getGlyph,
  CHAR_WIDTH,
  CHAR_SPACING,
  GLYPH_ROWS,
  CHAR_HEIGHT,
} from "./bitmap-font.js";

const PRINT_WIDTH = 384;
const BYTES_PER_ROW = PRINT_WIDTH / 8; // 48

const TOP_PADDING_ROWS = 16;
const BOTTOM_PADDING_ROWS = 16;

export class BitmapRenderer {
  private scale: number;

  constructor(scale: number = 2) {
    this.scale = scale;
  }

  /**
   * Render ASCII receipt text into a 384px-wide 1-bit bitmap buffer.
   */
  renderText(text: string): Buffer {
    const lines = text.split("\n");
    const lineHeight = (CHAR_HEIGHT + 1) * this.scale;
    const totalRows =
      TOP_PADDING_ROWS + lines.length * lineHeight + BOTTOM_PADDING_ROWS;

    const bitmap = Buffer.alloc(BYTES_PER_ROW * totalRows, 0x00);

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const startRow = TOP_PADDING_ROWS + lineIdx * lineHeight;
      this.renderLine(bitmap, line, startRow, totalRows);
    }

    return bitmap;
  }

  private renderLine(
    bitmap: Buffer,
    line: string,
    startRow: number,
    totalRows: number,
  ): void {
    const scaledCharWidth = CHAR_WIDTH * this.scale;
    const scaledSpacing = CHAR_SPACING * this.scale;
    const pixelsUsed =
      line.length * (scaledCharWidth + scaledSpacing) - scaledSpacing;
    const xOffset = Math.max(
      0,
      Math.floor((PRINT_WIDTH - pixelsUsed) / 2),
    );

    for (let ci = 0; ci < line.length; ci++) {
      const charCode = line.charCodeAt(ci);
      const glyph = getGlyph(charCode);
      const charX = xOffset + ci * (scaledCharWidth + scaledSpacing);

      for (let glyphRow = 0; glyphRow < GLYPH_ROWS; glyphRow++) {
        const glyphBits = glyph[glyphRow];

        for (let col = 0; col < CHAR_WIDTH; col++) {
          const bit = (glyphBits >> (CHAR_WIDTH - 1 - col)) & 1;
          if (!bit) continue;

          // Fill the scaled pixel block
          for (let sy = 0; sy < this.scale; sy++) {
            const bitmapRow = startRow + glyphRow * this.scale + sy;
            if (bitmapRow >= totalRows) break;

            for (let sx = 0; sx < this.scale; sx++) {
              const pixelX = charX + col * this.scale + sx;
              if (pixelX >= PRINT_WIDTH) break;

              const byteIdx = bitmapRow * BYTES_PER_ROW + Math.floor(pixelX / 8);
              const bitIdx = 7 - (pixelX % 8);
              bitmap[byteIdx] |= 1 << bitIdx;
            }
          }
        }
      }
    }
  }

  async saveAsPBM(bitmap: Buffer, filePath: string): Promise<void> {
    const fs = await import("fs/promises");
    const height = bitmap.length / BYTES_PER_ROW;
    const header = `P4\n${PRINT_WIDTH} ${height}\n`;
    const headerBuf = Buffer.from(header, "ascii");
    const fileContent = Buffer.concat([headerBuf, bitmap]);
    await fs.writeFile(filePath, fileContent);
  }
}

export { PRINT_WIDTH, BYTES_PER_ROW };
