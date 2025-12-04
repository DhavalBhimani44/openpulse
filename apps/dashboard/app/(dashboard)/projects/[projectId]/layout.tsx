import { Sidebar } from "@/components/sidebar";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  return (
    <>
      <Sidebar projectId={params.projectId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </>
  );
}

