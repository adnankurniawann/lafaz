import type { Metadata, Viewport } from "next";
import { Amiri_Quran, Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const amiriQuran = Amiri_Quran({
  variable: "--font-amiri-quran",
  weight: "400",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "Lafaz",
  description: "Belajar membaca Al-Qur'an dengan tajwid, sedikit demi sedikit setiap hari.",
};

export const viewport: Viewport = {
  themeColor: "#f6f4ee",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${nunito.variable} ${amiriQuran.variable} h-full antialiased`}>
      <body className="min-h-full bg-stone-200">
        <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-background shadow-sm">
          {children}
        </div>
      </body>
    </html>
  );
}
