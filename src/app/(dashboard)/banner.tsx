'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const canvasSizes = [
  { label: 'Social Media Post', value: '1080x1080', width: 1080, height: 1080 },
  { label: 'Instagram Story', value: '1080x1920', width: 1080, height: 1920 },
  { label: 'Facebook Cover', value: '1640x859', width: 1640, height: 859 },
  { label: 'YouTube Thumbnail', value: '1280x720', width: 1280, height: 720 },
  { label: 'A4 Document', value: '2480x3508', width: 2480, height: 3508 },
  { label: 'Business Card', value: '1050x600', width: 1050, height: 600 },
  { label: 'Custom Size', value: 'custom', width: 800, height: 600 },
];

export const Banner = () => {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState(canvasSizes[0]);

  const handleCreateProject = () => {
    // Create URL with canvas size parameters
    const params = new URLSearchParams({
      width: selectedSize.width.toString(),
      height: selectedSize.height.toString(),
    });
    router.push(`/demo?${params.toString()}`);
  };

  return (
    <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6 min-h-[200px] lg:min-h-[248px] rounded-xl bg-gradient-to-r from-[#2e62cb] via-[#0073ff] to-[#3faff5] p-6 text-white overflow-visible">
      <div className="hidden lg:flex size-28 items-center justify-center rounded-full bg-white/50 shrink-0">
        <div className="flex size-20 items-center justify-center rounded-full bg-white">
          <Sparkles className="h-20 fill-[#0073ff] text-[#0073ff]" />
        </div>
      </div>

      <div className="flex flex-col gap-y-4 flex-1">
        <div>
          <h1 className="text-2xl font-semibold lg:text-3xl">Visualize your ideas with KrediMage</h1>
          <p className="mt-2 text-sm lg:text-base opacity-90">Turn inspiration into design in no time. Choose your canvas size and start creating.</p>
        </div>

        <div className="flex flex-col gap-y-3 relative z-10">
          <label className="text-sm font-medium">Choose Canvas Size:</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Select value={selectedSize.value} onValueChange={(value) => {
                const size = canvasSizes.find(s => s.value === value) || canvasSizes[0];
                setSelectedSize(size);
              }}>
                <SelectTrigger className="w-full sm:w-[240px] bg-white text-gray-900 relative z-10">
                  <SelectValue>
                    {selectedSize.label} ({selectedSize.width}×{selectedSize.height})
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white border shadow-lg max-h-60 overflow-auto">
                  {canvasSizes.map((size) => (
                    <SelectItem key={size.value} value={size.value} className="cursor-pointer hover:bg-gray-100">
                      {size.label} ({size.width}×{size.height})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCreateProject} variant="secondary" className="w-full sm:w-[160px] shrink-0">
              Start creating <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
