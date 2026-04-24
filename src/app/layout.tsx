// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Annotation Studio",
  description: "A flexible multi-type data annotation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0e0f14] text-gray-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
