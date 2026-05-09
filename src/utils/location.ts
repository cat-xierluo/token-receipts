import type { ReceiptConfig } from "../types/config.js";

interface GeoResult {
  status: string;
  city: string;
  regionName: string;
  country: string;
}

export class LocationDetector {
  /**
   * Get location string from config or geolocation
   */
  async getLocation(config: ReceiptConfig): Promise<string> {
    // Priority 1: Config file
    if (config.location) {
      return config.location;
    }

    // Priority 2: IP geolocation
    try {
      const location = await this.detectLocationFromIP();
      if (location) {
        return location;
      }
    } catch {
      // Silent fail, use fallback
    }

    // Priority 3: Fallback
    return "The Cloud";
  }

  /**
   * Detect location from public IP using ip-api.com
   */
  private async detectLocationFromIP(): Promise<string | null> {
    try {
      const response = await fetch("http://ip-api.com/json/?lang=en", {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return null;

      const geo = (await response.json()) as GeoResult;
      if (geo.status !== "success") return null;

      const parts = [geo.country, geo.city].filter(Boolean);
      return parts.join(" ") || null;
    } catch {
      return null;
    }
  }
}
