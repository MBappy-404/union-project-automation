import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

const nikosh = localFont({
  src: [
    {
      path: "./fonts/Nikosh.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-nikosh",
  display: "swap",
});

const solaimanLipi = localFont({
  src: [
    {
      path: "./fonts/SolaimanLipi.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-solaiman-lipi",
  display: "swap",
});

const adorshoLipi = localFont({
  src: [
    {
      path: "./fonts/Adorsholipi.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-adorsho-lipi",
  display: "swap",
});

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "ইউনিয়ন পরিষদ প্রকল্প মাস্টার ফর্ম ও অটোমেশন সিস্টেম",
  description: "ইউনিয়ন পরিষদের প্রকল্প তথ্য ভরাট এবং সকল সরকারি টেমপ্লেট ও নথিপত্র স্বয়ংক্রিয় তৈরির আধুনিক সিস্টেম",
  other: {
    "color-scheme": "light only",
    "supported-color-schemes": "light only",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      className="light"
      style={{ colorScheme: "light only", backgroundColor: "#ffffff", color: "#0f172a" }}
    >
      <head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
      </head>
      <body
        className={`${nikosh.variable} ${solaimanLipi.variable} ${adorshoLipi.variable} antialiased min-h-screen bg-white text-slate-900 selection:bg-blue-600 selection:text-white`}
        style={{ colorScheme: "light only", backgroundColor: "#ffffff", color: "#0f172a" }}
      >
        <Toaster richColors position="top-center" closeButton />
        {children}
      </body>
    </html>
  );
}

