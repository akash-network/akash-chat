import { Metadata } from 'next';

import { ChatHome } from '@/components/chat/chat-home';

export const metadata: Metadata = {
  title: 'AkashChat - Chat with Open Source AI Models',
  description: 'Chat with leading open source AI models powered by the Akash Supercloud. Experience state-of-the-art AI chat capabilities in a privacy-focused environment.',
  openGraph: {
    title: 'AkashChat - Chat with Open Source AI Models',
    description: 'Interact with leading open source AI models powered by the Akash Supercloud. Privacy-focused and state-of-the-art.',
    type: 'website',
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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AkashChat - Chat with Open Source AI Models',
    description: 'Interact with leading open source AI models powered by the Akash Supercloud. Privacy-focused and state-of-the-art.',
    images: ['/og-image.png']
  },
  keywords: ['AI chat', 'open source AI', 'Akash Network', 'AI models', 'natural language processing', 'machine learning', 'chat assistant'],
  authors: [{ name: 'Akash Network', url: 'https://akash.network' }],
  creator: 'Akash Network',
  publisher: 'Akash Network',
};

export default function Home() {
  return <ChatHome />;
}
