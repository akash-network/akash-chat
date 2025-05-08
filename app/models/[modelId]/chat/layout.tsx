import { Metadata, ResolvingMetadata } from 'next';
import { use } from 'react';

import { models } from '@/app/config/models';

// Dynamic metadata generation
export async function generateMetadata(
  { params }: { params: Promise<{ modelId: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Get parent metadata (from root layout)
  const parentMetadata = await parent;
  const previousImages = parentMetadata.openGraph?.images || [];
  
  const { modelId } = await params;
  const model = models.find(m => m.id.toLowerCase() === modelId.toLowerCase());
  
  if (!model) {
    return {
      title: 'Model Not Found - AkashChat',
      description: 'The requested AI model could not be found or is currently unavailable.'
    };
  }

  // Format model capabilities for description
  const capabilities = [];
  if (model.tokenLimit) {capabilities.push(`${(model.tokenLimit / 1000).toFixed(0)}K context window`);}
  
  const modelFamily = model.id.split('-')[0];
  const detailedDescription = model.description 
    ? `${model.description}${capabilities.length ? '. ' : ''}`
    : '';
  
    // todo: change this to a more accurate description
  const fullDescription = `${detailedDescription}${capabilities.length 
    ? `Features: ${capabilities.join(', ')}.` 
    : ''} Try ${model.name} for free on AkashChat.`;

  return {
    title: `${model.name} - AI Chat Model - AkashChat`,
    description: fullDescription,
    openGraph: {
      title: `Chat with ${model.name} - Free AI Chat`,
      description: fullDescription,
      url: `https://chat.akash.network/models/${modelId}`,
      images: previousImages,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Chat with ${model.name}`,
      description: fullDescription,
    },
    keywords: [
      model.name, 
      'AI chat', 
      'language model', 
      modelFamily, 
      'artificial intelligence', 
      'chat with AI',
      'open source AI', 
      'Akash Network', 
      'free AI chat'
    ],
    other: {
      'application-name': 'AkashChat',
    }
  };
}

export default function ModelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ modelId: string }>;
}) {
  const resolvedParams = use(params);
  const modelId = resolvedParams?.modelId || '';
  
  // Find the model
  const model = models.find(m => m.id.toLowerCase() === modelId.toLowerCase());
  
  // If no model found, just render children without structured data
  if (!model) {
    return children;
  }
  
  return (
    <div 
      itemScope 
      itemType="https://schema.org/SoftwareApplication"
      className="flex flex-col h-full overflow-hidden"
    >
      <meta itemProp="name" content={model.name} />
      <meta itemProp="description" content={model.description || `AI language model available on AkashChat`} />
      <meta itemProp="applicationCategory" content="ArtificialIntelligenceApplication" />
      <meta itemProp="applicationSubCategory" content="AI Chat" />
      <meta itemProp="url" content={`https://chat.akash.network/models/${modelId}`} />
      
      {children}
    </div>
  );
} 