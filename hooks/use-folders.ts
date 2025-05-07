import { useState, useEffect, useCallback } from 'react';

export interface Folder {
  id: string;
  name: string;
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);

  // Load folders from localStorage on mount
  useEffect(() => {
    const savedFolders = localStorage.getItem('folders');
    if (savedFolders) {
      try {
        setFolders(JSON.parse(savedFolders));
      } catch (error) {
        console.error('Failed to parse saved folders:', error);
        localStorage.removeItem('folders');
      }
    }
  }, []);

  // Save folders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('folders', JSON.stringify(folders));
  }, [folders]);

  const createFolder = useCallback((name: string) => {
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name,
    };
    setFolders(prev => [...prev, newFolder]);
    return newFolder.id;
  }, []);

  const updateFolder = useCallback((id: string, name: string) => {
    setFolders(prev => 
      prev.map(folder => 
        folder.id === id ? { ...folder, name } : folder
      )
    );
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setFolders(prev => prev.filter(folder => folder.id !== id));
  }, []);

  return {
    folders,
    createFolder,
    updateFolder,
    deleteFolder,
  };
} 