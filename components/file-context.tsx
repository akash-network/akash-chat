import { FileText, X, ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";
import { useState } from "react";

import { ContextFile } from "@/app/context/ChatContext";
import { cn } from "@/lib/utils";

import { FileUpload } from "./file-upload";
import { Button } from "./ui/button";

interface FileContextProps {
  onFilesChange: (files: ContextFile[]) => void;
  className?: string;
}

export function FileContext({ onFilesChange, className }: FileContextProps) {
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const handleFileSelect = async (files: File[]) => {
    const newFiles = await Promise.all(
      files.map(async (file) => {
        const content = await file.text();
        const preview = content.slice(0, 500) + (content.length > 500 ? '...' : '');
        
        return {
          id: Math.random().toString(36).slice(2),
          name: file.name,
          content,
          type: file.type || 'text/plain',
          preview,
        };
      })
    );

    const updatedFiles = [...contextFiles, ...newFiles];
    setContextFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = contextFiles.filter(f => f.id !== fileId);
    setContextFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const toggleFileExpand = (fileId: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <FileUpload
        onFileSelect={handleFileSelect}
        acceptedFileTypes={['.pdf', '.txt', '.md', '.json']}
        maxFiles={5}
      />

      {contextFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Context Files</h3>
          <div className="space-y-2">
            {contextFiles.map((file) => (
              <div
                key={file.id}
                className="rounded-lg border bg-card text-card-foreground shadow-sm"
              >
                <div className="flex items-center gap-2 p-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 text-sm font-medium truncate">
                    {file.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleFileExpand(file.id)}
                  >
                    {expandedFiles.has(file.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {expandedFiles.has(file.id) && (
                  <div className="border-t p-2">
                    <pre className="text-xs whitespace-pre-wrap">
                      {file.preview}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 