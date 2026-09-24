import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TrpcProvider } from "@/lib/trpc/Provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentBrowse — Autonomous AI Web Agent Platform",
  description: "Give AI agents access to cloud browser sandboxes to automate web tasks, DOM navigation, and workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-100 text-zinc-900 selection:bg-zinc-900 selection:text-white">
        <TrpcProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </TrpcProvider>
      </body>
    </html>
  );
}
