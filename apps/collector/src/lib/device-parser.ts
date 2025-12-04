import { UAParser } from "ua-parser-js";

export interface DeviceInfo {
  browser: string;
  browserVersion: string | null;
  os: string;
  osVersion: string | null;
  deviceType: "desktop" | "mobile" | "tablet";
}

export function parseUserAgent(userAgent: string): DeviceInfo {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browser = result.browser.name || "Unknown";
  const browserVersion = result.browser.version || null;
  const os = result.os.name || "Unknown";
  const osVersion = result.os.version || null;

  // Determine device type
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  if (result.device.type === "mobile") {
    deviceType = "mobile";
  } else if (result.device.type === "tablet") {
    deviceType = "tablet";
  } else if (result.device.type === "mobile" || /Mobile|Android|iPhone/i.test(userAgent)) {
    deviceType = "mobile";
  } else if (/Tablet|iPad/i.test(userAgent)) {
    deviceType = "tablet";
  }

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
  };
}

