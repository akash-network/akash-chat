import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase the size limit for image uploads
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Extract base64 data from data URL if needed
    const base64Image = image.includes('base64,') 
      ? image.split('base64,')[1] 
      : image;

    // Call Ollama's API with the LLaVA model
    // Adjust the URL to your Ollama server address if needed
    const ollamaResponse = await axios.post(
      'http://localhost:11434/api/generate',
      {
        model: 'llava',
        prompt: 'Describe this image in detail. Include any text, objects, people, and other relevant information visible in the image.',
        images: [base64Image],
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract the description from Ollama's response
    const description = ollamaResponse.data.response;
    
    return res.status(200).json({ 
      description,
      model: 'llava'
    });
  } catch (error) {
    console.error('Ollama API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process image with Ollama LLaVA model',
      details: error instanceof Error ? error.message : String(error),
      fallbackDescription: "This is an image uploaded by the user. I couldn't analyze it because the Ollama LLaVA model service is unavailable or encountered an error."
    });
  }
}
