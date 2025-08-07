'use client';

import { ToolSidebarClose } from './tool-sidebar-close';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { AdobeAIImport } from './adobe-ai-import';
import { cn } from '@/lib/utils';

import type { ActiveTool, Editor } from '@/features/editor/types';

interface AdobeAISidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor: Editor | undefined;
}

export const AdobeAISidebar = ({ activeTool, onChangeActiveTool, editor }: AdobeAISidebarProps) => {
  console.log('📁 Adobe AI Sidebar rendered, activeTool:', activeTool);
  
  const onClose = () => {
    onChangeActiveTool('select');
  };

  const onImportSuccess = (canvasData: any) => {
    if (!editor) return;

    try {
      // Import the Adobe AI canvas data using the specialized method
      editor.importAdobeAI(canvasData);
      console.log('✅ Adobe AI file successfully imported to canvas');
    } catch (error) {
      console.error('❌ Failed to import Adobe AI file to canvas:', error);
    }
  };

  console.log('🔍 Adobe AI Sidebar render check:', { activeTool, isVisible: activeTool === 'adobe-ai' });
  
  if (activeTool === 'adobe-ai') {
    console.log('✅ Adobe AI Sidebar should be VISIBLE now!');
  }

  return (
    <aside
      className={cn('relative z-40 flex h-full w-[360px] flex-col border bg-white', activeTool === 'adobe-ai' ? 'visible' : 'hidden')}
    >
      <ToolSidebarHeader title="Import Adobe AI File" description="Upload and convert .ai files to canvas" />
      
      <div className="flex-1 overflow-y-auto p-4">
        <AdobeAIImport 
          onImportSuccess={onImportSuccess}
          onClose={onClose}
        />
      </div>

      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};