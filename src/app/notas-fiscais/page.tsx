"use client";

import dynamicImport from "next/dynamic";
import { AuthGuard } from "@/components/auth/AuthGuard";

const Invoices = dynamicImport(() => import("@/pages/Invoices"), {
  ssr: false,
});

export default function NotasFiscaisPage() {
  return (
    <AuthGuard>
      <Invoices />
    </AuthGuard>
  );
}

