import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans'; // Corrected import for Geist Sans
import { GeistMono } from 'geist/font/mono';   // Corrected import for Geist Mono
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

export const metadata: Metadata = {
  title: {
    default: 'PictoPoem',
    template: '%s | PictoPoem',
  },
  description: 'Generate poems from your images and turn them into songs with AI.',
  keywords: ['AI', 'poem generator', 'song generator', 'image to poem', 'image to song', 'creative AI', 'Next.js', 'Genkit', 'TopMediai'],
  authors: [{ name: 'Firebase Studio AI' }],
  // Add other relevant metadata tags if needed
  // openGraph: { ... },
  // twitter: { ... },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`antialiased font-sans`}> {/* Use font variable */}
        {children}
        <Toaster /> {/* Ensure Toaster is included for notifications */}
      </body>
    </html>
  );
}
