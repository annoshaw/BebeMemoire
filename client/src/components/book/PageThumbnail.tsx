import { Check, Image, FileText, Video, Baby, MessageCircle, Calendar } from "lucide-react";
import type { TemplatePage, UserBookPage } from "@shared/schema";

interface PageThumbnailProps {
  templatePage: TemplatePage;
  userPage?: UserBookPage | null;
  language?: "fr" | "en";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function PageThumbnail({ 
  templatePage, 
  userPage, 
  language = "fr",
  size = "sm",
  onClick 
}: PageThumbnailProps) {
  const isCompleted = userPage?.isCompleted || false;
  const photos = (userPage?.photos as string[] | null) || [];
  const textContent = (userPage?.textContent as string[] | null) || [];
  const hasContent = userPage && (
    photos.length > 0 ||
    textContent.length > 0 ||
    userPage.videoUrl
  );

  const sizeClasses = {
    sm: "w-12 h-16",
    md: "w-16 h-20",
    lg: "w-24 h-32"
  };

  const getPageTypeIcon = () => {
    switch (templatePage.pageType) {
      case "photo":
      case "collage":
        return <Image className="w-3 h-3" />;
      case "video":
        return <Video className="w-3 h-3" />;
      case "birth_info":
        return <Baby className="w-3 h-3" />;
      case "message":
        return <MessageCircle className="w-3 h-3" />;
      case "event":
      case "anniversaire":
        return <Calendar className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const firstPhoto = photos.length > 0 ? photos[0] : null;

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-lg overflow-hidden shadow-sm border flex-shrink-0 relative transition-all hover:shadow-md hover:scale-105 ${
        isCompleted 
          ? "border-green-300 bg-green-50" 
          : hasContent 
            ? "border-amber-200 bg-amber-50" 
            : "border-stone-200 bg-white"
      }`}
      data-testid={`page-thumbnail-${templatePage.pageNumber}`}
    >
      {firstPhoto ? (
        <img 
          src={firstPhoto} 
          className="w-full h-full object-cover" 
          alt={language === "fr" ? templatePage.titleFr : templatePage.titleEn} 
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-1">
          <div className={`mb-1 ${isCompleted ? "text-green-500" : hasContent ? "text-amber-500" : "text-stone-300"}`}>
            {getPageTypeIcon()}
          </div>
          <span className="text-[6px] text-stone-400 text-center leading-tight line-clamp-2 px-0.5">
            {language === "fr" ? templatePage.titleFr : templatePage.titleEn}
          </span>
        </div>
      )}
      
      {isCompleted && (
        <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-2 h-2 text-white" />
        </div>
      )}

      {!isCompleted && hasContent && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400" />
      )}
    </button>
  );
}

export function PageThumbnailSkeleton({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-12 h-16",
    md: "w-16 h-20",
    lg: "w-24 h-32"
  };

  return (
    <div className={`${sizeClasses[size]} rounded-lg bg-stone-100 animate-pulse flex-shrink-0`} />
  );
}
