"use client";

import dynamicImport from "next/dynamic";
import { AuthGuard } from "@/components/auth/AuthGuard";

const Contracts = dynamicImport(() => import("@/pages/Contracts"), {
  ssr: false,
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default function ContratosPage() {
  return (
    <AuthGuard>
      <Contracts />
    </AuthGuard>
  );
}

