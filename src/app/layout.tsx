import type { Metadata } from "next";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Carregar ClientProviders de forma assíncrona para reduzir o chunk inicial
const ClientProviders = dynamic(
  () => import("./client-providers").then((mod) => ({ default: mod.ClientProviders })),
  {
    ssr: true,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "Licity",
  description: "Sistema de gestão de contratos",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

