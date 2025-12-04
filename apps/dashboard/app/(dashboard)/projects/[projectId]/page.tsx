"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@openpulse/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@openpulse/ui";
import { Users, Eye, MousePointerClick, Clock } from "lucide-react";

export default function ProjectDashboardPage({ params }: { params: { projectId: string } }) {
  const [days, setDays] = useState<"7" | "30" | "90" | "all">("30");

  const { data: overview, isLoading: overviewLoading } = trpc.metrics.getOverview.useQuery({
    projectId: params.projectId,
    days,
  });

  const { data: pageviews, isLoading: pageviewsLoading } = trpc.metrics.getPageviews.useQuery({
    projectId: params.projectId,
    days,
  });

  const { data: topPages } = trpc.metrics.getTopPages.useQuery({
    projectId: params.projectId,
    days,
  });

  const { data: realtime } = trpc.metrics.getRealtimeVisitors.useQuery(
    {
      projectId: params.projectId,
    },
    {
      refetchInterval: 5000, // Refresh every 5 seconds
    }
  );

  if (overviewLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setDays("7")}
            className={`rounded px-3 py-1 text-sm ${
              days === "7" ? "bg-primary text-primary-foreground" : "bg-gray-100"
            }`}
          >
            Last 7 days
          </button>
          <button
            onClick={() => setDays("30")}
            className={`rounded px-3 py-1 text-sm ${
              days === "30" ? "bg-primary text-primary-foreground" : "bg-gray-100"
            }`}
          >
            Last 30 days
          </button>
          <button
            onClick={() => setDays("90")}
            className={`rounded px-3 py-1 text-sm ${
              days === "90" ? "bg-primary text-primary-foreground" : "bg-gray-100"
            }`}
          >
            Last 90 days
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.visitors || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pageviews</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.pageviews || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.bounceRate.toFixed(1) || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.avgSessionDuration
                ? `${Math.floor(overview.avgSessionDuration / 60)}m ${overview.avgSessionDuration % 60}s`
                : "0s"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Visitors */}
      {realtime && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Real-time Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{realtime.count}</div>
            <p className="text-sm text-gray-600">Active in the last 5 minutes</p>
          </CardContent>
        </Card>
      )}

      {/* Top Pages */}
      {topPages && topPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPages.map((page, index) => (
                <div key={page.path} className="flex items-center justify-between">
                  <span className="text-sm">{page.path}</span>
                  <span className="font-semibold">{page.views}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

