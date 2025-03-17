import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import { FpjsProvider } from '@fingerprintjs/fingerprintjs-pro-react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "FP Demo app",
  description: "FingerprintJS Pro Demo app",
  icons: {
    icon: [
      { url: '/FP-Favicon-Orange-WhiteBG-32x32.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/FP-Favicon-Orange-WhiteBG-32x32.svg',
    apple: '/FP-Favicon-Orange-WhiteBG-32x32.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/FP-Favicon-Orange-WhiteBG-32x32.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <FpjsProvider
          loadOptions={{
            apiKey: process.env.NEXT_PUBLIC_FINGERPRINT_API_KEY,
            endpoint: "https://fpmetricslogger.us/Q1ZiZuhwbVJgq4ZP/uVlgRwunV0GJub6T",
            scriptUrlPattern: [
              "https://fpmetricslogger.us/Q1ZiZuhwbVJgq4ZP/wFTswDFEmr2aX2ki?apiKey=<apiKey>&version=<version>&loaderVersion=<loaderVersion>",
            ]
          }}
        >
          <Header />
          <main className="flex-grow">
            {children}
          </main>
        </FpjsProvider>
      </body>
    </html>
  );
}
