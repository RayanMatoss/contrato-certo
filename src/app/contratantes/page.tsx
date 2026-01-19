"use client";

import dynamicImport from "next/dynamic";
import { AuthGuard } from "@/components/auth/AuthGuard";

const Clients = dynamicImport(() => import("@/pages/Clients"), {
  ssr: false,
});

export default function ClientesPage() {
  return (
    <AuthGuard>
      <Clients />
    </AuthGuard>
  );
}

