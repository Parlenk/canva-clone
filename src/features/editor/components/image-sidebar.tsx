import { createId } from '@paralleldrive/cuid2';
import { AlertTriangle, Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type ActiveTool, type Editor } from '@/features/editor/types';
import { cn } from '@/lib/utils';

import { ToolSidebarClose } from './tool-sidebar-close';
import { ToolSidebarHeader } from './tool-sidebar-header';

interface ImageSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const ImageSidebar = ({ editor, activeTool, onChangeActiveTool }: ImageSidebarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onClose = () => onChangeActiveTool('select');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== Image Upload Started ===');
    const file = event.target.files?.[0];
    console.log('File selected:', file?.name, file?.type, file?.size);
    
    if (file && editor) {
      console.log('Editor available:', !!editor);
      console.log('Canvas available:', !!editor.canvas);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('FileReader onload triggered');
        const result = e.target?.result as string;
        console.log('Data URL created, length:', result?.length);
        
        if (result) {
          console.log('Calling editor.addImage with data URL...');
          try {
            editor.addImage(result);
            console.log('✅ editor.addImage called successfully');
          } catch (error) {
            console.error('❌ Error calling editor.addImage:', error);
          }
        } else {
          console.error('❌ No result from FileReader');
        }
      };
      
      reader.onerror = (error) => {
        console.error('❌ FileReader error:', error);
      };
      
      console.log('Starting to read file as data URL...');
      reader.readAsDataURL(file);
    } else {
      console.error('❌ Missing file or editor:', { file: !!file, editor: !!editor });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <aside className={cn('relative z-40 flex h-full w-[360px] flex-col border bg-white', activeTool === 'images' ? 'visible' : 'hidden')}>
      <ToolSidebarHeader title="Images" description="Add images to your canvas." />

      <div className="border-b p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button 
          onClick={handleUploadClick}
          className="w-full"
          variant="default"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Image
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Demo Mode</p>
          <p className="text-xs text-muted-foreground">
            Upload your own images using the button above.
            Stock images require API configuration.
          </p>
        </div>
      </div>

      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};
