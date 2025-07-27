'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export const TemplatesSection = () => {
  const router = useRouter();

  const handleStartCreating = () => {
    router.push('/demo');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Start from a template</h2>
      </div>
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground mb-4">
          Create beautiful designs with our professional templates
        </p>
        <Button onClick={handleStartCreating} variant="outline">
          Browse Templates
        </Button>
      </div>
    </div>
  );
};