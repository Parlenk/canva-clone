'use client';

import { ImageIcon, LayoutTemplate, Pencil, Expand, Shapes, Type, MousePointer2, FileText } from 'lucide-react';

import type { ActiveTool } from '@/features/editor/types';

import { SidebarItem } from './sidebar-item';

interface SidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const Sidebar = ({ activeTool, onChangeActiveTool }: SidebarProps) => {
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
          }} 
        />
      </ul>
    </aside>
  );
};
