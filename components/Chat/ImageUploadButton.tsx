import { FC, useRef } from 'react';
import Image from 'next/image';

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onSelectImage(file);
    }
  };

  return (
    <>
      {imagePreview && (
        <div className="mx-2 mt-2 flex items-center space-x-2 rounded-md border border-neutral-200 p-2 dark:border-neutral-600">
          <div className="relative h-20 w-20">
            <Image 
              src={imagePreview} 
              alt="Selected image" 
              width={80}
              height={80}
              style={{ objectFit: 'contain' }}
            />
          </div>
          <button
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            onClick={onRemoveImage}
          >
            Remove
          </button>
          {isProcessingImage && (
            <div className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">
              Processing image...
            </div>
          )}
        </div>
      )}
      
      <button
        className="absolute right-12 bottom-2.5 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
        onClick={() => fileInputRef.current?.click()}
        title="Upload image"
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