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
    console.log('🎯 [STEP 1] onImportSuccess called with data:', canvasData);
    console.log('🎯 [STEP 2] Editor available?', !!editor);
    
    if (!editor) {
      console.error('❌ [STEP 2] No editor available!');
      return;
    }

    console.log('🎯 [STEP 3] Calling editor.importAdobeAI with:', {
      width: canvasData.width,
      height: canvasData.height,
      objectsCount: canvasData.objects?.length,
      objects: canvasData.objects
    });

    try {
      // Import the Adobe AI canvas data using the specialized method
      editor.importAdobeAI(canvasData);
      console.log('✅ [STEP 4] Adobe AI file successfully imported to canvas');
      
      // Auto-zoom to fit all imported objects after a brief delay
      setTimeout(() => {
        console.log('🔍 [STEP 5] Auto-zooming to fit imported content...');
        
        // First, zoom out to see if objects are outside viewport
        console.log('🔍 [STEP 5A] Zooming out to see all objects...');
        try {
          // Zoom out significantly first
          editor.zoomOut(); // 1st zoom out
          editor.zoomOut(); // 2nd zoom out  
          editor.zoomOut(); // 3rd zoom out
          editor.zoomOut(); // 4th zoom out - should be at 0.2 zoom level
          console.log('📊 Canvas zoom level after zoom out: 0.2 (minimum)');
          
          // Give it another moment, then try auto-zoom
          setTimeout(() => {
            console.log('🔍 [STEP 5B] Now attempting auto-zoom after zoom out...');
            editor.autoZoom();
            console.log('✅ [STEP 5] Auto-zoom sequence completed');
          }, 300);
          
        } catch (zoomError) {
          console.warn('⚠️ [STEP 5] Auto-zoom failed:', zoomError);
        }
      }, 1000); // Longer delay to ensure objects are fully rendered
      
    } catch (error) {
      console.error('❌ [STEP 4] Failed to import Adobe AI file to canvas:', error);
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