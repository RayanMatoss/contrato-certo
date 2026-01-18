"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import Invoices from "@/pages/Invoices";

export const dynamic = 'force-dynamic';

export default function NotasFiscaisPage() {
  return (
    <AuthGuard>
      <Invoices />
    </AuthGuard>
  );
}

