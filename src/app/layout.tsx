import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ToasterProvider } from "@/components/ui/ToasterProvider";
import { ThemeProvider } from "next-themes";
import { PerformanceProvider } from "@/contexts/PerformanceContext";
import { ThemeLayerProvider, HalloweenOverlay } from "@/app/features/theme-layer";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

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
        <ServiceWorkerRegistration />
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            themes={["light", "halloween"]}
            enableSystem={false}
            storageKey="theme-preference"
          >
            <PerformanceProvider>
              <ThemeLayerProvider>
                  <AuthProvider>
                    <ToasterProvider>
                      <HalloweenOverlay />
                      <main id="main-content" role="main">
                        {children}
                      </main>
                    </ToasterProvider>
                  </AuthProvider>
              </ThemeLayerProvider>
            </PerformanceProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
