import './globals.css';
import { GoogleTagManager } from '@next/third-parties/google';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';

import { ChatProvider } from './context/ChatContext';

const inter = Inter({ subsets: ['latin'] });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  userScalable: false,
  themeColor: '#000000',
};

export const metadata = {
  title: 'AkashChat',
  description: 'Chat with the leading open source AI models, powered by the Akash Supercloud.',
  manifest: '/manifest.json',
  metadataBase: new URL('https://chat.akash.network'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
    },
  },
  openGraph: {
    title: 'AkashChat',
    description: 'Chat with the leading open source AI models, powered by the Akash Supercloud.',
    type: 'website',
    locale: 'en_US',
    url: 'https://chat.akash.network',
    siteName: 'AkashChat',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AkashChat - Powered by Akash Network'
      }
    ],
    videos: [],
    audio: [],
  },
  other: {
    'theme-color': '#000000',
    'og:site_name': 'AkashChat',
    'og:image:type': 'image/png',
    'og:image:secure_url': 'https://chat.akash.network/og-image.png',
    'discord:invite_image': '/og-image.png',
    'discord:invite_description': 'Chat with the leading open source AI models, powered by the Akash Supercloud.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AkashChat',
    description: 'Chat with the leading open source AI models, powered by the Akash Supercloud.',
    creator: '@akashnet_',
    images: ['/og-image.png']
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AkashChat'
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/web-app-manifest-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/web-app-manifest-512x512.png', type: 'image/png', sizes: '512x512' }
    ],
    apple: [
      { url: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
      { url: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    shortcut: [
      { url: '/favicon.ico', sizes: 'any' }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ChatProvider>
            {/* App-wide structured data */}
            <div 
              itemScope 
              itemType="https://schema.org/WebApplication"
              style={{ display: 'none' }}
            >
              <meta itemProp="name" content="AkashChat" />
              <meta itemProp="description" content="Chat with the leading open source AI models, powered by the Akash Supercloud." />
              <meta itemProp="url" content="https://chat.akash.network" />
              <meta itemProp="applicationCategory" content="Artificial Intelligence" />
              <meta itemProp="operatingSystem" content="Any" />
              
              <div itemProp="author" itemScope itemType="https://schema.org/Organization">
                <meta itemProp="name" content="Akash Network" />
                <meta itemProp="url" content="https://akash.network" />
              </div>
            </div>
            
            {children}
          </ChatProvider>
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GA_ID ?? ''} />
        </ThemeProvider>
      </body>
    </html>
  );
}
