"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import Calendar from "@/pages/Calendar";

export const dynamic = 'force-dynamic';

export default function AgendaPage() {
  return (
    <AuthGuard>
      <Calendar />
    </AuthGuard>
  );
}

