import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';


const dmSans = DM_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoalPlanner Pro - AI-Powered Goal Planning & Progress Tracking",
  description: "Transform your big ambitions into actionable steps with AI-powered goal planning, smart coaching, and progress tracking. Start achieving your goals today.",
  keywords: ["goal planning", "AI coaching", "productivity", "progress tracking", "personal development", "habit tracking"],
  authors: [{ name: "GoalPlanner Team", url: "https://goalplanner.pro" }],
  creator: "GoalPlanner Team",
  publisher: "GoalPlanner Pro",
  metadataBase: new URL("https://goalplanner.pro"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "GoalPlanner Pro - AI-Powered Goal Planning",
    description: "Transform your big ambitions into actionable steps with AI-powered goal planning, smart coaching, and progress tracking.",
    url: "https://goalplanner.pro",
    siteName: "GoalPlanner Pro",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GoalPlanner Pro - AI-Powered Goal Planning",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoalPlanner Pro - AI-Powered Goal Planning",
    description: "Transform your big ambitions into actionable steps with AI-powered goal planning and progress tracking.",
    images: ["/og-image.png"],
    creator: "@GoalPlannerPro",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${dmSans.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
