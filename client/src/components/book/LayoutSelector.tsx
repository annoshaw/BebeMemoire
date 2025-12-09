import { useMemo } from "react";
import { getAvailableLayouts, type PhotoLayout, IMAGE_ZONE } from "@/utils/layoutEngine";

interface LayoutSelectorProps {
  photoCount: number;
  selectedLayoutId?: string;
  onLayoutChange: (layoutId: string) => void;
  language: "fr" | "en";
}

export function LayoutSelector({ 
  photoCount, 
  selectedLayoutId, 
  onLayoutChange,
  language 
}: LayoutSelectorProps) {
  const layouts = useMemo(() => getAvailableLayouts(Math.max(photoCount, 1)), [photoCount]);
  
  const renderLayoutThumbnail = (layout: PhotoLayout) => {
    const scale = 0.15;
    const thumbWidth = IMAGE_ZONE.width * scale;
    const thumbHeight = IMAGE_ZONE.height * scale;
    
    return (
      <svg 
        viewBox={`0 0 ${IMAGE_ZONE.width} ${IMAGE_ZONE.height}`}
        width={thumbWidth}
        height={thumbHeight}
        style={{ display: 'block' }}
      >
        <rect 
          x={0} 
          y={0} 
          width={IMAGE_ZONE.width} 
          height={IMAGE_ZONE.height} 
          fill="#f5f5f4" 
          rx={4}
        />
        {layout.zones.map((zone, idx) => (
          <rect
            key={idx}
            x={zone.x - IMAGE_ZONE.x}
            y={zone.y - IMAGE_ZONE.y}
            width={zone.width}
            height={zone.height}
            fill="#8fa88b"
            fillOpacity={0.7}
            rx={3}
          />
        ))}
      </svg>
    );
  };

  if (layouts.length <= 1) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-stone-600">
        {language === "fr" ? "Disposition des photos" : "Photo layout"}
      </span>
      <div className="flex gap-2 flex-wrap">
        {layouts.map((layout) => (
          <button
            key={layout.id}
            onClick={() => onLayoutChange(layout.id)}
            className={`p-2 rounded-lg border-2 transition-all ${
              selectedLayoutId === layout.id || (!selectedLayoutId && layout === layouts[0])
                ? "border-sage-500 bg-sage-50 shadow-sm"
                : "border-stone-200 hover:border-stone-300 bg-white"
            }`}
            title={language === "fr" ? layout.name : layout.nameEn}
          >
            {renderLayoutThumbnail(layout)}
            <span className="text-[8px] text-stone-500 mt-1 block text-center truncate max-w-[60px]">
              {language === "fr" ? layout.name : layout.nameEn}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
