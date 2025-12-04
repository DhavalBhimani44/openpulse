import { router, projectProcedure } from "../server";
import { z } from "zod";
import { startOfDay, endOfDay, subDays } from "date-fns";

const dateRangeSchema = z.object({
  projectId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  days: z.enum(["7", "30", "90", "all"]).optional(),
});

function getDateRange(input: z.infer<typeof dateRangeSchema>) {
  const now = new Date();
  let start: Date;
  let end: Date = endOfDay(now);

  if (input.days === "7") {
    start = startOfDay(subDays(now, 7));
  } else if (input.days === "30") {
    start = startOfDay(subDays(now, 30));
  } else if (input.days === "90") {
    start = startOfDay(subDays(now, 90));
  } else if (input.startDate && input.endDate) {
    start = startOfDay(input.startDate);
    end = endOfDay(input.endDate);
  } else {
    // Default to 30 days
    start = startOfDay(subDays(now, 30));
  }

  return { start, end };
}

export const metricsRouter = router({
  getOverview: projectProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const { start, end } = getDateRange(input);

    const [sessions, pageviews, bounceRate, avgDuration] = await Promise.all([
      // Unique visitors (unique sessions)
      ctx.db.analyticsSession.count({
        where: {
          projectId: input.projectId,
          startedAt: {
            gte: start,
            lte: end,
          },
        },
      }),

      // Total pageviews
      ctx.db.event.count({
        where: {
          projectId: input.projectId,
          type: "pageview",
          timestamp: {
            gte: start,
            lte: end,
          },
        },
      }),

      // Bounce rate (sessions with only 1 pageview)
      ctx.db.analyticsSession.count({
        where: {
          projectId: input.projectId,
          startedAt: {
            gte: start,
            lte: end,
          },
          pageViews: 1,
        },
      }),

      // Average session duration
      ctx.db.analyticsSession.aggregate({
        where: {
          projectId: input.projectId,
          startedAt: {
            gte: start,
            lte: end,
          },
          duration: {
            not: null,
          },
        },
        _avg: {
          duration: true,
        },
      }),
    ]);

    const totalSessions = sessions;
    const bounceRatePercent = totalSessions > 0 ? (bounceRate / totalSessions) * 100 : 0;
    const avgDurationSeconds = avgDuration._avg.duration || 0;

    return {
      visitors: totalSessions,
      pageviews,
      bounceRate: Math.round(bounceRatePercent * 100) / 100,
      avgSessionDuration: Math.round(avgDurationSeconds),
    };
  }),

  getPageviews: projectProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const { start, end } = getDateRange(input);

    const pageviews = await ctx.db.event.groupBy({
      by: ["timestamp"],
      where: {
        projectId: input.projectId,
        type: "pageview",
        timestamp: {
          gte: start,
          lte: end,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    return pageviews.map((pv) => ({
      date: pv.timestamp,
      count: pv._count.id,
    }));
  }),

  getRealtimeVisitors: projectProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const activeSessions = await ctx.db.analyticsSession.count({
        where: {
          projectId: input.projectId,
          startedAt: {
            gte: fiveMinutesAgo,
          },
          endedAt: null,
        },
      });

      return {
        count: activeSessions,
        timestamp: new Date(),
      };
    }),

  getTopPages: projectProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const { start, end } = getDateRange(input);

    const topPages = await ctx.db.event.groupBy({
      by: ["path"],
      where: {
        projectId: input.projectId,
        type: "pageview",
        timestamp: {
          gte: start,
          lte: end,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    return topPages.map((page) => ({
      path: page.path,
      views: page._count.id,
    }));
  }),

  getEntryPages: projectProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const { start, end } = getDateRange(input);

    const entryPages = await ctx.db.analyticsSession.groupBy({
      by: ["entryPage"],
      where: {
        projectId: input.projectId,
        startedAt: {
          gte: start,
          lte: end,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    return entryPages.map((page) => ({
      path: page.entryPage,
      sessions: page._count.id,
    }));
  }),

  getExitPages: projectProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const { start, end } = getDateRange(input);

    const exitPages = await ctx.db.analyticsSession.groupBy({
      by: ["exitPage"],
      where: {
        projectId: input.projectId,
        startedAt: {
          gte: start,
          lte: end,
        },
        exitPage: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    return exitPages.map((page) => ({
      path: page.exitPage || "",
      sessions: page._count.id,
    }));
  }),

  getCountries: projectProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const { start, end } = getDateRange(input);

    const countries = await ctx.db.analyticsSession.groupBy({
      by: ["geoId"],
      where: {
        projectId: input.projectId,
        startedAt: {
          gte: start,
          lte: end,
        },
        geoId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 20,
    });

    // Fetch geo data for each geoId
    const geoIds = countries.map((c) => c.geoId).filter((id): id is string => id !== null);
    const geoData = await ctx.db.geo.findMany({
      where: {
        id: {
          in: geoIds,
        },
      },
    });

    const geoMap = new Map(geoData.map((g) => [g.id, g]));

    return countries
      .map((c) => {
        const geo = c.geoId ? geoMap.get(c.geoId) : null;
        return {
          country: geo?.country || "Unknown",
          visitors: c._count.id,
        };
      })
      .filter((c) => c.country !== "Unknown");
  }),

  getCities: projectProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const { start, end } = getDateRange(input);

    const cities = await ctx.db.analyticsSession.groupBy({
      by: ["geoId"],
      where: {
        projectId: input.projectId,
        startedAt: {
          gte: start,
          lte: end,
        },
        geoId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 20,
    });

    const geoIds = cities.map((c) => c.geoId).filter((id): id is string => id !== null);
    const geoData = await ctx.db.geo.findMany({
      where: {
        id: {
          in: geoIds,
        },
      },
    });

    const geoMap = new Map(geoData.map((g) => [g.id, g]));

    return cities
      .map((c) => {
        const geo = c.geoId ? geoMap.get(c.geoId) : null;
        return {
          city: geo?.city || "Unknown",
          country: geo?.country || "Unknown",
          visitors: c._count.id,
        };
      })
      .filter((c) => c.city !== "Unknown");
  }),

  getBrowsers: projectProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const { start, end } = getDateRange(input);

    const browsers = await ctx.db.analyticsSession.groupBy({
      by: ["deviceId"],
      where: {
        projectId: input.projectId,
        startedAt: {
          gte: start,
          lte: end,
        },
        deviceId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    const deviceIds = browsers.map((b) => b.deviceId).filter((id): id is string => id !== null);
    const devices = await ctx.db.device.findMany({
      where: {
        id: {
          in: deviceIds,
        },
      },
    });

    const deviceMap = new Map(devices.map((d) => [d.id, d]));

    return browsers
      .map((b) => {
        const device = b.deviceId ? deviceMap.get(b.deviceId) : null;
        return {
          browser: device?.browser || "Unknown",
          version: device?.browserVersion || "",
          sessions: b._count.id,
        };
      })
      .filter((b) => b.browser !== "Unknown");
  }),

  getOperatingSystems: projectProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const { start, end } = getDateRange(input);

    const osData = await ctx.db.analyticsSession.groupBy({
      by: ["deviceId"],
      where: {
        projectId: input.projectId,
        startedAt: {
          gte: start,
          lte: end,
        },
        deviceId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    const deviceIds = osData.map((o) => o.deviceId).filter((id): id is string => id !== null);
    const devices = await ctx.db.device.findMany({
      where: {
        id: {
          in: deviceIds,
        },
      },
    });

    const deviceMap = new Map(devices.map((d) => [d.id, d]));

    return osData
      .map((o) => {
        const device = o.deviceId ? deviceMap.get(o.deviceId) : null;
        return {
          os: device?.os || "Unknown",
          version: device?.osVersion || "",
          sessions: o._count.id,
        };
      })
      .filter((o) => o.os !== "Unknown");
  }),

  getDeviceTypes: projectProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const { start, end } = getDateRange(input);

    const deviceTypes = await ctx.db.analyticsSession.groupBy({
      by: ["deviceId"],
      where: {
        projectId: input.projectId,
        startedAt: {
          gte: start,
          lte: end,
        },
        deviceId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
    });

    const deviceIds = deviceTypes.map((d) => d.deviceId).filter((id): id is string => id !== null);
    const devices = await ctx.db.device.findMany({
      where: {
        id: {
          in: deviceIds,
        },
      },
    });

    const deviceMap = new Map(devices.map((d) => [d.id, d]));

    const grouped = deviceTypes.reduce(
      (acc, dt) => {
        const device = dt.deviceId ? deviceMap.get(dt.deviceId) : null;
        const type = device?.deviceType || "unknown";
        acc[type] = (acc[type] || 0) + dt._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(grouped).map(([type, count]) => ({
      type,
      sessions: count,
    }));
  }),

  getReferrers: projectProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const { start, end } = getDateRange(input);

    const referrers = await ctx.db.analyticsSession.groupBy({
      by: ["referrerId"],
      where: {
        projectId: input.projectId,
        startedAt: {
          gte: start,
          lte: end,
        },
        referrerId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 20,
    });

    const referrerIds = referrers
      .map((r) => r.referrerId)
      .filter((id): id is string => id !== null);
    const referrerData = await ctx.db.referrer.findMany({
      where: {
        id: {
          in: referrerIds,
        },
      },
    });

    const referrerMap = new Map(referrerData.map((r) => [r.id, r]));

    return referrers
      .map((r) => {
        const ref = r.referrerId ? referrerMap.get(r.referrerId) : null;
        return {
          domain: ref?.domain || "Unknown",
          url: ref?.url || "",
          sessions: r._count.id,
        };
      })
      .filter((r) => r.domain !== "Unknown");
  }),

  getUTMParameters: projectProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const { start, end } = getDateRange(input);

    // Extract UTM parameters from events
    const events = await ctx.db.event.findMany({
      where: {
        projectId: input.projectId,
        type: "pageview",
        timestamp: {
          gte: start,
          lte: end,
        },
        url: {
          contains: "utm_",
        },
      },
      select: {
        url: true,
      },
      take: 1000,
    });

    // Parse UTM parameters
    const utmData: Record<string, { source?: string; medium?: string; campaign?: string; count: number }> = {};

    events.forEach((event) => {
      const url = new URL(event.url, "http://localhost");
      const utm_source = url.searchParams.get("utm_source");
      const utm_medium = url.searchParams.get("utm_medium");
      const utm_campaign = url.searchParams.get("utm_campaign");

      if (utm_source || utm_medium || utm_campaign) {
        const key = `${utm_source || ""}-${utm_medium || ""}-${utm_campaign || ""}`;
        if (!utmData[key]) {
          utmData[key] = {
            source: utm_source || undefined,
            medium: utm_medium || undefined,
            campaign: utm_campaign || undefined,
            count: 0,
          };
        }
        utmData[key].count++;
      }
    });

    return Object.values(utmData)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }),

  getScreenSizes: projectProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const { start, end } = getDateRange(input);

    const devices = await ctx.db.device.findMany({
      where: {
        projectId: input.projectId,
        createdAt: {
          gte: start,
          lte: end,
        },
        screenWidth: {
          not: null,
        },
        screenHeight: {
          not: null,
        },
      },
      include: {
        sessions: {
          where: {
            startedAt: {
              gte: start,
              lte: end,
            },
          },
        },
      },
    });

    const screenSizes = devices.map((d) => ({
      width: d.screenWidth || 0,
      height: d.screenHeight || 0,
      sessions: d.sessions.length,
    }));

    // Group by common screen sizes
    const grouped: Record<string, number> = {};
    screenSizes.forEach((size) => {
      const key = `${size.width}x${size.height}`;
      grouped[key] = (grouped[key] || 0) + size.sessions;
    });

    return Object.entries(grouped)
      .map(([size, count]) => {
        const [width, height] = size.split("x").map(Number);
        return {
          width,
          height,
          size,
          sessions: count,
        };
      })
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10);
  }),

  getSessions: projectProcedure
    .input(
      dateRangeSchema.extend({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { start, end } = getDateRange(input);

      const sessions = await ctx.db.analyticsSession.findMany({
        where: {
          projectId: input.projectId,
          startedAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          device: true,
          referrer: true,
          geo: true,
        },
        orderBy: {
          startedAt: "desc",
        },
        take: input.limit,
        skip: input.offset,
      });

      return sessions;
    }),
});

