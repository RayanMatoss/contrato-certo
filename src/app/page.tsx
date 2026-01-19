"use client";

import dynamicImport from "next/dynamic";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";

const Dashboard = dynamicImport(() => import("@/pages/Dashboard"), {
  ssr: false,
});

export default function Home() {
  return (
    <AuthGuard>
      <AppLayout>
        <Dashboard />
      </AppLayout>
    </AuthGuard>
  );
}

