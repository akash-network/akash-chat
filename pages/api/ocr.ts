import { NextApiRequest, NextApiResponse } from 'next';
import Tesseract from 'tesseract.js';

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

    // Remove the data URL prefix if present
    const base64Data = image.includes('base64,') 
      ? image.split('base64,')[1] 
      : image;

    // Process the image with Tesseract.js
    const result = await Tesseract.recognize(
      `data:image/jpeg;base64,${base64Data}`,
      'eng',
      { 
        logger: m => console.log(m) 
      }
    );

    // Extract the text from the result
    const extractedText = result.data.text;

    return res.status(200).json({ 
      text: extractedText,
      confidence: result.data.confidence
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    return res.status(500).json({ error: 'Failed to process image' });
  }
} 