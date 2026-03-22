import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/AppLayout";

const inter = Inter({ subsets: ["latin"] });
const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  title: "VedaAI | Advanced AI Assessment Engine",
  description: "Next-generation assessment creator for teachers and edtech.",
  icons: {
    icon: "/veda.png",
    shortcut: "/veda.png",
    apple: "/veda.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} ${bricolageGrotesque.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#efefef] text-[#17191d]">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
