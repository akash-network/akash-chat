import React, { FC, useRef, useState } from 'react';
import Image from 'next/image';
import { Spinner } from '../Global/Spinner';
import { processImageWithVision } from '@/utils/app/image';

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
  const [imageDescription, setImageDescription] = useState<string | null>(null);
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);
  
  const handleProcessImage = async (imageData: string) => {
    try {
      const result = await processImageWithVision(imageData);
      if (result.description) {
        setImageDescription(result.description.trim());
      }
    } catch (error) {
      console.error('Error processing image with LLaVA model:', error);
    }
  };
  
  // Process the image when the preview is available
  React.useEffect(() => {
    if (imagePreview && !imageDescription && !isProcessingImage) {
      handleProcessImage(imagePreview);
    }
  }, [imagePreview, imageDescription, isProcessingImage]);

  // Don't render anything if there's no image preview
  if (!imagePreview) return null;

  return (
    <div className="w-full">
      {/* Image Preview Section */}
      <div className="mx-2 mb-2 flex items-center rounded-md border border-neutral-200 p-2 dark:border-neutral-600">
        {/* Thumbnail */}
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
          <Image 
            src={imagePreview} 
            alt="Selected image" 
            width={64}
            height={64}
            style={{ objectFit: 'cover' }}
            className="rounded-md"
          />
          {isProcessingImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
              <Spinner size="16" className="text-white" />
            </div>
          )}
        </div>
        
        {/* Info and Actions */}
        <div className="ml-3 flex flex-col flex-grow">
          <div className="flex justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Image Attached
            </h4>
            <button
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
              onClick={onRemoveImage}
              disabled={isProcessingImage}
            >
              Remove
            </button>
          </div>
          {isProcessingImage && (
            <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Analyzing photo...
            </div>
          )}
          {imageDescription && !isProcessingImage && (
            <div className="mt-1">
              <button
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium flex items-center"
                onClick={() => setShowDescriptionPreview(!showDescriptionPreview)}
              >
                {showDescriptionPreview ? 'Hide analysis' : 'Show analysis'}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className={`h-3 w-3 ml-1 transition-transform ${showDescriptionPreview ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Analysis Preview */}
      {showDescriptionPreview && imageDescription && (
        <div className="mx-2 mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-xs max-h-32 overflow-y-auto">
          <p className="whitespace-pre-wrap font-sans">{imageDescription}</p>
        </div>
      )}
    </div>
  );
}; 