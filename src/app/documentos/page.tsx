"use client";

import dynamicImport from "next/dynamic";
import { AuthGuard } from "@/components/auth/AuthGuard";

const Documents = dynamicImport(() => import("@/pages/Documents"), {
  ssr: false,
});

export default function DocumentosPage() {
  return (
    <AuthGuard>
      <Documents />
    </AuthGuard>
  );
}

