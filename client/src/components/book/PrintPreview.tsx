import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Image as ImageIcon, Video } from "lucide-react";
import { 
  PREVIEW_DIMS, 
  HEADER_ZONE, 
  IMAGE_ZONE, 
  TEXT_ZONE, 
  FOOTER_ZONE, 
  QR_ZONE,
  TYPOGRAPHY,
  getLayoutForPhotoCount,
  getAvailableLayouts,
  generateCollageZones,
  type PhotoLayout,
  type PageZone
} from "@/utils/layoutEngine";

interface PrintPreviewProps {
  photos: string[];
  textContent: string[];
  videoUrl: string | null;
  customData: Record<string, string>;
  pageNumber: number;
  title: string;
  subtitle?: string | null;
  language: "fr" | "en";
  titleStyle: { fontFamily: string; fontSize: number };
  textStyles: Record<number, { bgColor: string; textColor: string; fontFamily?: string; fontSize?: number }>;
  collageStyle?: string;
  selectedLayoutId?: string;
  qrPosition?: { x: number; y: number };
  onQrPositionChange?: (pos: { x: number; y: number }) => void;
  monthNumber?: number;
  maxPhotos?: number;
}

export function PrintPreview({
  photos,
  textContent,
  videoUrl,
  customData,
  pageNumber,
  title,
  subtitle,
  language,
  titleStyle,
  textStyles,
  collageStyle = "grid",
  selectedLayoutId,
  qrPosition,
  onQrPositionChange,
  monthNumber,
  maxPhotos = 1,
}: PrintPreviewProps) {
  const photoCount = photos.length;
  const hasVideo = videoUrl && videoUrl.startsWith('https://');
  const hasText = textContent.some(t => t && t.trim());
  
  const availableLayouts = useMemo(() => getAvailableLayouts(photoCount || 1), [photoCount]);
  const currentLayout = useMemo(() => 
    getLayoutForPhotoCount(photoCount, selectedLayoutId), 
    [photoCount, selectedLayoutId]
  );
  
  const photoZones = useMemo(() => {
    if (photoCount <= 5) {
      return currentLayout.zones.slice(0, photoCount);
    }
    return generateCollageZones(photoCount);
  }, [photoCount, currentLayout]);

  const renderPhoto = (photo: string, zone: PageZone, index: number) => (
    <div
      key={index}
      style={{
        position: 'absolute',
        left: zone.x,
        top: zone.y,
        width: zone.width,
        height: zone.height,
        overflow: 'hidden',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <img
        src={photo}
        alt={`Photo ${index + 1}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );

  const renderEmptyPhotoZone = (zone: PageZone, index: number) => (
    <div
      key={index}
      style={{
        position: 'absolute',
        left: zone.x,
        top: zone.y,
        width: zone.width,
        height: zone.height,
        backgroundColor: '#f5f5f4',
        borderRadius: '4px',
        border: '2px dashed #d6d3d1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="text-center text-stone-400">
        <ImageIcon className="w-5 h-5 mx-auto mb-1 opacity-50" />
        <span style={{ fontSize: '8px' }}>{index + 1}</span>
      </div>
    </div>
  );

  const filteredCustomData = Object.entries(customData).filter(
    ([key, value]) => value && !['collageStyle', 'blockPositions', 'textLayout', 'qrPosition', 'photoLayouts', 'textStyles', 'titleStyle'].includes(key)
  );

  return (
    <div
      style={{
        width: PREVIEW_DIMS.width,
        height: PREVIEW_DIMS.height,
        backgroundColor: '#ffffff',
        position: 'relative',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        border: '1px solid #e5e5e5',
      }}
    >
      {/* Header Zone - Title */}
      <div
        style={{
          position: 'absolute',
          left: HEADER_ZONE.x,
          top: HEADER_ZONE.y,
          width: HEADER_ZONE.width,
          height: HEADER_ZONE.height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #e8e8e8',
        }}
      >
        <h2
          style={{
            fontFamily: titleStyle.fontFamily,
            fontSize: Math.max(titleStyle.fontSize * 0.5, 12),
            fontWeight: 600,
            color: TYPOGRAPHY.title.color,
            lineHeight: TYPOGRAPHY.title.lineHeight,
            textAlign: 'center',
            margin: 0,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              fontFamily: TYPOGRAPHY.subtitle.fontFamily,
              fontSize: TYPOGRAPHY.subtitle.fontSize * 0.8,
              color: TYPOGRAPHY.subtitle.color,
              margin: '2px 0 0 0',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Image Zone - Photos */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
        }}
      >
        {photos.length > 0 ? (
          photos.map((photo, index) => {
            const zone = photoZones[index];
            if (!zone) return null;
            return renderPhoto(photo, zone, index);
          })
        ) : maxPhotos > 0 ? (
          Array.from({ length: Math.min(maxPhotos, 4) }).map((_, index) => {
            const layout = getLayoutForPhotoCount(Math.min(maxPhotos, 4));
            const zone = layout.zones[index];
            if (!zone) return null;
            return renderEmptyPhotoZone(zone, index);
          })
        ) : null}
      </div>

      {/* Text Zone */}
      {hasText && (
        <div
          style={{
            position: 'absolute',
            left: TEXT_ZONE.x,
            top: TEXT_ZONE.y,
            width: hasVideo ? TEXT_ZONE.width - QR_ZONE.width - 10 : TEXT_ZONE.width,
            height: TEXT_ZONE.height,
            overflow: 'hidden',
            padding: '8px',
          }}
        >
          {textContent.map((text, idx) => {
            if (!text || !text.trim()) return null;
            const style = textStyles[idx] || { 
              bgColor: "#FFFFFF", 
              textColor: TYPOGRAPHY.body.color, 
              fontFamily: TYPOGRAPHY.body.fontFamily, 
              fontSize: TYPOGRAPHY.body.fontSize 
            };
            const hasCustomBg = style.bgColor !== "#FFFFFF";
            const fontSize = Math.max((style.fontSize || TYPOGRAPHY.body.fontSize) * 0.8, 8);
            
            return (
              <p
                key={idx}
                style={{
                  fontFamily: style.fontFamily || TYPOGRAPHY.body.fontFamily,
                  fontSize,
                  lineHeight: TYPOGRAPHY.body.lineHeight,
                  color: style.textColor,
                  backgroundColor: hasCustomBg ? style.bgColor : 'transparent',
                  padding: hasCustomBg ? '4px 6px' : 0,
                  borderRadius: hasCustomBg ? '4px' : 0,
                  margin: '0 0 4px 0',
                  wordBreak: 'break-word',
                }}
              >
                {text}
              </p>
            );
          })}
        </div>
      )}

      {/* Custom Data (Birth info, etc.) */}
      {filteredCustomData.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: TEXT_ZONE.x,
            top: hasText ? TEXT_ZONE.y + TEXT_ZONE.height - 40 : TEXT_ZONE.y,
            width: TEXT_ZONE.width,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '4px',
          }}
        >
          {filteredCustomData.slice(0, 6).map(([key, value]) => (
            <div
              key={key}
              style={{
                backgroundColor: '#f8f8f7',
                borderRadius: '4px',
                padding: '4px 6px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '7px', color: '#a0a0a0', margin: 0 }}>{key}</p>
              <p style={{ fontSize: '9px', color: '#333', fontWeight: 500, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Zone - Fixed position for video */}
      {hasVideo && (
        <div
          style={{
            position: 'absolute',
            right: PREVIEW_DIMS.margin + 5,
            bottom: FOOTER_ZONE.height + PREVIEW_DIMS.margin + 10,
            backgroundColor: '#ffffff',
            padding: '6px',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e0d4f5',
          }}
        >
          <QRCodeSVG
            value={videoUrl}
            size={60}
            level="H"
            includeMargin={false}
          />
          <p
            style={{
              fontSize: '6px',
              color: '#7c3aed',
              textAlign: 'center',
              margin: '3px 0 0 0',
              fontFamily: TYPOGRAPHY.caption.fontFamily,
            }}
          >
            {language === "fr" ? "Scannez" : "Scan"}
          </p>
        </div>
      )}

      {/* Footer Zone - Page Number */}
      <div
        style={{
          position: 'absolute',
          left: FOOTER_ZONE.x,
          top: FOOTER_ZONE.y,
          width: FOOTER_ZONE.width,
          height: FOOTER_ZONE.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px solid #f0f0f0',
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.pageNumber.fontFamily,
            fontSize: TYPOGRAPHY.pageNumber.fontSize,
            color: TYPOGRAPHY.pageNumber.color,
          }}
        >
          {pageNumber}
        </span>
      </div>

      {/* Month Hero Number (for monthly milestone pages) */}
      {monthNumber !== undefined && collageStyle === "monthHero" && (
        <div
          style={{
            position: 'absolute',
            left: IMAGE_ZONE.x + 10,
            top: IMAGE_ZONE.y + 10,
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: '50%',
            width: 50,
            height: 50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#4a5568' }}>
            {monthNumber}
          </span>
          <span style={{ fontSize: '7px', color: '#718096' }}>
            {language === "fr" ? "mois" : "mo"}
          </span>
        </div>
      )}
    </div>
  );
}

