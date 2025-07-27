'use client';

import { CreditCard, Crown, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useBilling } from '@/features/subscriptions/api/use-billing';
import { usePaywall } from '@/features/subscriptions/hooks/use-paywall';

import { SidebarItem } from './sidebar-item';

interface SidebarRoutesProps {
  onClick?: () => void;
}

export const SidebarRoutes = ({ onClick = () => {} }: SidebarRoutesProps) => {
  const pathname = usePathname();
  const { shouldBlock, triggerPaywall, isLoading } = usePaywall();
  const { mutate: checkoutBilling } = useBilling();

  const handleBilling = () => {
    onClick();

    if (shouldBlock) return triggerPaywall();

    checkoutBilling();
  };

  return (
    <div className="flex flex-1 flex-col gap-y-4">

      <ul className="flex flex-col gap-y-1 px-3">
        <SidebarItem href="/" label="Home" icon={Home} onClick={onClick} isActive={pathname === '/'} />
      </ul>

      <div className="px-3">
        <Separator />
      </div>

      <ul className="flex flex-col gap-y-1 px-3">
        {!shouldBlock && <SidebarItem href={pathname} label="Billing" icon={CreditCard} onClick={handleBilling} />}

      </ul>
    </div>
  );
};
