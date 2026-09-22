import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: {
    default: "Vita Care Hospital at Home",
    template: "%s | Vita Care HaH",
  },
  description:
    "Platform Hospital at Home untuk layanan klinis, monitoring, koordinasi, dan keterlibatan keluarga.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
