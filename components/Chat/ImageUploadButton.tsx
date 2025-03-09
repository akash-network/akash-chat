import React, { FC, useRef, useState } from 'react';
import Image from 'next/image';
import { Spinner } from '../Global/Spinner';
import { processImageWithOCR } from '@/utils/app/image';

interface ImageUploadButtonProps {
  selectedImage: File | null;
  imagePreview: string | null;
  isProcessingImage: boolean;
  onSelectImage: (file: File) => void;
  onRemoveImage: () => void;
}

export const ImageUploadButton: FC<ImageUploadButtonProps> = ({
  selectedImage,
  imagePreview,
  isProcessingImage,
  onSelectImage,
  onRemoveImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [showTextPreview, setShowTextPreview] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onSelectImage(file);
      setExtractedText(null);
      setShowTextPreview(false);
      
      // If we have a preview, process it with OCR
      if (imagePreview) {
        handleProcessImage(imagePreview);
      }
    }
  };
  
  const handleProcessImage = async (imageData: string) => {
    try {
      const result = await processImageWithOCR(imageData);
      if (result.text) {
        setExtractedText(result.text.trim());
      }
    } catch (error) {
      console.error('Error processing image preview:', error);
    }
  };
  
  // Process the image when the preview is available
  React.useEffect(() => {
    if (imagePreview && !extractedText && !isProcessingImage) {
      handleProcessImage(imagePreview);
    }
  }, [imagePreview, extractedText, isProcessingImage]);

  return (
    <>
      {imagePreview && (
        <div className="mx-2 mt-2 flex flex-col rounded-md border border-neutral-200 p-2 dark:border-neutral-600">
          <div className="flex items-center space-x-2">
            <div className="relative h-20 w-20">
              <Image 
                src={imagePreview} 
                alt="Selected image" 
                width={80}
                height={80}
                style={{ objectFit: 'contain' }}
              />
              {isProcessingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
                  <Spinner size="24" className="text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex space-x-2">
                <button
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  onClick={onRemoveImage}
                  disabled={isProcessingImage}
                >
                  Remove
                </button>
                {extractedText && (
                  <button
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                    onClick={() => setShowTextPreview(!showTextPreview)}
                  >
                    {showTextPreview ? 'Hide text' : 'Show extracted text'}
                  </button>
                )}
              </div>
              {isProcessingImage && (
                <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Extracting text...
                </div>
              )}
            </div>
          </div>
          
          {showTextPreview && extractedText && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm max-h-32 overflow-y-auto">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                This text will be provided as context to the AI model:
              </div>
              <pre className="whitespace-pre-wrap font-sans">{extractedText}</pre>
            </div>
          )}
        </div>
      )}
      
      <button
        className="absolute right-12 bottom-2.5 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
        onClick={() => fileInputRef.current?.click()}
        title="Upload image"
        disabled={isProcessingImage}
      >
        <svg 
          stroke="currentColor" 
          fill="none" 
          strokeWidth="2" 
          viewBox="0 0 24 24" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
          <path d="M16 5h6v6"></path>
          <path d="M8 12l8-8"></path>
        </svg>
      </button>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}; 