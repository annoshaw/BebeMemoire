import puppeteer from 'puppeteer';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { storage } from './storage';
import type { PdfExport } from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

const LOCAL_PDF_DIR = path.join(process.cwd(), 'storage', 'pdfs');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const S3_BUCKET = process.env.AWS_S3_BUCKET || '';

interface BookPageData {
  pageNumber: number;
  title?: string;
  subtitle?: string;
  photos: string[];
  textBlocks: Array<{
    content: string;
    style?: {
      fontFamily?: string;
      fontSize?: number;
      color?: string;
      bgColor?: string;
    };
  }>;
  titleStyle?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
  };
  collageStyle?: string;
  textPlacement?: 'top' | 'bottom' | 'left' | 'right' | 'none';
  videoUrl?: string;
  qrCodeData?: string;
}

interface GeneratePdfOptions {
  bookId: string;
  orderId?: string;
  format?: 'letter' | 'a4';
  orientation?: 'portrait' | 'landscape';
}

const FORMAT_DIMENSIONS = {
  letter: { width: 8, height: 11 },  // 8x11 book format
  a4: { width: 8.27, height: 11.69 },
};

// Book printing margins (in inches)
const BOOK_MARGINS = {
  top: 0.75,
  bottom: 0.75,
  inside: 0.875,  // Gutter margin for binding
  outside: 0.625,
};

function generatePageHtml(page: BookPageData, format: 'letter' | 'a4' = 'letter', pageIndex: number = 0): string {
  const dims = FORMAT_DIMENSIONS[format];
  const hasText = page.textBlocks?.some(block => block.content?.trim());
  const hasPhotos = page.photos?.length > 0;
  const textPlacement = hasText ? (page.textPlacement || 'top') : 'none';
  
  // Alternating margins for book binding (odd pages = right side, even pages = left side)
  const isRightPage = pageIndex % 2 === 0; // First page (index 0) is right page
  const marginLeft = isRightPage ? BOOK_MARGINS.inside : BOOK_MARGINS.outside;
  const marginRight = isRightPage ? BOOK_MARGINS.outside : BOOK_MARGINS.inside;

  const titleHtml = page.title ? `
    <header style="
      text-align: center;
      margin-bottom: 16px;
      font-family: ${page.titleStyle?.fontFamily || "'Fraunces', serif"};
      font-size: ${page.titleStyle?.fontSize || 24}px;
      color: ${page.titleStyle?.color || '#374151'};
    ">
      <h1 style="margin: 0;">${page.title}</h1>
      ${page.subtitle ? `<p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">${page.subtitle}</p>` : ''}
    </header>
  ` : '';

  const textHtml = hasText ? `
    <div style="margin: 12px 0;">
      ${page.textBlocks.map(block => {
        if (!block.content?.trim()) return '';
        const style = block.style || {};
        const hasBg = style.bgColor && style.bgColor !== '#FFFFFF';
        return `
          <p style="
            font-family: ${style.fontFamily || "'Poppins', sans-serif"};
            font-size: ${style.fontSize || 14}px;
            color: ${style.color || '#374151'};
            ${hasBg ? `background-color: ${style.bgColor}; padding: 8px; border-radius: 4px;` : ''}
            margin: 8px 0;
            line-height: 1.5;
          ">${block.content}</p>
        `;
      }).join('')}
    </div>
  ` : '';

  const photosHtml = hasPhotos ? `
    <div style="
      display: grid;
      grid-template-columns: repeat(${Math.min(page.photos.length, 3)}, 1fr);
      gap: 8px;
      flex: 1;
    ">
      ${page.photos.map(photo => `
        <div style="
          aspect-ratio: 1;
          overflow: hidden;
          border-radius: 4px;
        ">
          <img src="${photo}" style="
            width: 100%;
            height: 100%;
            object-fit: cover;
          " />
        </div>
      `).join('')}
    </div>
  ` : '';

  const qrCodeHtml = page.qrCodeData ? `
    <div style="
      position: absolute;
      bottom: 20px;
      right: 20px;
      padding: 8px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    ">
      <img src="${page.qrCodeData}" style="width: 60px; height: 60px;" alt="QR Code" />
      <p style="font-size: 8px; text-align: center; margin: 4px 0 0 0; color: #666;">Scan for video</p>
    </div>
  ` : '';

  const footerHtml = `
    <footer style="
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      padding-top: 8px;
    ">
      ${page.pageNumber}
    </footer>
  `;

  let contentHtml = '';
  if (textPlacement === 'top') {
    contentHtml = `${textHtml}${photosHtml}`;
  } else if (textPlacement === 'bottom') {
    contentHtml = `${photosHtml}${textHtml}`;
  } else if (textPlacement === 'left') {
    contentHtml = `
      <div style="display: flex; gap: 16px;">
        <div style="flex: 1;">${textHtml}</div>
        <div style="flex: 2;">${photosHtml}</div>
      </div>
    `;
  } else if (textPlacement === 'right') {
    contentHtml = `
      <div style="display: flex; gap: 16px;">
        <div style="flex: 2;">${photosHtml}</div>
        <div style="flex: 1;">${textHtml}</div>
      </div>
    `;
  } else {
    contentHtml = photosHtml;
  }

  return `
    <div style="
      width: ${dims.width}in;
      height: ${dims.height}in;
      padding: ${BOOK_MARGINS.top}in ${marginRight}in ${BOOK_MARGINS.bottom}in ${marginLeft}in;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      background: white;
      position: relative;
      page-break-after: always;
    ">
      ${titleHtml}
      <div style="flex: 1; display: flex; flex-direction: column;">
        ${contentHtml}
      </div>
      ${qrCodeHtml}
      ${footerHtml}
    </div>
  `;
}

function generateFullHtml(pages: BookPageData[], format: 'letter' | 'a4' = 'letter'): string {
  const dims = FORMAT_DIMENSIONS[format];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:wght@300;400;500;600&family=Raleway:wght@300;400;500;600&family=Montserrat:wght@400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Poppins', sans-serif;
          background: white;
        }
        
        @page {
          size: ${dims.width}in ${dims.height}in;
          margin: 0;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      ${pages.map((page, index) => generatePageHtml(page, format, index)).join('')}
    </body>
    </html>
  `;
}

export async function generateBookPdf(options: GeneratePdfOptions): Promise<PdfExport> {
  const { bookId, orderId, format = 'letter', orientation = 'portrait' } = options;

  const book = await storage.getBook(bookId);
  if (!book) {
    throw new Error('Book not found');
  }

  const filename = `memoria-${book.childName || 'book'}-${Date.now()}.pdf`;
  const s3Key = `pdfs/${bookId}/${filename}`;

  const pdfExport = await storage.createPdfExport({
    bookId,
    orderId: orderId || null,
    s3Key,
    filename,
    status: 'generating',
  });

  try {
    // Directly query the database instead of making an HTTP request
    const userPages = await storage.getUserBookPages(bookId);
    
    // Get template pages if it's a prebuilt book
    let allTemplatePages: any[] = [];
    if (book.templateSlug) {
      const template = await storage.getBookTemplateBySlug(book.templateSlug);
      if (template) {
        allTemplatePages = await storage.getTemplatePages(template.id);
      }
    }
    
    const pages: BookPageData[] = [];
    const userPagesMap = new Map(userPages.map((p: any) => [p.pageNumber, p]));

    // Use template pages if available, otherwise use user pages directly
    if (allTemplatePages.length > 0) {
      for (const templatePage of allTemplatePages) {
        const userPage = userPagesMap.get(templatePage.pageNumber) as any;
        
        pages.push({
          pageNumber: templatePage.pageNumber,
          title: templatePage.titleFr || templatePage.titleEn,
          subtitle: templatePage.subtitleFr || templatePage.subtitleEn,
          photos: userPage?.photos || [],
          textBlocks: userPage?.textBlocks || [],
          titleStyle: userPage?.titleStyle || {},
          collageStyle: userPage?.collageStyle || 'grid',
          textPlacement: userPage?.textPlacement || 'top',
          videoUrl: userPage?.videoUrl,
          qrCodeData: userPage?.qrCodeData,
        });
      }
    } else {
      // Fallback for non-template books
      for (const userPage of userPages) {
        const customData = (userPage.customData || {}) as any;
        const photos = Array.isArray(userPage.photos) ? userPage.photos : [];
        pages.push({
          pageNumber: userPage.pageNumber,
          title: userPage.titleOverride || `Page ${userPage.pageNumber}`,
          subtitle: undefined,
          photos: photos as string[],
          textBlocks: customData.textBlocks || [],
          titleStyle: customData.titleStyle || {},
          collageStyle: customData.collageStyle || 'grid',
          textPlacement: customData.textPlacement || 'top',
          videoUrl: userPage.videoUrl || undefined,
          qrCodeData: customData.qrCodeData || undefined,
        });
      }
    }

    const html = generateFullHtml(pages, format);
    const dims = FORMAT_DIMENSIONS[format];

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      width: `${dims.width}in`,
      height: `${dims.height}in`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await browser.close();

    // Detect if any page has videos or QR codes
    const hasVideos = pages.some(p => p.videoUrl || p.qrCodeData);
    
    let finalS3Key = s3Key;
    let storageType: 'local' | 's3' = 'local';
    
    if (hasVideos && S3_BUCKET) {
      // Upload to S3 for PDFs with videos
      storageType = 's3';
      await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        ContentDisposition: `attachment; filename="${filename}"`,
      }));
      console.log(`PDF with videos stored in S3: ${s3Key}`);
    } else {
      // Store locally for PDFs without videos
      storageType = 'local';
      const localDir = path.join(LOCAL_PDF_DIR, bookId);
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      const localPath = path.join(localDir, filename);
      fs.writeFileSync(localPath, pdfBuffer);
      finalS3Key = `local:${bookId}/${filename}`;
      console.log(`PDF without videos stored locally: ${localPath}`);
    }

    // Check if this export has a manual override - if so, don't change status automatically
    const currentExport = await storage.getPdfExport(pdfExport.id);
    const shouldUpdateStatus = !currentExport?.manualOverride;
    
    const updatedExport = await storage.updatePdfExport(pdfExport.id, {
      ...(shouldUpdateStatus ? { status: 'completed' } : {}),
      fileSize: pdfBuffer.length,
      pageCount: pages.length,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      s3Key: finalS3Key,
    });
    
    if (!shouldUpdateStatus) {
      console.log(`PDF ${pdfExport.id} has manual override, keeping status: ${currentExport?.status}`);
    }

    return updatedExport!;
  } catch (error) {
    // For failures, we should still update status even with manual override (safety measure)
    await storage.updatePdfExport(pdfExport.id, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Check if storage key points to local or S3
function isLocalStorage(storageKey: string): boolean {
  return storageKey.startsWith('local:');
}

// Get local file path from storage key
function getLocalFilePath(storageKey: string): string {
  const relativePath = storageKey.replace('local:', '');
  return path.join(LOCAL_PDF_DIR, relativePath);
}

export async function checkStorageExists(storageKey: string): Promise<boolean> {
  if (isLocalStorage(storageKey)) {
    const localPath = getLocalFilePath(storageKey);
    return fs.existsSync(localPath);
  }
  
  // S3 storage
  if (!S3_BUCKET) {
    throw new Error('S3 bucket not configured');
  }
  
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: S3_BUCKET,
      Key: storageKey,
    }));
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

// Keep for backward compatibility
export async function checkS3ObjectExists(s3Key: string): Promise<boolean> {
  return checkStorageExists(s3Key);
}

export async function getSignedDownloadUrl(storageKey: string, expiresIn: number = 3600): Promise<string> {
  if (isLocalStorage(storageKey)) {
    // For local storage, return a local API endpoint URL
    const relativePath = storageKey.replace('local:', '');
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';
    return `${baseUrl}/api/pdf-download/${encodeURIComponent(relativePath)}`;
  }
  
  // S3 storage
  if (!S3_BUCKET) {
    throw new Error('S3 bucket not configured');
  }
  
  const exists = await checkStorageExists(storageKey);
  if (!exists) {
    throw new Error('PDF file not found in storage');
  }
  
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: storageKey,
  });
  
  return getSignedUrl(s3Client, command, { expiresIn });
}

// Get local PDF buffer for serving
export function getLocalPdfBuffer(relativePath: string): Buffer | null {
  const localPath = path.join(LOCAL_PDF_DIR, relativePath);
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath);
  }
  return null;
}

export async function getPdfExportWithSignedUrl(exportId: string): Promise<{ export: PdfExport; downloadUrl: string } | null> {
  const pdfExport = await storage.getPdfExport(exportId);
  if (!pdfExport || pdfExport.status !== 'completed') {
    return null;
  }

  const downloadUrl = await getSignedDownloadUrl(pdfExport.s3Key);
  return { export: pdfExport, downloadUrl };
}

// Generate PDF and send to customer via email
interface GenerateAndSendOptions extends GeneratePdfOptions {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
}

export async function generateAndSendPdfToCustomer(options: GenerateAndSendOptions): Promise<{ pdfExport: PdfExport; emailSent: boolean }> {
  const { customerEmail, customerName, orderNumber, ...pdfOptions } = options;
  
  const pdfExport = await generateBookPdf(pdfOptions);
  
  if (pdfExport.status !== 'completed') {
    return { pdfExport, emailSent: false };
  }
  
  const book = await storage.getBook(pdfOptions.bookId);
  const bookName = book?.childName || 'Mon album Memoria';
  
  const downloadUrl = await getSignedDownloadUrl(pdfExport.s3Key, 7 * 24 * 60 * 60);
  
  const { sendPdfDeliveryEmail } = await import('./emailService');
  const emailSent = await sendPdfDeliveryEmail({
    customerEmail,
    customerName,
    bookName,
    orderNumber,
    downloadUrl,
    expiresInDays: 7,
  });
  
  return { pdfExport, emailSent };
}
