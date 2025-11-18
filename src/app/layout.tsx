import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ToasterProvider } from "@/components/ui/ToasterProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";

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
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <ToasterProvider>
              {children}
            </ToasterProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
