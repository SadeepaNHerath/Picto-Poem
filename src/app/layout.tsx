import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans'; // Corrected import for Geist Sans
// Removed GeistMono import as it was causing resolution errors and wasn't used
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
    // Apply the Geist Sans font variable to the html tag
    <html lang="en" className={`${GeistSans.variable}`}>
      {/* Ensure the font-sans utility class uses the variable */}
      <body className={`antialiased font-sans`}>
        {children}
        <Toaster /> {/* Ensure Toaster is included for notifications */}
      </body>
    </html>
  );
}
