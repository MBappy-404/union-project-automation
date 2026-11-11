import { Suspense } from "react";
import { connection } from "next/server";
import { getInitialProjectsData } from "@/lib/serverProjects";
import { ProjectsPageClient } from "@/components/ProjectsPageClient";

async function ServerProjects() {
  await connection();
  const initialData = await getInitialProjectsData(10);

  return <ProjectsPageClient initialData={initialData} />;
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsPageClient />}>
      <ServerProjects />
    </Suspense>
  );
}
