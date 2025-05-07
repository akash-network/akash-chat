import { MetadataRoute } from 'next'

import { models, defaultModel } from '@/app/config/models'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://chat.akash.network'
  const currentDate = new Date()
  
  // Base routes
  const routes = [
    {
      url: `${baseUrl}/`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/models/`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/terms/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ] as MetadataRoute.Sitemap

  // Add routes for all models with enhanced priorities for available and default models
  const modelRoutes = models.map(model => ({
    url: `${baseUrl}/models/${model.id}/`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    // Assign higher priority to available models and default model
    priority: model.id === defaultModel ? 0.9 : model.available ? 0.8 : 0.6,
  })) as MetadataRoute.Sitemap

  return [
    ...routes,
    ...modelRoutes,
  ]
} 