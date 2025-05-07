import { Metadata } from 'next';

import { ModelsPageClient } from '@/components/models/models-page-client';

export const metadata: Metadata = {
  title: 'AI Models - AkashChat',
  description: 'Explore all available AI models on AkashChat. Chat with leading open source AI models powered by the Akash Supercloud.',
  openGraph: {
    title: 'AI Models - AkashChat',
    description: 'Explore all available AI models on AkashChat. Chat with leading open source AI models powered by the Akash Supercloud.',
    url: 'https://chat.akash.network/models/',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AkashChat Models - Powered by Akash Network'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Models - AkashChat',
    description: 'Explore all available AI models on AkashChat. Chat with leading open source AI models powered by the Akash Supercloud.',
    images: ['/og-image.png']
  },
  keywords: ['AI models', 'language models', 'Akash Network', 'LLM', 'machine learning', 'open source AI'],
  authors: [{ name: 'Akash Network', url: 'https://akash.network' }],
  creator: 'Akash Network',
  publisher: 'Akash Network',
};

export default function ModelsPage() {
  return <ModelsPageClient />;
} 