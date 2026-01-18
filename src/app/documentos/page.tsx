"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import Documents from "@/pages/Documents";

export const dynamic = 'force-dynamic';

export default function DocumentosPage() {
  return (
    <AuthGuard>
      <Documents />
    </AuthGuard>
  );
}

