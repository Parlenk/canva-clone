'use client';

import { Loader2, LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const UserButton = () => {
  const session = useSession();

  if (session.status === 'loading') {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  }

  if (session.status === 'unauthenticated' || !session.data) return null;

  const name = session.data?.user?.name || '';
  const image = session.data?.user?.image || '';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="relative outline-none">
        <Avatar className="size-10 transition hover:opacity-75">
          <AvatarImage src={image} alt={name} />

          <AvatarFallback className="bg-blue-500 font-medium text-white">{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem
          onClick={() =>
            signOut({
              redirectTo: '/',
            })
          }
          className="h-10"
        >
          <LogOut className="mr-2 size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
