import { ReactNode, Children } from 'react';
import { cn } from '@/lib/utils';

interface AutoGridProps {
  children: ReactNode;
  className?: string;
  minItemWidth?: number;
  gap?: 'none' | 'sm' | 'md' | 'lg';
  columns?: 1 | 2 | 3 | 4 | 'auto';
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | 'auto';
}

const GAP_CLASSES = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

const COLUMN_CLASSES = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  auto: '',
};

export function AutoGrid({
  children,
  className,
  minItemWidth = 150,
  gap = 'md',
  columns = 'auto',
  aspectRatio = 'auto',
}: AutoGridProps) {
  const childCount = Children.count(children);
  
  const getAutoColumns = () => {
    if (childCount === 1) return 'grid-cols-1';
    if (childCount === 2) return 'grid-cols-2';
    if (childCount <= 4) return 'grid-cols-2';
    if (childCount <= 6) return 'grid-cols-3';
    if (childCount <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };
  
  const gridCols = columns === 'auto' ? getAutoColumns() : COLUMN_CLASSES[columns];
  
  return (
    <div
      className={cn(
        'grid',
        gridCols,
        GAP_CLASSES[gap],
        className
      )}
      style={columns === 'auto' && minItemWidth ? {
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
      } : undefined}
    >
      {children}
    </div>
  );
}

interface GridItemProps {
  children: ReactNode;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | 'auto';
  span?: 1 | 2 | 3 | 4;
}

const ASPECT_CLASSES = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[4/3]',
  auto: '',
};

const SPAN_CLASSES = {
  1: '',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
};

export function GridItem({
  children,
  className,
  aspectRatio = 'auto',
  span = 1,
}: GridItemProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg',
        ASPECT_CLASSES[aspectRatio],
        SPAN_CLASSES[span],
        className
      )}
    >
      {children}
    </div>
  );
}

interface PhotoGridProps {
  photos: string[];
  maxPhotos?: number;
  onPhotoClick?: (index: number) => void;
  className?: string;
  gap?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: boolean;
}

export function PhotoGrid({
  photos,
  maxPhotos = 9,
  onPhotoClick,
  className,
  gap = 'sm',
  rounded = true,
}: PhotoGridProps) {
  const displayPhotos = photos.slice(0, maxPhotos);
  const remainingCount = photos.length - maxPhotos;
  
  const getGridLayout = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-3';
  };
  
  return (
    <div className={cn('grid', getGridLayout(displayPhotos.length), GAP_CLASSES[gap], className)}>
      {displayPhotos.map((photo, index) => (
        <div
          key={index}
          className={cn(
            'relative aspect-square overflow-hidden cursor-pointer group',
            rounded && 'rounded-lg'
          )}
          onClick={() => onPhotoClick?.(index)}
        >
          <img
            src={photo}
            alt={`Photo ${index + 1}`}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          {index === displayPhotos.length - 1 && remainingCount > 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-2xl font-semibold">
                +{remainingCount}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface CollageLayoutProps {
  photos: string[];
  layout?: 'masonry' | 'featured' | 'equal';
  className?: string;
}

export function CollageLayout({
  photos,
  layout = 'equal',
  className,
}: CollageLayoutProps) {
  if (photos.length === 0) return null;
  
  if (layout === 'featured' && photos.length >= 2) {
    return (
      <div className={cn('grid grid-cols-2 gap-2', className)}>
        <div className="row-span-2 aspect-[3/4] rounded-lg overflow-hidden">
          <img src={photos[0]} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="grid gap-2">
          {photos.slice(1, 3).map((photo, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden">
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return <PhotoGrid photos={photos} className={className} />;
}
