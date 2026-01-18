"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import Clients from "@/pages/Clients";

export const dynamic = 'force-dynamic';

export default function ClientesPage() {
  return (
    <AuthGuard>
      <Clients />
    </AuthGuard>
  );
}

