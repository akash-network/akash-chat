/**
 * Processes an image with Ollama LLaVA model to get a detailed description
 * @param imageData Base64 encoded image data or data URL
 * @returns The description from the LLaVA model
 */
export const processImageWithVision = async (imageData: string): Promise<{
  description: string;
  model?: string;
  error?: string;
}> => {
  try {
    const response = await fetch('/api/vision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageData }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // If there's a fallback description provided, use it
      if (data.fallbackDescription) {
        return { 
          description: data.fallbackDescription,
          error: data.error || 'Failed to process image with LLaVA model'
        };
      }
      
      return { 
        description: '',
        error: data.error || 'Failed to process image with LLaVA model'
      };
    }
    
    return {
      description: data.description || '',
      model: data.model
    };
  } catch (error) {
    console.error('Error processing image with LLaVA model:', error);
    return { 
      description: 'Unable to analyze image. The Ollama LLaVA model service may be unavailable.',
      error: 'Error processing image with LLaVA model'
    };
  }
};

/**
 * Converts a File object to a data URL
 * @param file The file to convert
 * @returns A Promise that resolves to the data URL
 */
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}; 