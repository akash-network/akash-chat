import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function ModelNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
      <h1 className="text-3xl font-bold mb-4">Model Not Found</h1>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        The requested AI model could not be found or is currently unavailable.
      </p>
      <Button asChild>
        <Link href="/models">
          View Available Models
        </Link>
      </Button>
    </div>
  );
} 