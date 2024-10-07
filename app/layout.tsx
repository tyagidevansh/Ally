import type { Metadata } from "next";
import { Merriweather } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { cn } from "@/lib/utils";
import Head from "next/head";
import { Analytics } from '@vercel/analytics/react';

const font = Merriweather({ weight: "300", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ally",
  description: "Your productivity companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" suppressHydrationWarning>
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <title>Ally</title>
        </Head>
        <body
          className={cn(
            font.className,
            "bg-white dark:bg-[#313338]"
          )}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Analytics />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
