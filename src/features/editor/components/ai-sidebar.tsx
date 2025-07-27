import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useGenerateImage } from '@/features/ai/api/use-generate-image';
import { type ActiveTool, type Editor } from '@/features/editor/types';
import { usePaywall } from '@/features/subscriptions/hooks/use-paywall';
import { cn } from '@/lib/utils';

import { ToolSidebarClose } from './tool-sidebar-close';
import { ToolSidebarHeader } from './tool-sidebar-header';

interface AiSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const AiSidebar = ({ editor, activeTool, onChangeActiveTool }: AiSidebarProps) => {
  const { shouldBlock, triggerPaywall } = usePaywall();
  const [prompt, setPrompt] = useState('');

  const { mutate: generateImage, isPending: isGeneratingImage } = useGenerateImage();

  const onClose = () => onChangeActiveTool('select');

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Skip paywall in demo mode (when no auth)
    const isDemo = window.location.pathname.includes('/demo');
    if (!isDemo && shouldBlock) return triggerPaywall();

    console.log('🎨 Generating image with prompt:', prompt);
    
    generateImage(
      { prompt },
      {
        onSuccess: (response) => {
          console.log('✅ Image generated successfully:', response);
          const imageUrl = (response as any)?.data;
          if (imageUrl) {
            editor?.addImage(imageUrl);
            setPrompt('');
            toast.success('Image generated successfully!');
          } else {
            console.error('No image URL in response');
            toast.error('Failed to get image URL');
          }
        },
        onError: (error: any) => {
          console.error('❌ Image generation failed:', error);
          
          // Parse error message for better user feedback
          let errorMessage = 'Failed to generate image. Please try again.';
          
          if (error?.response) {
            const errorData = error.response;
            if (errorData.error) {
              if (errorData.error.includes('quota')) {
                errorMessage = '💳 OpenAI quota exceeded. Please check your billing settings.';
              } else if (errorData.error.includes('API key')) {
                errorMessage = '🔑 OpenAI API key issue. Please check your configuration.';
              } else {
                errorMessage = `❌ ${errorData.error}`;
              }
            }
          }
          
          toast.error(errorMessage);
        },
      },
    );
  };

  return (
    <aside className={cn('relative z-40 flex h-full w-[360px] flex-col border bg-white', activeTool === 'ai' ? 'visible' : 'hidden')}>
      <ToolSidebarHeader 
        title="AI Image Generator" 
        description={`Generate images using ${process.env.NEXT_PUBLIC_OPENAI_ENABLED === 'true' ? 'OpenAI DALL-E 3' : 'AI technology'}.`} 
      />

      <ScrollArea>
        <form className="space-y-6 p-4" onSubmit={onSubmit}>
          <Textarea
            disabled={isGeneratingImage}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A majestic lion in a golden savanna at sunset, photorealistic, high detail..."
            cols={30}
            rows={10}
            required
            minLength={10}
            className="resize-y"
          />

          <Button disabled={isGeneratingImage} type="submit" className="w-full">
            Generate
          </Button>
        </form>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};
