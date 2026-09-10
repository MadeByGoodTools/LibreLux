import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LibreLux — Photo workflow by Good Tools",
  description:
    "A local-first professional photo library, development, color grading, and optics workspace in your browser.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
