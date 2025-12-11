import puppeteer from 'puppeteer';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { storage } from './storage';
import type { PdfExport } from '@shared/schema';

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
  letter: { width: 8.5, height: 11 },
  a4: { width: 8.27, height: 11.69 },
};

function generatePageHtml(page: BookPageData, format: 'letter' | 'a4' = 'letter'): string {
  const dims = FORMAT_DIMENSIONS[format];
  const hasText = page.textBlocks?.some(block => block.content?.trim());
  const hasPhotos = page.photos?.length > 0;
  const textPlacement = hasText ? (page.textPlacement || 'top') : 'none';

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
      padding: 0.5in;
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
      ${pages.map(page => generatePageHtml(page, format)).join('')}
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
    const response = await fetch(`${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/api/books/${bookId}/pages`);
    if (!response.ok) {
      throw new Error('Failed to fetch book pages');
    }
    const bookData = await response.json();
    
    const pages: BookPageData[] = [];
    const userPagesMap = new Map(bookData.pages.map((p: any) => [p.pageNumber, p]));

    for (const templatePage of bookData.templatePages || []) {
      const userPage = userPagesMap.get(templatePage.pageNumber) as any;
      
      pages.push({
        pageNumber: templatePage.pageNumber,
        title: templatePage.titleFr || templatePage.title,
        subtitle: templatePage.subtitleFr || templatePage.subtitle,
        photos: userPage?.photos || [],
        textBlocks: userPage?.textBlocks || [],
        titleStyle: userPage?.titleStyle || {},
        collageStyle: userPage?.collageStyle || 'grid',
        textPlacement: userPage?.textPlacement || 'top',
        videoUrl: userPage?.videoUrl,
        qrCodeData: userPage?.qrCodeData,
      });
    }

    const html = generateFullHtml(pages, format);
    const dims = FORMAT_DIMENSIONS[format];

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
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

    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ContentDisposition: `attachment; filename="${filename}"`,
    }));

    const updatedExport = await storage.updatePdfExport(pdfExport.id, {
      status: 'completed',
      fileSize: pdfBuffer.length,
      pageCount: pages.length,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return updatedExport!;
  } catch (error) {
    await storage.updatePdfExport(pdfExport.id, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function checkS3ObjectExists(s3Key: string): Promise<boolean> {
  if (!S3_BUCKET) {
    throw new Error('S3 bucket not configured');
  }
  
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
    }));
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

export async function getSignedDownloadUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
  if (!S3_BUCKET) {
    throw new Error('S3 bucket not configured');
  }
  
  const exists = await checkS3ObjectExists(s3Key);
  if (!exists) {
    throw new Error('PDF file not found in storage');
  }
  
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
  });
  
  return getSignedUrl(s3Client, command, { expiresIn });
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
