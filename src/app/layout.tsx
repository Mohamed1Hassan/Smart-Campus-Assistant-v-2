import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientProviders from "../components/ClientProviders";

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
  title: {
    default: "Smart Campus Assistant - معهد طيبة",
    template: "%s | Smart Campus Assistant",
  },
  description:
    "النظام الذكي لإدارة الحضور والغياب والمواد الدراسية لمعهد طيبة العالي. Attendance, grades, and course management for Thebes Academy.",
  keywords: [
    "معهد طيبة",
    "معهد طيبة العالي",
    "حضور معهد طيبة",
    "غياب معهد طيبة",
    "نتائج معهد طيبة",
    "جدول محاضرات معهد طيبة",
    "Thebes Academy",
    "Thebes Academy Portal",
    "Smart Campus Assistant",
    "نظام الحضور والغياب",
    "المنصة التعليمية معهد طيبة",
    "Thebes Higher Institute",
    "Thebes Academy student portal",
    "موقع معهد طيبة الرسمي",
  ],
  authors: [{ name: "Smart Campus Team" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: "https://smart-campus-assistant.vercel.app",
    title: "Smart Campus Assistant - معهد طيبة",
    description:
      "النظام الذكي لإدارة الحضور والغياب والمواد الدراسية لمعهد طيبة العالي.",
    siteName: "Smart Campus Assistant",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Campus Assistant - معهد طيبة",
    description:
      "النظام الذكي لإدارة الحضور والغياب والمواد الدراسية لمعهد طيبة العالي.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
