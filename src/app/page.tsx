"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <AuthGuard>
      <AppLayout>
        <Dashboard />
      </AppLayout>
    </AuthGuard>
  );
}

