import { FileText, X, Loader2 } from "lucide-react";
import * as React from "react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

import { trackEvent } from '@/lib/analytics';
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";

interface FileUploadProps {
  onFileSelect: (files: File[]) => Promise<void>;
  acceptedFileTypes?: string[];
  maxFiles?: number;
  className?: string;
}

interface UploadedFile {
  file: File;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export function FileUpload({
  onFileSelect,
  acceptedFileTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/json'],
  maxFiles = 5,
  className,
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      trackEvent.fileUpload(acceptedFiles[0].type);
    }
    // Filter out files that would exceed the maxFiles limit
    const availableSlots = maxFiles - uploadedFiles.length;
    const filesToUpload = acceptedFiles.slice(0, availableSlots);

    // Add files to state as 'uploading'
    const newFiles = filesToUpload.map(file => ({
      file,
      status: 'uploading' as const,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    try {
      await onFileSelect(filesToUpload);
      // Update status to success
      setUploadedFiles(prev =>
        prev.map(f =>
          newFiles.some(nf => nf.file === f.file)
            ? { ...f, status: 'success' as const }
            : f
        )
      );
    } catch (error) {
      // Update status to error
      setUploadedFiles(prev =>
        prev.map(f =>
          newFiles.some(nf => nf.file === f.file)
            ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'Upload failed' }
            : f
        )
      );
    }
  }, [maxFiles, uploadedFiles.length, onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({
      ...acc,
      [type]: []
    }), {}),
    maxFiles: maxFiles - uploadedFiles.length,
    disabled: uploadedFiles.length >= maxFiles,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50",
          uploadedFiles.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <FileText className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? "Drop files here"
              : uploadedFiles.length >= maxFiles
              ? "Maximum files reached"
              : "Drag & drop files here, or click to select"}
          </p>
          <p className="text-xs text-muted-foreground">
            Supported files: {acceptedFileTypes.map(type => type.split('/')[1]).join(", ")}
          </p>
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadedFiles.map(({ file, status, error }) => (
            <div
              key={file.name}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted"
            >
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1 text-sm truncate" title={file.name}>
                {file.name}
              </span>
              {status === 'uploading' && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {status === 'error' && (
                <span className="text-xs text-destructive" title={error}>
                  Error
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeFile(file)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 