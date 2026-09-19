import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import Navbar from "@/components/Navbar";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Premium Strawberry Juice | Pure. Fresh. Premium.",
  description: "Experience the pure, vibrant taste of our cold-pressed premium strawberry juice. 100% organic, naturally sweetened.",
  keywords: ["strawberry juice", "cold-pressed", "premium juice", "organic"],
  openGraph: {
    title: "Premium Strawberry Juice",
    description: "Pure. Fresh. Premium. Scroll-driven product showcase.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased bg-luxury-black text-white`}>
        <Navbar />
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
