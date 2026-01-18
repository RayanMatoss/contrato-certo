"use client";

import dynamicImport from "next/dynamic";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";

const Dashboard = dynamicImport(() => import("@/pages/Dashboard"), {
  ssr: false,
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default function Home() {
  return (
    <AuthGuard>
      <AppLayout>
        <Dashboard />
      </AppLayout>
    </AuthGuard>
  );
}

