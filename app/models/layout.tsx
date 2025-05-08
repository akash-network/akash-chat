import { ModelsLayoutClient } from '@/components/models/models-layout-client';

export default function ModelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModelsLayoutClient>{children}</ModelsLayoutClient>;
} 
