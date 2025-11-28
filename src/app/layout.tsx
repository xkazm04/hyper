import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ToasterProvider } from "@/components/ui/ToasterProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { HighContrastWrapper } from "@/app/features/accessibility";
import { SkipLinkWrapper } from "@/components/ui/SkipLinkWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HyperCard Renaissance",
  description: "Create interactive stacks with modern technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SkipLinkWrapper targetId="main-content" />
        <ServiceWorkerRegistration />
        <QueryProvider>
          <ThemeProvider>
            <HighContrastWrapper>
              <AuthProvider>
                <ToasterProvider>
                  <main id="main-content" role="main">
                    {children}
                  </main>
                </ToasterProvider>
              </AuthProvider>
            </HighContrastWrapper>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
