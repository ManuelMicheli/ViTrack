import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ViTrack - Tracker Calorie e Allenamenti",
  description:
    "Monitora calorie, macronutrienti e allenamenti tramite Telegram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${geistSans.variable} font-sans antialiased bg-black text-white`}>
        {children}
      </body>
    </html>
  );
}
