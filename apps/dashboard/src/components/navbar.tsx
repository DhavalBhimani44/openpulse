"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-actions";
import { Button } from "@openpulse/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@openpulse/ui";
import { trpc } from "@/lib/trpc";
import { LogOut } from "lucide-react";

export function Navbar({ projectId, projects }: { projectId?: string; projects?: any[] }) {
  const router = useRouter();
  const { data: projectsData } = trpc.project.list.useQuery(undefined, {
    enabled: !projects,
  });

  const allProjects = projects || projectsData || [];

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const handleProjectChange = (newProjectId: string) => {
    router.push(`/projects/${newProjectId}`);
  };

  return (
    <div className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4">
        {projectId && allProjects.length > 0 && (
          <Select value={projectId} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {allProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

