import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SATPrep Admin",
  description: "Admin panel for SATPrep",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
