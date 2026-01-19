"use client";

import dynamicImport from "next/dynamic";
import { AuthGuard } from "@/components/auth/AuthGuard";

const Contracts = dynamicImport(() => import("@/pages/Contracts"), {
  ssr: false,
});

export default function ContratosPage() {
  return (
    <AuthGuard>
      <Contracts />
    </AuthGuard>
  );
}

