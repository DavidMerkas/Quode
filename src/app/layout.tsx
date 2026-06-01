import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quode, code with Duck",
  description:
    "A web-based coding playground with an AI duck mentor. Write code, run it, and learn with Duck.",
};

// Inline pre-hydration script: set the `dark` class before paint so we
// never flash the wrong theme. Reads localStorage, falls back to OS pref.
const THEME_INIT = `(function(){try{var s=localStorage.getItem('quode-theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="bg-base text-fg h-full min-h-screen">{children}</body>
    </html>
  );
}
