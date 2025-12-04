import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@openpulse/db";
import { rateLimit } from "@/lib/rate-limit";
import { processEvent } from "@/lib/event-processor";
import { getClientIP } from "@/lib/ip-anonymize";

const eventSchema = z.object({
  projectId: z.string(),
  sessionId: z.string(),
  url: z.string(),
  referrer: z.string().optional(),
  title: z.string().optional(),
  userAgent: z.string().optional(),
  screenWidth: z.number().optional(),
  screenHeight: z.number().optional(),
  timezone: z.string().optional(),
});

const batchEventSchema = z.array(eventSchema);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request.headers);
    const ipLimit = rateLimit(`ip:${ip}`, 100, 60 * 1000); // 100 requests per minute per IP

    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await request.json();

    // Support both single events and batches
    const events = Array.isArray(body) ? body : [body];

    // Validate all events
    const validatedEvents = batchEventSchema.parse(events);

    // Rate limit per project
    const projectIds = [...new Set(validatedEvents.map((e) => e.projectId))];
    for (const projectId of projectIds) {
      const projectLimit = rateLimit(`project:${projectId}`, 1000, 60 * 1000); // 1000 requests per minute per project
      if (!projectLimit.allowed) {
        return NextResponse.json(
          { error: "Project rate limit exceeded" },
          { status: 429 }
        );
      }
    }

    // Verify projects exist
    const projects = await db.project.findMany({
      where: {
        id: {
          in: projectIds,
        },
      },
      select: { id: true },
    });

    const validProjectIds = new Set(projects.map((p) => p.id));
    const invalidProjects = projectIds.filter((id) => !validProjectIds.has(id));

    if (invalidProjects.length > 0) {
      return NextResponse.json(
        { error: "Invalid project IDs", projects: invalidProjects },
        { status: 400 }
      );
    }

    // Process events in batch
    const promises = validatedEvents.map((event) =>
      processEvent(event, request.headers)
    );

    await Promise.allSettled(promises);

    // Return 204 No Content on success
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error processing event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

