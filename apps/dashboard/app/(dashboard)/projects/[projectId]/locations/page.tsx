"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@openpulse/ui";

export default function LocationsPage({ params }: { params: { projectId: string } }) {
  const { data: countries } = trpc.metrics.getCountries.useQuery({
    projectId: params.projectId,
    days: "30",
  });

  const { data: cities } = trpc.metrics.getCities.useQuery({
    projectId: params.projectId,
    days: "30",
  });

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">Locations</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {countries?.map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="font-medium">{country.country}</div>
                  <div className="text-sm font-semibold">{country.visitors} visitors</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cities?.map((city, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{city.city}</div>
                    <div className="text-sm text-gray-600">{city.country}</div>
                  </div>
                  <div className="text-sm font-semibold">{city.visitors} visitors</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

