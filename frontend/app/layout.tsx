import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import VersionIndicator from "../components/VersionIndicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { ToastProvider } from '../components/ToastProvider';

export const metadata: Metadata = {
  title: 'DT Inbox Cleaner',
  description: 'The fastest way to reach Inbox Zero.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ToastProvider>
          {children}
          <VersionIndicator />
        </ToastProvider>
      </body>
    </html>
  );
}
