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

export const metadata = {
  title: "FP Demo app",
  description: "FingerprintJS Pro Demo app",
  themeColor: "#F04405", // Fingerprint primary orange color
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
