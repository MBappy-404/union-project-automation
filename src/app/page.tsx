import { Suspense } from "react";
import { connection } from "next/server";
import { getInitialProjectsData } from "@/lib/serverProjects";
import { HomeClient } from "@/components/HomeClient";

async function ServerHome() {
  await connection();
  const initialProjectsData = await getInitialProjectsData(10);

  return <HomeClient initialProjectsData={initialProjectsData} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeClient />}>
      <ServerHome />
    </Suspense>
  );
}
