import { Suspense } from "react";
import { connection } from "next/server";
import { getInitialProjectsData } from "@/lib/serverProjects";
import { HomeClient } from "@/components/HomeClient";

async function ServerQuotationHome() {
  await connection();
  const initialProjectsData = await getInitialProjectsData(10, "quotation");

  return <HomeClient initialProjectsData={initialProjectsData} routeMode="quotation" />;
}

export default function QuotationPage() {
  return (
    <Suspense fallback={<HomeClient routeMode="quotation" />}>
      <ServerQuotationHome />
    </Suspense>
  );
}

