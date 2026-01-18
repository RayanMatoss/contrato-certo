"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import Tenants from "@/pages/Tenants";

export const dynamic = 'force-dynamic';

export default function EmpresasPage() {
  return (
    <AuthGuard>
      <Tenants />
    </AuthGuard>
  );
}
