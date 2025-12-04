import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  format?: '8x11' | 'a4' | 'square';
  orientation?: 'portrait' | 'landscape';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  background?: string;
  showBorder?: boolean;
}

const FORMAT_RATIOS = {
  '8x11': 8.5 / 11,
  'a4': 210 / 297,
  'square': 1,
};

const PADDING_CLASSES = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-8',
  lg: 'p-12',
};

export function PageLayout({
  children,
  className,
  format = '8x11',
  orientation = 'portrait',
  padding = 'md',
  background = '#FFFFFF',
  showBorder = true,
}: PageLayoutProps) {
  const ratio = FORMAT_RATIOS[format];
  const isLandscape = orientation === 'landscape';
  
  const getAspectRatio = () => {
    if (format === 'square') return '1 / 1';
    const baseRatio = ratio;
    return isLandscape ? `1 / ${baseRatio}` : `${baseRatio} / 1`;
  };
  
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        PADDING_CLASSES[padding],
        showBorder && 'border border-stone-200 shadow-lg',
        className
      )}
      style={{
        aspectRatio: getAspectRatio(),
        backgroundColor: background,
      }}
    >
      {children}
    </div>
  );
}

interface PrintPreviewProps {
  children: ReactNode;
  className?: string;
  scale?: number;
}

export function PrintPreview({ children, className, scale = 0.5 }: PrintPreviewProps) {
  return (
    <div
      className={cn(
        'origin-top-left',
        className
      )}
      style={{
        transform: `scale(${scale})`,
        width: `${100 / scale}%`,
        height: `${100 / scale}%`,
      }}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  titleStyle?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
  };
  subtitleStyle?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
  };
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  titleStyle = {},
  subtitleStyle = {},
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('text-center mb-6', className)}>
      <h1
        style={{
          fontFamily: titleStyle.fontFamily || "'Fraunces', serif",
          fontSize: `${titleStyle.fontSize || 24}px`,
          color: titleStyle.color || '#374151',
        }}
        className="font-semibold"
      >
        {title}
      </h1>
      {subtitle && (
        <p
          style={{
            fontFamily: subtitleStyle.fontFamily || "'DM Sans', sans-serif",
            fontSize: `${subtitleStyle.fontSize || 14}px`,
            color: subtitleStyle.color || '#6B7280',
          }}
          className="mt-2"
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}

interface PageContentProps {
  children: ReactNode;
  className?: string;
  layout?: 'single' | 'split' | 'grid';
}

export function PageContent({ children, className, layout = 'single' }: PageContentProps) {
  const layoutClasses = {
    single: '',
    split: 'grid grid-cols-2 gap-6',
    grid: 'grid grid-cols-2 gap-4',
  };
  
  return (
    <div className={cn('flex-1', layoutClasses[layout], className)}>
      {children}
    </div>
  );
}

interface PageFooterProps {
  children?: ReactNode;
  pageNumber?: number;
  className?: string;
}

export function PageFooter({ children, pageNumber, className }: PageFooterProps) {
  return (
    <footer className={cn('mt-auto pt-4 text-center text-sm text-stone-400', className)}>
      {children}
      {pageNumber !== undefined && (
        <span className="block mt-2">{pageNumber}</span>
      )}
    </footer>
  );
}
