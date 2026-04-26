import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FABRIC Label",
  description: "A flexible multi-type data annotation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#0e0f14] text-gray-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
