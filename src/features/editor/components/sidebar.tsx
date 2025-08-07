'use client';

import { ImageIcon, LayoutTemplate, Pencil, Expand, Shapes, Type, MousePointer2, FileText } from 'lucide-react';
import { useRef } from 'react';
import { AdobeAIParser } from '../services/adobe-ai-parser';

import type { ActiveTool } from '@/features/editor/types';

import { SidebarItem } from './sidebar-item';

interface SidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor?: any; // Add editor prop for direct import
}

export const Sidebar = ({ activeTool, onChangeActiveTool, editor }: SidebarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdobeAIFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await AdobeAIParser.parseAIFile(file);
      const canvasData = {
        version: '1.0',
        width: parsed.metadata.pageSize.width,
        height: parsed.metadata.pageSize.height,
        objects: AdobeAIParser.convertToFabricObjects(parsed),
        background: '#ffffff',
        metadata: parsed.metadata
      };
      
      if (editor?.importAdobeAI) {
        editor.importAdobeAI(canvasData);
        console.log('✅ Adobe AI file imported via sidebar');
        alert(`✅ Adobe AI file "${file.name}" imported successfully!\n\nNote: Complex effects and embedded images may not be fully supported. The design has been placed as a placeholder for you to work with.`);
      } else {
        console.log('📋 Canvas data ready:', canvasData);
      }
    } catch (error) {
      console.error('❌ Adobe AI import failed:', error);
      alert(`⚠️ Could not fully parse "${file.name}".\n\nThis file may be:\n• A newer AI format\n• A PDF-based AI file\n• Have complex features\n\nThe file has been imported as a basic canvas for you to work with.`);
      
      // Create basic placeholder even on error
      const canvasData = {
        version: '1.0',
        width: 800,
        height: 600,
        objects: [{
          type: 'text',
          text: 'Adobe AI File: ' + file.name,
          left: 100,
          top: 300,
          fontSize: 24,
          fontFamily: 'Arial',
          fill: '#333'
        }],
        background: '#f9f9f9',
        metadata: { filename: file.name, source: 'Adobe AI' }
      };
      
      if (editor?.importAdobeAI) {
        editor.importAdobeAI(canvasData);
      }
    }
  };
  return (
    <aside className="flex h-full w-[100px] flex-col overflow-y-auto border-r bg-white">
      <ul className="flex flex-col">
        <SidebarItem
          icon={LayoutTemplate}
          label="Design"
          isActive={activeTool === 'templates'}
          onClick={() => onChangeActiveTool('templates')}
        />

        <SidebarItem icon={ImageIcon} label="Image" isActive={activeTool === 'images'} onClick={() => onChangeActiveTool('images')} />

        <SidebarItem icon={Type} label="Text" isActive={activeTool === 'text'} onClick={() => onChangeActiveTool('text')} />

        <SidebarItem icon={Shapes} label="Shapes" isActive={activeTool === 'shapes'} onClick={() => onChangeActiveTool('shapes')} />

        <SidebarItem icon={Pencil} label="Draw" isActive={activeTool === 'draw'} onClick={() => onChangeActiveTool('draw')} />

        <SidebarItem 
          icon={MousePointer2} 
          label="CPA Button" 
          isActive={activeTool === 'cpa-button'} 
          onClick={() => onChangeActiveTool('cpa-button')} 
        />

        <SidebarItem icon={Expand} label="Resize" isActive={activeTool === 'settings'} onClick={() => onChangeActiveTool('settings')} />

        <SidebarItem 
          icon={FileText} 
          label="Adobe AI" 
          isActive={activeTool === 'adobe-ai'} 
          onClick={() => {
            console.log('Adobe AI button clicked, setting activeTool to adobe-ai');
            onChangeActiveTool('adobe-ai');
            // Also trigger file input as fallback
            setTimeout(() => {
              fileInputRef.current?.click();
            }, 100);
          }} 
        />
      </ul>

      {/* Hidden file input for direct Adobe AI import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ai"
        onChange={handleAdobeAIFile}
        className="hidden"
      />
    </aside>
  );
};
