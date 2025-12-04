import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TextStyle {
  bgColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
}

interface TitleStyle {
  fontFamily: string;
  fontSize: number;
}

interface PhotoLayout {
  scale: number;
  x: number;
  y: number;
}

interface PageData {
  textContent: string[];
  photos: string[];
  videoUrl: string | null;
  customData: Record<string, string>;
  textStyles: Record<number, TextStyle>;
  titleStyle: TitleStyle;
  photoLayouts: Record<number, PhotoLayout>;
}

interface MemoState {
  language: 'fr' | 'en';
  setLanguage: (lang: 'fr' | 'en') => void;
  
  currentBookId: string | null;
  setCurrentBookId: (id: string | null) => void;
  
  currentPageNumber: number;
  setCurrentPageNumber: (page: number) => void;
  
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  
  pageData: Record<number, PageData>;
  setPageData: (pageNumber: number, data: Partial<PageData>) => void;
  getPageData: (pageNumber: number) => PageData;
  clearPageData: () => void;
  
  defaultTitleStyle: TitleStyle;
  setDefaultTitleStyle: (style: TitleStyle) => void;
  
  defaultTextStyle: TextStyle;
  setDefaultTextStyle: (style: TextStyle) => void;
  
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  
  extractedPalette: string[];
  setExtractedPalette: (colors: string[]) => void;
}

const defaultTextStyle: TextStyle = {
  bgColor: '#FFFFFF',
  textColor: '#374151',
  fontFamily: "'Poppins', sans-serif",
  fontSize: 14,
};

const defaultTitleStyle: TitleStyle = {
  fontFamily: "'Fraunces', serif",
  fontSize: 20,
};

const createDefaultPageData = (): PageData => ({
  textContent: [],
  photos: [],
  videoUrl: null,
  customData: {},
  textStyles: {},
  titleStyle: { ...defaultTitleStyle },
  photoLayouts: {},
});

export const useMemoStore = create<MemoState>()(
  persist(
    (set, get) => ({
      language: 'fr',
      setLanguage: (lang) => set({ language: lang }),
      
      currentBookId: null,
      setCurrentBookId: (id) => set({ currentBookId: id }),
      
      currentPageNumber: 1,
      setCurrentPageNumber: (page) => set({ currentPageNumber: page }),
      
      isDirty: false,
      setIsDirty: (dirty) => set({ isDirty: dirty }),
      
      pageData: {},
      setPageData: (pageNumber, data) => set((state) => {
        const existingData = state.pageData[pageNumber] || createDefaultPageData();
        return {
          pageData: {
            ...state.pageData,
            [pageNumber]: {
              ...existingData,
              ...data,
              customData: { ...existingData.customData, ...data.customData },
              textStyles: { ...existingData.textStyles, ...data.textStyles },
              photoLayouts: { ...existingData.photoLayouts, ...data.photoLayouts },
              titleStyle: { ...existingData.titleStyle, ...data.titleStyle },
            },
          },
          isDirty: true,
        };
      }),
      getPageData: (pageNumber) => {
        const state = get();
        const existing = state.pageData[pageNumber];
        if (!existing) {
          return createDefaultPageData();
        }
        return {
          ...existing,
          customData: { ...existing.customData },
          textStyles: { ...existing.textStyles },
          photoLayouts: { ...existing.photoLayouts },
          titleStyle: { ...existing.titleStyle },
        };
      },
      clearPageData: () => set({ pageData: {}, isDirty: false }),
      
      defaultTitleStyle,
      setDefaultTitleStyle: (style) => set({ defaultTitleStyle: style }),
      
      defaultTextStyle,
      setDefaultTextStyle: (style) => set({ defaultTextStyle: style }),
      
      showPreview: false,
      setShowPreview: (show) => set({ showPreview: show }),
      
      extractedPalette: [],
      setExtractedPalette: (colors) => set({ extractedPalette: colors }),
    }),
    {
      name: 'memoria-store',
      partialize: (state) => ({
        language: state.language,
        defaultTitleStyle: state.defaultTitleStyle,
        defaultTextStyle: state.defaultTextStyle,
      }),
    }
  )
);
