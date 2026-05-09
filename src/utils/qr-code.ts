import * as QRCode from "qrcode";

const GITHUB_URL = "https://github.com/cat-xierluo/token-receipts";

/**
 * Generate QR code as an SVG data URL for HTML embedding
 */
export async function generateQrDataUrl(
  url: string = GITHUB_URL,
): Promise<string> {
  const svgString = await QRCode.toString(url, {
    type: "svg",
    width: 120,
    margin: 1,
    color: { dark: "#333333", light: "#00000000" },
  });
  return `data:image/svg+xml;base64,${Buffer.from(svgString).toString("base64")}`;
}

/**
 * Generate QR code as UTF-8 text block for ASCII receipt
 */
export async function generateQrAscii(
  url: string = GITHUB_URL,
): Promise<string> {
  return QRCode.toString(url, {
    type: "utf8",
    margin: 2,
    scale: 1,
    errorCorrectionLevel: "L",
  });
}
