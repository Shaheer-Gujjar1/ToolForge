import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ToolForge — Every Tool You Need, 100% Private",
  description:
    "A premium, 100% private online toolbox for PDFs, images, documents and more. Convert, merge, compress, edit and secure your files — all in your browser. Free batch processing. No uploads, ever.",
  keywords: [
    "free online tools",
    "file tools",
    "PDF tools",
    "merge PDF",
    "split PDF",
    "compress PDF",
    "PDF converter",
    "image converter",
    "document tools",
    "private tools",
    "browser tools",
    "batch processing",
  ],
  authors: [{ name: "ToolForge" }],
  icons: {
    icon: [
      { url: "/favicon/Tool-Forge-Logo1-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/Tool-Forge-Logo1-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/Tool-Forge-Logo1.ico" },
    ],
    apple: "/favicon/Tool-Forge-Logo1-128x128.png",
    shortcut: "/favicon/Tool-Forge-Logo1.ico",
  },
  openGraph: {
    title: "ToolForge — Every Tool You Need, 100% Private",
    description:
      "Every tool you need, in one place. PDFs, images, documents and more — 100% private, in your browser. Free batch processing.",
    siteName: "ToolForge",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
