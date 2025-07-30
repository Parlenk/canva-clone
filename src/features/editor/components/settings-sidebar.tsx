import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type ActiveTool, type Editor } from '@/features/editor/types';
import { cn } from '@/lib/utils';

import { ColorPicker } from './color-picker';
import { ToolSidebarClose } from './tool-sidebar-close';
import { ToolSidebarHeader } from './tool-sidebar-header';

interface SettingsSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const SettingsSidebar = ({ editor, activeTool, onChangeActiveTool }: SettingsSidebarProps) => {
  const workspace = editor?.getWorkspace();

  const initialWidth = useMemo(() => `${workspace?.width ?? 0}`, [workspace]);
  const initialHeight = useMemo(() => `${workspace?.height ?? 0}`, [workspace]);
  const initialBackground = useMemo(() => workspace?.fill ?? '#fff', [workspace]);

  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [background, setBackground] = useState(initialBackground);
  const [resizeMethod, setResizeMethod] = useState<'ai-powered'>('ai-powered');

  useEffect(() => {
    setWidth(initialWidth);
    setHeight(initialHeight);
    setBackground(initialBackground);
  }, [initialWidth, initialHeight, initialBackground]);

  const changeWidth = (width: string) => setWidth(width);
  const changeHeight = (height: string) => setHeight(height);
  const changeBackground = (background: string) => {
    setBackground(background);
    editor?.changeBackground(background);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const currentWorkspace = editor?.getWorkspace();
    const currentSize = {
      width: currentWorkspace?.width || 0,
      height: currentWorkspace?.height || 0,
    };

    const newSize = {
      width: parseInt(width, 10),
      height: parseInt(height, 10),
    };

    console.log('=== RESIZE CLICKED ===');
    console.log('Resize method:', resizeMethod);
    console.log('Current size:', currentSize);
    console.log('New size:', newSize);

    // ONLY TRUE AI RESIZE ALLOWED
    if (resizeMethod === 'ai-powered') {
      // Use AI-powered resize
      console.log('🤖 Applying AI-powered resize with 3-step process...');
      console.log('📐 Step 1: Proportional scaling');
      console.log('🔀 Step 2: Smart arrangement');
      console.log('📦 Step 3: Space filling');
      
      if (editor?.aiPoweredResize) {
        await editor.aiPoweredResize(currentSize, newSize);
        console.log('✅ TRUE AI resize completed successfully!');
      } else {
        console.error('❌ TRUE AI resize not available - STOPPING');
        throw new Error('TRUE AI ONLY MODE: AI resize function not available');
      }
    }
  };

  const onClose = () => onChangeActiveTool('select');

  return (
    <aside className={cn('relative z-40 flex h-full w-[360px] flex-col border bg-white', activeTool === 'settings' ? 'visible' : 'hidden')}>
      <ToolSidebarHeader title="Settings" description="Change the look of your workspace." />

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

          <Button type="submit" className="w-full">
            {resizeMethod === 'ai-powered' ? 'TRUE AI Resize 🤖' : 'Resize'}
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
