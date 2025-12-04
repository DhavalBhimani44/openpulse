import { db } from "@openpulse/db";
import { parseUserAgent, type DeviceInfo } from "./device-parser";
import { getGeoLocation } from "./geo";
import { anonymizeIP, getClientIP } from "./ip-anonymize";

export interface TrackingEvent {
  projectId: string;
  sessionId: string;
  url: string;
  referrer?: string;
  title?: string;
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
  timezone?: string;
}

export async function processEvent(
  event: TrackingEvent,
  headers: Headers
): Promise<void> {
  const ip = anonymizeIP(getClientIP(headers));
  const userAgent = event.userAgent || headers.get("user-agent") || "";

  // Parse device info
  const deviceInfo = parseUserAgent(userAgent);

  // Get geo location
  const geo = await getGeoLocation(ip);

  // Extract referrer domain
  let referrerDomain = null;
  if (event.referrer) {
    try {
      const referrerUrl = new URL(event.referrer);
      referrerDomain = referrerUrl.hostname;
    } catch {
      // Invalid URL, ignore
    }
  }

  // Parse URL
  let path = "/";
  try {
    const url = new URL(event.url);
    path = url.pathname + url.search;
  } catch {
    path = event.url;
  }

  // Upsert device
  const device = await db.device.upsert({
    where: {
      projectId_browser_os_deviceType_screenWidth_screenHeight: {
        projectId: event.projectId,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        deviceType: deviceInfo.deviceType,
        screenWidth: event.screenWidth || null,
        screenHeight: event.screenHeight || null,
      },
    },
    update: {
      updatedAt: new Date(),
    },
    create: {
      projectId: event.projectId,
      browser: deviceInfo.browser,
      browserVersion: deviceInfo.browserVersion,
      os: deviceInfo.os,
      osVersion: deviceInfo.osVersion,
      deviceType: deviceInfo.deviceType,
      screenWidth: event.screenWidth || null,
      screenHeight: event.screenHeight || null,
    },
  });

  // Upsert referrer
  let referrer = null;
  if (referrerDomain) {
    referrer = await db.referrer.upsert({
      where: {
        projectId_domain: {
          projectId: event.projectId,
          domain: referrerDomain,
        },
      },
      update: {
        updatedAt: new Date(),
      },
      create: {
        projectId: event.projectId,
        url: event.referrer,
        domain: referrerDomain,
      },
    });
  }

  // Upsert geo
  const geoRecord = await db.geo.upsert({
    where: {
      projectId_country_city: {
        projectId: event.projectId,
        country: geo.country,
        city: geo.city || null,
      },
    },
    update: {
      updatedAt: new Date(),
    },
    create: {
      projectId: event.projectId,
      country: geo.country,
      city: geo.city,
      region: geo.region,
      timezone: geo.timezone,
    },
  });

  // Create or update session
  const existingSession = await db.analyticsSession.findUnique({
    where: { sessionId: event.sessionId },
  });

  const now = new Date();
  let session;

  if (existingSession) {
    // Update existing session
    session = await db.analyticsSession.update({
      where: { sessionId: event.sessionId },
      data: {
        pageViews: { increment: 1 },
        exitPage: path,
        isBounce: false, // Multiple pageviews = not a bounce
        endedAt: null, // Reset end time
      },
    });
  } else {
    // Create new session
    session = await db.analyticsSession.create({
      data: {
        projectId: event.projectId,
        sessionId: event.sessionId,
        entryPage: path,
        exitPage: path,
        deviceId: device.id,
        referrerId: referrer?.id || null,
        geoId: geoRecord.id,
        pageViews: 1,
        isBounce: true,
      },
    });
  }

  // Create event
  await db.event.create({
    data: {
      projectId: event.projectId,
      sessionId: event.sessionId,
      type: "pageview",
      url: event.url,
      path,
      referrer: event.referrer || null,
      title: event.title || null,
      timestamp: now,
    },
  });
}

