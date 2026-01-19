"use client";

import dynamicImport from "next/dynamic";
import { AuthGuard } from "@/components/auth/AuthGuard";

const Calendar = dynamicImport(() => import("@/pages/Calendar"), {
  ssr: false,
});

export default function AgendaPage() {
  return (
    <AuthGuard>
      <Calendar />
    </AuthGuard>
  );
}

