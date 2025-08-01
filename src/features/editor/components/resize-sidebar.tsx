import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AILoading } from '@/components/ui/ai-loading';
import { type ActiveTool, type Editor } from '@/features/editor/types';
import { cn } from '@/lib/utils';

import { ColorPicker } from './color-picker';
import { ToolSidebarClose } from './tool-sidebar-close';
import { ToolSidebarHeader } from './tool-sidebar-header';

interface ResizeSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const ResizeSidebar = ({ editor, activeTool, onChangeActiveTool }: ResizeSidebarProps) => {
  const workspace = editor?.getWorkspace?.();

  const initialWidth = useMemo(() => `${(workspace as any)?.width ?? 400}`, [workspace]);
  const initialHeight = useMemo(() => `${(workspace as any)?.height ?? 400}`, [workspace]);
  const initialBackground = useMemo(() => (workspace as any)?.fill ?? '#fff', [workspace]);

  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [background, setBackground] = useState(initialBackground);
  const [resizeMethod, setResizeMethod] = useState<'ai-powered'>('ai-powered');
  const [isAIResizing, setIsAIResizing] = useState(false);

  useEffect(() => {
    setWidth(initialWidth);
    setHeight(initialHeight);
    setBackground(initialBackground);
  }, [initialWidth, initialHeight, initialBackground]);

  const changeWidth = (width: string) => setWidth(width);
  const changeHeight = (height: string) => setHeight(height);
  const changeBackground = (background: string) => {
    setBackground(background);
    if (editor?.changeBackground) {
      editor.changeBackground(background);
    } else {
      console.warn('⚠️ changeBackground function not available');
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate inputs
    const newWidth = parseInt(width, 10);
    const newHeight = parseInt(height, 10);
    
    if (isNaN(newWidth) || isNaN(newHeight) || newWidth < 100 || newHeight < 100) {
      console.error('❌ Invalid dimensions provided');
      return;
    }

    // Enhanced error checking
    if (!editor) {
      console.error('❌ Editor is not available');
      alert('Editor is not ready. Please wait for the canvas to load.');
      return;
    }

    if (!editor.getWorkspace) {
      console.error('❌ getWorkspace function is not available in editor');
      alert('Editor functions are not ready. Please refresh the page.');
      return;
    }

    const currentWorkspace = editor.getWorkspace();
    if (!currentWorkspace) {
      console.error('❌ Workspace not found - canvas may not be initialized');
      alert('Canvas workspace is not ready. Please create some content first.');
      return;
    }

    const currentSize = {
      width: (currentWorkspace as any)?.width || 400,
      height: (currentWorkspace as any)?.height || 400,
    };

    const newSize = {
      width: newWidth,
      height: newHeight,
    };

    console.log('=== RESIZE CLICKED ===');
    console.log('Resize method:', resizeMethod);
    console.log('Current size:', currentSize);
    console.log('New size:', newSize);

    // Prevent multiple simultaneous requests
    if (isAIResizing) {
      console.warn('⚠️ AI resize already in progress, ignoring request');
      return;
    }

    // ONLY TRUE AI RESIZE ALLOWED
    if (resizeMethod === 'ai-powered') {
      try {
        setIsAIResizing(true);
        
        // Use AI-powered resize
        console.log('🤖 Starting AI-powered resize...');
        console.log('📐 Step 1: Canvas analysis');
        console.log('🔀 Step 2: Intelligent repositioning');
        console.log('📦 Step 3: Final optimization');
        
        if (!editor?.aiPoweredResize) {
          throw new Error('AI resize function not available');
        }

        // Clear any previous errors
        console.log('🔄 Clearing previous state for fresh resize...');
        
        // Execute AI resize
        await editor.aiPoweredResize(currentSize, newSize);
        
        console.log('✅ AI resize completed successfully!');
        
        // Update form values to reflect the new canvas size
        setWidth(newSize.width.toString());
        setHeight(newSize.height.toString());
        
      } catch (error) {
        console.error('❌ AI resize failed:', error);
        
        // Show user-friendly error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('💬 User-facing error:', errorMessage);
        
        // You could add a toast notification here in the future
        alert(`AI Resize failed: ${errorMessage}\n\nPlease try again or check the console for details.`);
        
      } finally {
        // Always reset loading state
        setIsAIResizing(false);
        console.log('🔄 Loading state reset, ready for next resize');
      }
    }
  };

  const onClose = () => onChangeActiveTool('select');

  return (
    <aside className={cn('relative z-40 flex h-full w-[360px] flex-col border bg-white', activeTool === 'settings' ? 'visible' : 'hidden')}>
      <ToolSidebarHeader title="Resize" description="Change the size of your workspace." />

      {isAIResizing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg border">
            <AILoading text="AI is analyzing your design..." size="lg" className="justify-center" />
            <p className="text-sm text-gray-600 mt-3 text-center">
              This may take a few seconds while our AI analyzes your canvas
            </p>
          </div>
        </div>
      )}

      <ScrollArea>
        <form className="space-y-4 p-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label>Height</Label>
            <Input placeholder="Height" min={100} max={5000} value={height} type="number" onChange={(e) => changeHeight(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Width</Label>
            <Input placeholder="Width" min={100} max={5000} value={width} type="number" onChange={(e) => changeWidth(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Resize Method</Label>
            <Select value={resizeMethod} onValueChange={(value: 'ai-powered') => setResizeMethod(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select resize method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ai-powered">
                  TRUE AI Resize 🤖 (OpenAI Vision) - ONLY OPTION
                </SelectItem>
              </SelectContent>
            </Select>
            {resizeMethod === 'ai-powered' && (
              <div className="text-xs text-gray-600 mt-1">
                <span className="text-green-600">🤖 TRUE AI - Uses OpenAI Vision API to analyze your design</span>
                <div className="text-gray-500 mt-1">
                  • GPT-4 Turbo analyzes your canvas visually<br/>
                  • Understands design intent and visual hierarchy<br/>
                  • Creates professional layouts for new dimensions<br/>
                  • Real AI processing (takes a few seconds)
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isAIResizing}>
            {isAIResizing ? (
              <AILoading text="AI Processing..." size="sm" />
            ) : (
              resizeMethod === 'ai-powered' ? 'TRUE AI Resize 🤖' : 'Resize'
            )}
          </Button>
        </form>

        <div className="border-t p-4">
          <ColorPicker
            color={background as string} // Gradients and patterns are not passed.
            onChange={changeBackground}
          />
        </div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};
