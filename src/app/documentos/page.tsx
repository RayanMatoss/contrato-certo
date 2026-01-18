"use client";

import dynamicImport from "next/dynamic";
import { AuthGuard } from "@/components/auth/AuthGuard";

const Documents = dynamicImport(() => import("@/pages/Documents"), {
  ssr: false,
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default function DocumentosPage() {
  return (
    <AuthGuard>
      <Documents />
    </AuthGuard>
  );
}

