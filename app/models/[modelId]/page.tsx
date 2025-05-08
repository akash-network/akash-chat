import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { models } from '@/app/config/models';
import { ModelDetailClient } from '@/components/models/model-detail-client';

// This function will be executed at build time for static pages
// and at request time for dynamic pages
export async function generateStaticParams() {
  return models.map(model => ({
    modelId: model.id,
  }));
}

export async function generateMetadata(props: {
  params: Promise<{ modelId: string }>
}): Promise<Metadata> {
  const { modelId } = await props.params;
  const model = models.find(m => m.id.toLowerCase() === modelId.toLowerCase());
  
  if (!model) {
    return {
      title: 'Model Not Found - AkashChat',
      description: 'The requested AI model could not be found on AkashChat.',
    };
  }

  return {
    title: `${model.name} - AI Model | AkashChat`,
    description: model.aboutContent || model.description || `Learn about and chat with ${model.name}, an advanced AI model powered by the Akash Supercloud.`,
    openGraph: {
      title: `${model.name} - AI Model | AkashChat`,
      description: model.aboutContent || model.description || `Learn about and chat with ${model.name}, an advanced AI model powered by the Akash Supercloud.`,
      url: `https://chat.akash.network/models/${modelId}/`,
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${model.name} - AI Model on AkashChat`
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${model.name} - AI Model | AkashChat`,
      description: model.aboutContent || model.description || `Learn about and chat with ${model.name}, an advanced AI model powered by the Akash Supercloud.`,
      images: ['/og-image.png']
    },
    alternates: {
      canonical: `/models/${modelId}/`,
    },
    keywords: ['AI model', model.name, 'language model', 'Akash Network', 'LLM', 'machine learning', 'chat model', 'AI conversation', model.hf_repo || '', model.architecture || '', model.parameters + ' parameters', model.tokenLimit?.toString() + ' context length' || ''],
  };
}

export default async function ModelIntroPage(props: {
  params: Promise<{ modelId: string }>
}) {
  const { modelId } = await props.params;
  const model = models.find(m => m.id.toLowerCase() === modelId.toLowerCase());
  
  // If model not found, show 404 page
  if (!model) {
    notFound();
  }

  return (
    <>
      {/* Pre-render model data on the server for better SEO */}
      <article 
        className="model-detail"
        itemScope 
        itemType="https://schema.org/WebApplication"
      >
        {/* Web Application Properties */}
        <meta itemProp="name" content="AkashChat" />
        <meta itemProp="description" content="A platform for chatting with various AI language models" />
        <meta itemProp="applicationCategory" content="ChatApplication" />
        <meta itemProp="operatingSystem" content="Any" />
        <meta itemProp="url" content={`https://chat.akash.network/models/${modelId}/`} />
        
        {/* Chat Service Properties */}
        <div itemProp="offers" itemScope itemType="https://schema.org/Service">
          <meta itemProp="name" content={`Chat with ${model.name}`} />
          <meta itemProp="description" content={model.aboutContent || model.description} />
          <meta itemProp="serviceType" content="AI Chat Service" />
          <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
            <meta itemProp="price" content="0" />
            <meta itemProp="priceCurrency" content="USD" />
          </div>
        </div>

        {/* AI Model Properties */}
        <div itemProp="about" itemScope itemType="https://schema.org/SoftwareApplication">
          <meta itemProp="name" content={model.name} />
          <meta itemProp="description" content={model.aboutContent || model.description} />
          <meta itemProp="applicationCategory" content="ArtificialIntelligenceApplication" />
          <meta itemProp="featureList" content={`Parameters: ${model.parameters}, Architecture: ${model.architecture}, Token Limit: ${model.tokenLimit}, Hugging Face Repo: ${model.hf_repo}`} />
          <meta itemProp="softwareVersion" content="1.0" />
        </div>

        {/* Publisher Information */}
        <div itemProp="publisher" itemScope itemType="https://schema.org/Organization">
          <meta itemProp="name" content="Akash Network" />
          <meta itemProp="url" content="https://akash.network" />
        </div>
        
        <div className="max-w-4xl mx-auto p-4">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2" itemProp="name">{model.name}</h1>
            <p className="text-muted-foreground" itemProp="description">
              { model.description || "An AI language model for chat and text generation."}
            </p>
            {/* Add hidden accessible metadata for search engines */}
            <div className="sr-only">
              <p>Model ID: {model.id}</p>
              <p>Token Limit: {model.tokenLimit ? `${(model.tokenLimit / 1000).toFixed(0)}K` : 'Standard'}</p>
              <p>Availability: {model.available ? 'Available' : 'Currently Unavailable'}</p>
              <p>Parameters: {model.parameters}</p>
              <p>Architecture: {model.architecture}</p>
              <p>Temperature: {model.temperature}</p>
              <p>Top P: {model.top_p}</p>
              <p>Hugging Face Repo: {model.hf_repo}</p>
            </div>
          </header>
        </div>
      </article>
      
      {/* Client component for interactive elements */}
      <ModelDetailClient modelId={modelId} model={model} />
    </>
  );
} 