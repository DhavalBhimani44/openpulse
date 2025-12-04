import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const scriptPath = join(process.cwd(), "public", "tracker.js");
    const script = readFileSync(scriptPath, "utf-8");

    // Replace collector URL placeholder if needed
    const collectorUrl = process.env.COLLECTOR_URL || "/api/collect";
    const modifiedScript = script.replace(
      'window.OPENPULSE_COLLECTOR_URL || "/api/collect"',
      `"${collectorUrl}"`
    );

    return new NextResponse(modifiedScript, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving tracker script:", error);
    return new NextResponse("Error loading tracker script", { status: 500 });
  }
}

