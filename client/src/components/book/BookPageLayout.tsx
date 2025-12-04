import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CollageBlockNew, type CollageStyle } from './CollageBlockNew';
import './BookPageLayout.css';

export type TextPlacement = 'top' | 'bottom' | 'left' | 'right' | 'none';

interface BookPageLayoutProps {
  photos: string[];
  maxPhotos?: number;
  collageStyle?: CollageStyle;
  language?: 'fr' | 'en';
  month?: number;
  title?: string;
  subtitle?: string;
  titleStyle?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
  };
  textBlocks?: Array<{
    content: string;
    style?: {
      fontFamily?: string;
      fontSize?: number;
      color?: string;
      bgColor?: string;
    };
  }>;
  textPlacement?: TextPlacement;
  pageNumber?: number;
  className?: string;
  children?: ReactNode;
}

export function BookPageLayout({
  photos,
  maxPhotos = 15,
  collageStyle = 'grid',
  language = 'fr',
  month,
  title,
  subtitle,
  titleStyle = {},
  textBlocks = [],
  textPlacement = 'top',
  pageNumber,
  className,
  children,
}: BookPageLayoutProps) {
  const hasText = textBlocks.some(block => block.content?.trim());
  const hasPhotos = photos.length > 0;
  const effectivePlacement = hasText ? textPlacement : 'none';

  const layoutClass = cn(
    'book-page-layout',
    `layout-text-${effectivePlacement}`,
    className
  );

  const renderHeader = () => {
    if (!title) return null;
    return (
      <header className="book-page-header">
        <h1
          style={{
            fontFamily: titleStyle.fontFamily || "'Fraunces', serif",
            fontSize: `${(titleStyle.fontSize || 24) * 0.8}px`,
            color: titleStyle.color || '#374151',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="book-page-subtitle">{subtitle}</p>
        )}
      </header>
    );
  };

  const renderTextZone = () => {
    if (!hasText) return null;
    return (
      <div className="book-page-text-zone">
        {textBlocks.map((block, idx) => {
          if (!block.content?.trim()) return null;
          const style = block.style || {};
          const hasBg = style.bgColor && style.bgColor !== '#FFFFFF';
          return (
            <p
              key={idx}
              className={cn('book-page-text', hasBg && 'has-bg')}
              style={{
                fontFamily: style.fontFamily || "'Poppins', sans-serif",
                fontSize: `${(style.fontSize || 14) * 0.75}px`,
                color: style.color || '#374151',
                backgroundColor: hasBg ? style.bgColor : undefined,
              }}
            >
              {block.content}
            </p>
          );
        })}
      </div>
    );
  };

  const renderPhotoZone = () => {
    if (!hasPhotos) return null;
    return (
      <div className="book-page-photo-zone">
        <CollageBlockNew
          photos={photos}
          maxPhotos={maxPhotos}
          language={language}
          editable={false}
          style={collageStyle}
          month={month}
        />
      </div>
    );
  };

  const renderFooter = () => {
    if (pageNumber === undefined) return null;
    return (
      <footer className="book-page-footer">
        <span>{pageNumber}</span>
      </footer>
    );
  };

  return (
    <div className={layoutClass}>
      {renderHeader()}
      
      {effectivePlacement === 'top' && renderTextZone()}
      {effectivePlacement === 'left' && (
        <div className="book-page-side-layout">
          {renderTextZone()}
          {renderPhotoZone()}
        </div>
      )}
      {effectivePlacement === 'right' && (
        <div className="book-page-side-layout">
          {renderPhotoZone()}
          {renderTextZone()}
        </div>
      )}
      {(effectivePlacement === 'top' || effectivePlacement === 'bottom' || effectivePlacement === 'none') && renderPhotoZone()}
      {effectivePlacement === 'bottom' && renderTextZone()}
      
      {children}
      {renderFooter()}
    </div>
  );
}

interface BookPagePreviewProps {
  children: ReactNode;
  className?: string;
  maxWidth?: number;
}

export function BookPagePreview({ 
  children, 
  className,
  maxWidth = 400 
}: BookPagePreviewProps) {
  return (
    <div 
      className={cn('book-page-preview-container', className)}
      style={{ maxWidth: `${maxWidth}px` }}
    >
      {children}
    </div>
  );
}

export default BookPageLayout;
