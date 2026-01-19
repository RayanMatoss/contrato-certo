"use client";

import dynamicImport from "next/dynamic";
import { AuthGuard } from "@/components/auth/AuthGuard";

const Settings = dynamicImport(() => import("@/pages/Settings"), {
  ssr: false,
});

export default function ConfiguracoesPage() {
  return (
    <AuthGuard>
      <Settings />
    </AuthGuard>
  );
}

