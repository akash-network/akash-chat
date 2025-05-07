import { ContextFile } from '@/app/context/ChatContext';
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
}

const extractPdfText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
  }
  
  return fullText;
};

export const handleFileSelect = async (files: File[]): Promise<ContextFile[]> => {
  return await Promise.all(
    files.map(async (file) => {
      let content: string;
      let type = file.type || 'text/plain';
      const extension = file.name.split('.').pop()?.toLowerCase();

      // Handle different file types
      if (extension === 'pdf' || type === 'application/pdf') {
        type = 'application/pdf';
        content = await extractPdfText(file);
      } else {
        content = await file.text();
      }

      const preview = content.slice(0, 500) + (content.length > 500 ? '...' : '');
      
      // Set the correct MIME type based on extension
      if (extension) {
        switch (extension) {
          case 'md':
            type = 'text/markdown';
            break;
          case 'json':
            type = 'application/json';
            break;
          case 'txt':
            type = 'text/plain';
            break;
        }
      }
      
      return {
        id: Math.random().toString(36).slice(2),
        name: file.name,
        content,
        type,
        preview,
      };
    })
  );
}; 