import { Space_Grotesk } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';

const font = Space_Grotesk({
  weight: ['700'],
  subsets: ['latin'],
});

interface LogoProps {
  className?: string;
}

export const Logo = ({ className }: LogoProps) => {
  return (
    <Link href="/" className={cn(className)}>
      <div className="flex h-[68px] items-center gap-x-2 px-4 transition hover:opacity-75">
        <div className="relative size-8">
          <Image src="/logo.svg" alt="KrediMage" fill />
        </div>

        <h1 className={cn(font.className, 'text-xl font-bold')}>KrediMage</h1>
      </div>
    </Link>
  );
};
