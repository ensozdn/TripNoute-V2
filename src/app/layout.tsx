import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import SplashScreenProvider from "@/components/common/SplashScreenProvider";
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
  title: "TripNoute - Your Personal Travel Journal",
  description: "Document your travels with location, photos, and notes. Build your digital travel map.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SplashScreenProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SplashScreenProvider>
      </body>
    </html>
  );
}
