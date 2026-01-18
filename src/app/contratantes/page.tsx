"use client";

import dynamicImport from "next/dynamic";
import { AuthGuard } from "@/components/auth/AuthGuard";

const Clients = dynamicImport(() => import("@/pages/Clients"), {
  ssr: false,
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default function ClientesPage() {
  return (
    <AuthGuard>
      <Clients />
    </AuthGuard>
  );
}

