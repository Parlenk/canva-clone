import { Minimize, ZoomIn, ZoomOut } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Hint } from '@/components/hint';
import { Button } from '@/components/ui/button';
import type { Editor } from '@/features/editor/types';

interface FooterProps {
  editor: Editor | undefined;
}

export const Footer = ({ editor }: FooterProps) => {
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    const updateZoom = () => {
      if (editor?.canvas) {
        const zoom = editor.canvas.getZoom();
        const zoomPercent = Math.round(zoom * 100);
        setZoomLevel(zoomPercent);
      }
    };

    // Update zoom on canvas events and viewport changes
    if (editor?.canvas) {
      editor.canvas.on('after:render', updateZoom);
      editor.canvas.on('viewport:transform', updateZoom);
      updateZoom(); // Initial update
    }

    return () => {
      if (editor?.canvas) {
        editor.canvas.off('after:render', updateZoom);
        editor.canvas.off('viewport:transform', updateZoom);
      }
    };
  }, [editor?.canvas]);

  return (
    <footer className="z-[49] flex h-[52px] w-full shrink-0 flex-row-reverse items-center gap-x-1 overflow-x-auto border-t bg-white p-2 px-4">
      <Hint label="Reset" side="top" sideOffset={10}>
        <Button onClick={() => editor?.autoZoom()} size="icon" variant="ghost" className="h-full">
          <Minimize className="size-4" />
        </Button>
      </Hint>

      <Hint label="Zoom in" side="top" sideOffset={10}>
        <Button onClick={() => editor?.zoomIn()} size="icon" variant="ghost" className="h-full">
          <ZoomIn className="size-4" />
        </Button>
      </Hint>

      {/* Zoom Percentage Display */}
      <div className="flex items-center justify-center min-w-[60px] h-full text-xs font-medium text-gray-600 bg-gray-50 rounded mx-1">
        {zoomLevel}%
      </div>

      <Hint label="Zoom out" side="top" sideOffset={10}>
        <Button onClick={() => editor?.zoomOut()} size="icon" variant="ghost" className="h-full">
          <ZoomOut className="size-4" />
        </Button>
      </Hint>
    </footer>
  );
};
