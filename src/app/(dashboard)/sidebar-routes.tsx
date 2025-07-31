'use client';

import { Home } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Separator } from '@/components/ui/separator';

import { SidebarItem } from './sidebar-item';

interface SidebarRoutesProps {
  onClick?: () => void;
}

export const SidebarRoutes = ({ onClick = () => {} }: SidebarRoutesProps) => {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col gap-y-4">

      <ul className="flex flex-col gap-y-1 px-3">
        <SidebarItem href="/" label="Home" icon={Home} onClick={onClick} isActive={pathname === '/'} />
      </ul>

      <div className="px-3">
        <Separator />
      </div>

    </div>
  );
};
