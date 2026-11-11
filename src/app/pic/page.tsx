import { Suspense } from "react";
import { connection } from "next/server";
import { getInitialProjectsData } from "@/lib/serverProjects";
import { HomeClient } from "@/components/HomeClient";

async function ServerPicHome() {
  await connection();
  const initialProjectsData = await getInitialProjectsData(10, "pic");

  return <HomeClient initialProjectsData={initialProjectsData} routeMode="pic" />;
}

export default function PicPage() {
  return (
    <Suspense fallback={<HomeClient routeMode="pic" />}>
      <ServerPicHome />
    </Suspense>
  );
}

