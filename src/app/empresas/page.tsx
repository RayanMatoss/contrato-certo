"use client";

import dynamicImport from "next/dynamic";
import { AuthGuard } from "@/components/auth/AuthGuard";

const Tenants = dynamicImport(() => import("@/pages/Tenants"), {
  ssr: false,
});

export default function EmpresasPage() {
  return (
    <AuthGuard>
      <Tenants />
    </AuthGuard>
  );
}
