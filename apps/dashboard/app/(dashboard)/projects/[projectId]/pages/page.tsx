"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@openpulse/ui";

export default function PagesPage({ params }: { params: { projectId: string } }) {
  const { data: pages } = trpc.metrics.getTopPages.useQuery({
    projectId: params.projectId,
    days: "30",
  });

  const { data: entryPages } = trpc.metrics.getEntryPages.useQuery({
    projectId: params.projectId,
    days: "30",
  });

  const { data: exitPages } = trpc.metrics.getExitPages.useQuery({
    projectId: params.projectId,
    days: "30",
  });

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">Pages</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pages?.map((page, index) => (
                <div key={page.path} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{page.path}</div>
                  </div>
                  <div className="text-sm font-semibold">{page.views} views</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entry Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {entryPages?.map((page, index) => (
                <div key={page.path} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{page.path}</div>
                  </div>
                  <div className="text-sm font-semibold">{page.sessions} sessions</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exit Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exitPages?.map((page, index) => (
                <div key={page.path} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{page.path}</div>
                  </div>
                  <div className="text-sm font-semibold">{page.sessions} sessions</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

