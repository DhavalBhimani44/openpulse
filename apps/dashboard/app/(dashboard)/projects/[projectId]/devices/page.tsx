"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@openpulse/ui";

export default function DevicesPage({ params }: { projectId: string }) {
  const { data: browsers } = trpc.metrics.getBrowsers.useQuery({
    projectId: params.projectId,
    days: "30",
  });

  const { data: os } = trpc.metrics.getOperatingSystems.useQuery({
    projectId: params.projectId,
    days: "30",
  });

  const { data: deviceTypes } = trpc.metrics.getDeviceTypes.useQuery({
    projectId: params.projectId,
    days: "30",
  });

  const { data: screenSizes } = trpc.metrics.getScreenSizes.useQuery({
    projectId: params.projectId,
    days: "30",
  });

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">Devices</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Browsers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {browsers?.map((browser, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{browser.browser}</div>
                    {browser.version && <div className="text-sm text-gray-600">{browser.version}</div>}
                  </div>
                  <div className="text-sm font-semibold">{browser.sessions} sessions</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operating Systems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {os?.map((o, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{o.os}</div>
                    {o.version && <div className="text-sm text-gray-600">{o.version}</div>}
                  </div>
                  <div className="text-sm font-semibold">{o.sessions} sessions</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deviceTypes?.map((dt, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="font-medium capitalize">{dt.type}</div>
                  <div className="text-sm font-semibold">{dt.sessions} sessions</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Screen Sizes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {screenSizes?.map((size, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="font-medium">{size.size}</div>
                  <div className="text-sm font-semibold">{size.sessions} sessions</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

