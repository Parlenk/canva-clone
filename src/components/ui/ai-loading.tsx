import { cn } from '@/lib/utils';

interface AILoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const AILoading = ({ className, size = 'md', text = 'AI Processing...' }: AILoadingProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div className={cn(
          'rounded-full border-2 border-blue-200 animate-spin',
          sizeClasses[size]
        )}>
          <div className={cn(
            'absolute top-0 left-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin',
            sizeClasses[size]
          )} 
          style={{ animationDuration: '0.8s' }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" />
        </div>
      </div>
      <span className="text-sm text-blue-600 font-medium animate-pulse">
        {text}
      </span>
      <div className="flex gap-1">
        <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};