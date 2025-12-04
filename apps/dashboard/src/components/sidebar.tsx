"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@openpulse/ui";
import { LayoutDashboard, BarChart3, Globe, Monitor, MapPin, Link as LinkIcon } from "lucide-react";

const navigation = [
  { name: "Overview", href: "", icon: LayoutDashboard },
  { name: "Pages", href: "/pages", icon: BarChart3 },
  { name: "Referrers", href: "/referrers", icon: LinkIcon },
  { name: "Devices", href: "/devices", icon: Monitor },
  { name: "Locations", href: "/locations", icon: MapPin },
];

export function Sidebar({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-gray-50">
      <div className="flex h-16 items-center border-b px-6">
        <h2 className="text-lg font-semibold">Analytics</h2>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const href = `/projects/${projectId}${item.href}`;
          const isActive = pathname === href || (item.href === "" && pathname === `/projects/${projectId}`);
          return (
            <Link
              key={item.name}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

