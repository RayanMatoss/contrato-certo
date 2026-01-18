"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import Settings from "@/pages/Settings";

export const dynamic = 'force-dynamic';

export default function ConfiguracoesPage() {
  return (
    <AuthGuard>
      <Settings />
    </AuthGuard>
  );
}

