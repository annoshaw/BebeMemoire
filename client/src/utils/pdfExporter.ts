import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  quality?: number;
}

const FORMAT_DIMENSIONS = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
};

export async function exportPageToPDF(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<Blob> {
  const {
    format = 'letter',
    orientation = 'portrait',
    margin = 10,
    quality = 2,
  } = options;

  const canvas = await html2canvas(element, {
    scale: quality,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#FFFFFF',
  });

  const dimensions = FORMAT_DIMENSIONS[format];
  const pdfWidth = orientation === 'portrait' ? dimensions.width : dimensions.height;
  const pdfHeight = orientation === 'portrait' ? dimensions.height : dimensions.width;

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
  });

  const contentWidth = pdfWidth - margin * 2;
  const contentHeight = pdfHeight - margin * 2;

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(contentWidth / imgWidth, contentHeight / imgHeight);

  const scaledWidth = imgWidth * ratio;
  const scaledHeight = imgHeight * ratio;
  const x = (pdfWidth - scaledWidth) / 2;
  const y = (pdfHeight - scaledHeight) / 2;

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  pdf.addImage(imgData, 'JPEG', x, y, scaledWidth, scaledHeight);

  return pdf.output('blob');
}

export async function exportBookToPDF(
  pages: HTMLElement[],
  options: ExportOptions = {}
): Promise<Blob> {
  const {
    format = 'letter',
    orientation = 'portrait',
    margin = 10,
    quality = 2,
  } = options;

  const dimensions = FORMAT_DIMENSIONS[format];
  const pdfWidth = orientation === 'portrait' ? dimensions.width : dimensions.height;
  const pdfHeight = orientation === 'portrait' ? dimensions.height : dimensions.width;

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
  });

  const contentWidth = pdfWidth - margin * 2;
  const contentHeight = pdfHeight - margin * 2;

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }

    const canvas = await html2canvas(pages[i], {
      scale: quality,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#FFFFFF',
    });

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(contentWidth / imgWidth, contentHeight / imgHeight);

    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;
    const x = (pdfWidth - scaledWidth) / 2;
    const y = (pdfHeight - scaledHeight) / 2;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', x, y, scaledWidth, scaledHeight);
  }

  return pdf.output('blob');
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportAndDownload(
  element: HTMLElement | HTMLElement[],
  options: ExportOptions = {}
): Promise<void> {
  const { filename = 'memoria-book.pdf' } = options;

  let blob: Blob;
  if (Array.isArray(element)) {
    blob = await exportBookToPDF(element, options);
  } else {
    blob = await exportPageToPDF(element, options);
  }

  downloadBlob(blob, filename);
}

export function calculatePrintDimensions(
  aspectRatio: number,
  format: 'a4' | 'letter' = 'letter',
  orientation: 'portrait' | 'landscape' = 'portrait',
  margin: number = 10
): { width: number; height: number } {
  const dimensions = FORMAT_DIMENSIONS[format];
  const pdfWidth = orientation === 'portrait' ? dimensions.width : dimensions.height;
  const pdfHeight = orientation === 'portrait' ? dimensions.height : dimensions.width;
  
  const contentWidth = pdfWidth - margin * 2;
  const contentHeight = pdfHeight - margin * 2;
  
  if (contentWidth / contentHeight > aspectRatio) {
    return {
      width: contentHeight * aspectRatio,
      height: contentHeight,
    };
  } else {
    return {
      width: contentWidth,
      height: contentWidth / aspectRatio,
    };
  }
}
