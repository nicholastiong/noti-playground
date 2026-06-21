import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "noti-playground",
  description: "Frontend for the noti-playground backend system design lab.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
