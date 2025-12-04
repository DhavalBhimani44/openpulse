"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@openpulse/ui";

export default function ReferrersPage({ params }: { params: { projectId: string } }) {
  const { data: referrers } = trpc.metrics.getReferrers.useQuery({
    projectId: params.projectId,
    days: "30",
  });

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">Referrers</h1>

      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {referrers?.map((ref, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{ref.domain}</div>
                  {ref.url && <div className="text-sm text-gray-600">{ref.url}</div>}
                </div>
                <div className="text-sm font-semibold">{ref.sessions} sessions</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

