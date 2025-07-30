import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type ActiveTool, type Editor } from '@/features/editor/types';
import { cn } from '@/lib/utils';

import { ToolSidebarClose } from './tool-sidebar-close';
import { ToolSidebarHeader } from './tool-sidebar-header';

interface CpaButtonSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const CpaButtonSidebar = ({ editor, activeTool, onChangeActiveTool }: CpaButtonSidebarProps) => {
  const [text, setText] = useState('Click Here');
  const [backgroundColor, setBackgroundColor] = useState('#FF6B35');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [borderRadius, setBorderRadius] = useState(8);
  const [padding, setPadding] = useState(16);
  const [fontSize, setFontSize] = useState(18);
  const [fontWeight, setFontWeight] = useState('bold');

  const onClose = () => onChangeActiveTool('select');

  const createCpaButton = () => {
    if (!editor) return;

    const button = editor.addCpaButton({
      text,
      backgroundColor,
      textColor,
      borderRadius,
      padding,
      fontSize,
      fontWeight,
    });

    onChangeActiveTool('select');
  };

  return (
    <aside className={cn('relative z-40 flex h-full w-[360px] flex-col border bg-white', activeTool === 'cpa-button' ? 'visible' : 'hidden')}>
      <ToolSidebarHeader title="CPA Button" description="Create high-converting call-to-action buttons." />
      
      <ScrollArea>
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label>Button Text</Label>
            <Input 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              placeholder="Click Here"
            />
          </div>

          <div className="space-y-2">
            <Label>Background Color</Label>
            <div className="flex items-center space-x-2">
              <Input 
                type="color" 
                value={backgroundColor} 
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-8 p-1"
              />
              <Input 
                value={backgroundColor} 
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="#FF6B35"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Text Color</Label>
            <div className="flex items-center space-x-2">
              <Input 
                type="color" 
                value={textColor} 
                onChange={(e) => setTextColor(e.target.value)}
                className="w-12 h-8 p-1"
              />
              <Input 
                value={textColor} 
                onChange={(e) => setTextColor(e.target.value)}
                placeholder="#FFFFFF"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Border Radius (px)</Label>
            <Input 
              type="number" 
              value={borderRadius} 
              onChange={(e) => setBorderRadius(parseInt(e.target.value))}
              min={0}
              max={50}
            />
          </div>

          <div className="space-y-2">
            <Label>Padding (px)</Label>
            <Input 
              type="number" 
              value={padding} 
              onChange={(e) => setPadding(parseInt(e.target.value))}
              min={8}
              max={40}
            />
          </div>

          <div className="space-y-2">
            <Label>Font Size (px)</Label>
            <Input 
              type="number" 
              value={fontSize} 
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              min={12}
              max={36}
            />
          </div>

          <div className="space-y-2">
            <Label>Font Weight</Label>
            <select 
              value={fontWeight} 
              onChange={(e) => setFontWeight(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="bolder">Bolder</option>
              <option value="lighter">Lighter</option>
            </select>
          </div>

          <Button 
            onClick={createCpaButton} 
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            Create CPA Button
          </Button>

          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">💡 CPA Button Tips</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use action-oriented text like "Get Started" or "Download Now"</li>
              <li>• High contrast colors improve conversion rates</li>
              <li>• Large buttons are more clickable</li>
              <li>• Orange/red buttons often perform best</li>
            </ul>
          </div>
        </div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};