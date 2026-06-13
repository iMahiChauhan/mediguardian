import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MediGuardian | AI Healthcare Platform",
  description: "An AI-powered healthcare platform combining symptom analysis, medical report interpretation, and health tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary`}>
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-white/80 backdrop-blur-md">
          <div className="container mx-auto flex h-16 max-w-5xl items-center px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                <svg xmlns="http://www.w3.org/Path" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/></svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Medi<span className="text-primary">Guardian</span></span>
            </Link>
            <nav className="ml-auto flex gap-6">
              <Link href="/symptoms" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Analyzer
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Dashboard
              </Link>
              <Link href="/reports" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Reports
              </Link>
              <Link href="/hospitals" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Hospitals
              </Link>
              <Link href="/chat" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                AI Chat
              </Link>
              <Link href="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Sign In
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 container mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
          {children}
        </main>
      </body>
    </html>
  );
}
