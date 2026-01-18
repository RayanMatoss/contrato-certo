"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import Contracts from "@/pages/Contracts";

export const dynamic = 'force-dynamic';

export default function ContratosPage() {
  return (
    <AuthGuard>
      <Contracts />
    </AuthGuard>
  );
}

