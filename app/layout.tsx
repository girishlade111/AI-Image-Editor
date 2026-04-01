import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "LadeStack Editor - Free AI Image Editor",
  description:
    "Professional browser-based AI image editor with layers, filters, and smart tools. Edit images directly in your browser with LadeStack.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark font-sans", inter.variable)}>
      <body className="m-0 overflow-hidden p-0 antialiased">
        {children}
      </body>
    </html>
  );
}
