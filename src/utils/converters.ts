import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import type { RenderParameters } from 'pdfjs-dist/types/src/display/api';
import Tesseract from 'tesseract.js';
import Papa from 'papaparse';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';

import pdfjsWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

// ─── Constants ───────────────────────────────────────────────────────────────

/** Largest canvas area that works reliably on Safari/iOS (4096 × 4096 px). */
const MAX_CANVAS_AREA = 4096 * 4096;
/** Maximum linear dimension to avoid OOM on low-RAM devices. */
const MAX_CANVAS_DIM = 4096;

/** Per-tool upload limits (bytes). */
export const FILE_SIZE_LIMITS: Record<string, number> = {
  'image-to-pdf': 50 * 1024 * 1024,   // 50 MB per image
  'pdf-to-jpg':   100 * 1024 * 1024,  // 100 MB
  'txt-to-pdf':   10 * 1024 * 1024,   // 10 MB
  'csv-to-pdf':   10 * 1024 * 1024,   // 10 MB
  'html-to-pdf':  5 * 1024 * 1024,    // 5 MB
  'pdf-ocr':      50 * 1024 * 1024,   // 50 MB
  'flatten-pdf':  100 * 1024 * 1024,  // 100 MB
};

const MAX_IMAGE_COUNT = 50;

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateFiles(toolId: string, files: File[]): string | null {
  if (files.length === 0) return 'No file selected.';
  if (toolId === 'image-to-pdf' && files.length > MAX_IMAGE_COUNT)
    return `Maximum ${MAX_IMAGE_COUNT} images at once.`;

  const limit = FILE_SIZE_LIMITS[toolId];
  if (limit) {
    for (const f of files) {
      if (f.size > limit) {
        const mb = Math.round(limit / 1024 / 1024);
        return `"${f.name}" exceeds the ${mb} MB size limit for this tool.`;
      }
    }
  }
  return null;
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

/** Clamp a canvas dimension so it fits within Safari's limits. */
function clampDimensions(w: number, h: number): { w: number; h: number } {
  if (w <= MAX_CANVAS_DIM && h <= MAX_CANVAS_DIM && w * h <= MAX_CANVAS_AREA) {
    return { w, h };
  }
  const scaleByDim = Math.min(MAX_CANVAS_DIM / w, MAX_CANVAS_DIM / h);
  const scaleByArea = Math.sqrt(MAX_CANVAS_AREA / (w * h));
  const scale = Math.min(scaleByDim, scaleByArea);
  return { w: Math.floor(w * scale), h: Math.floor(h * scale) };
}

// ─── Image to PDF ────────────────────────────────────────────────────────────

function imageFileToJpegBytes(
  file: File,
): Promise<{ data: Uint8Array; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const { w, h } = clampDimensions(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error(`Browser could not create a canvas context for "${file.name}". Try a smaller image.`));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob: Blob | null) => {
          if (!blob) {
            reject(new Error(`Could not encode "${file.name}" as JPEG. The image may be corrupted or in an unsupported format.`));
            return;
          }
          blob.arrayBuffer()
            .then(buf => resolve({ data: new Uint8Array(buf), width: w, height: h }))
            .catch(() => reject(new Error(`Failed to read encoded image data for "${file.name}".`)));
        },
        'image/jpeg',
        0.95,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not open "${file.name}". Make sure it is a valid JPG, PNG, or WebP file.`));
    };

    img.src = url;
  });
}

export async function imageToPdf(
  files: File[],
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  if (files.length === 0) throw new Error('No images provided.');

  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    let imageData: { data: Uint8Array; width: number; height: number };
    try {
      imageData = await imageFileToJpegBytes(files[i]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to process image ${i + 1}.`;
      throw new Error(msg, { cause: err });
    }
    const image = await pdfDoc.embedJpg(imageData.data).catch(() => {
      throw new Error(`Could not embed "${files[i].name}" into the PDF. The file may be corrupt.`);
    });
    const page = pdfDoc.addPage([imageData.width, imageData.height]);
    page.drawImage(image, { x: 0, y: 0, width: imageData.width, height: imageData.height });
    onProgress?.(Math.round(((i + 1) / files.length) * 100));
  }

  const bytes = await pdfDoc.save().catch(() => { throw new Error('Failed to finalise the PDF. Please try again.'); });
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

// ─── PDF to JPG ───────────────────────────────────────────────────────────────

export async function pdfToJpg(
  file: File,
  onProgress?: (pct: number, page: number, total: number) => void,
): Promise<Blob> {
  let pdfData: ArrayBuffer;
  try {
    pdfData = await file.arrayBuffer();
  } catch {
    throw new Error('Could not read the PDF file. It may be locked or corrupted.');
  }

  let pdf: pdfjsLib.PDFDocumentProxy;
  try {
    pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  } catch {
    throw new Error('Could not parse the PDF. Make sure the file is a valid, non-encrypted PDF.');
  }

  const zip = new JSZip();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const { w, h } = clampDimensions(viewport.width, viewport.height);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error(`Browser refused canvas on page ${i}. Try closing other tabs and retrying.`);

    const scaledViewport = page.getViewport({ scale: 2 * (w / viewport.width) });
    await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas } as RenderParameters).promise;

    const jpegBlob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob(
        (b: Blob | null) => b ? res(b) : rej(new Error(`Failed to encode page ${i} as JPEG.`)),
        'image/jpeg',
        0.92,
      ),
    );
    zip.file(`page-${String(i).padStart(3, '0')}.jpg`, await jpegBlob.arrayBuffer());
    onProgress?.(Math.round((i / pdf.numPages) * 100), i, pdf.numPages);
  }

  return zip.generateAsync({ type: 'blob' });
}

// ─── TXT to PDF ───────────────────────────────────────────────────────────────

export async function txtToPdf(file: File): Promise<Blob> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    throw new Error('Could not read the text file. Make sure it is a plain .txt or .md file.');
  }

  if (!text.trim()) throw new Error('The file appears to be empty. Nothing to convert.');

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Courier);

  const PW = 595.28;
  const PH = 841.89;
  const margin = 50;
  const fontSize = 10;
  const lineHeight = 14;

  let page = pdfDoc.addPage([PW, PH]);
  let y = PH - margin;

  const maxChars = Math.floor((PW - margin * 2) / (fontSize * 0.6));

  for (const rawLine of text.split('\n')) {
    const words = rawLine.split(' ');
    let line = '';

    for (const word of words) {
      if ((line + word).length > maxChars && line) {
        if (y < margin + lineHeight) {
          page = pdfDoc.addPage([PW, PH]);
          y = PH - margin;
        }
        page.drawText(line.trimEnd(), { x: margin, y, size: fontSize, font, color: rgb(0.05, 0.05, 0.05) });
        y -= lineHeight;
        line = '';
      }
      line += word + ' ';
    }

    if (y < margin + lineHeight) {
      page = pdfDoc.addPage([PW, PH]);
      y = PH - margin;
    }
    if (line.trim()) {
      page.drawText(line.trimEnd(), { x: margin, y, size: fontSize, font, color: rgb(0.05, 0.05, 0.05) });
    }
    y -= lineHeight;
  }

  const bytes = await pdfDoc.save();
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

// ─── CSV to PDF ───────────────────────────────────────────────────────────────

export async function csvToPdf(file: File): Promise<Blob> {
  let csvText: string;
  try {
    csvText = await file.text();
  } catch {
    throw new Error('Could not read the CSV file.');
  }

  const { data: rows, errors } = Papa.parse<string[]>(csvText, { skipEmptyLines: true });

  if (errors.length && rows.length === 0) {
    throw new Error('The CSV file could not be parsed. Make sure it uses comma or tab separators.');
  }
  if (rows.length === 0) throw new Error('The CSV file is empty. Nothing to convert.');

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PW = 841.89;
  const PH = 595.28;
  const margin = 40;
  const rowH = 18;
  const fontSize = 9;

  let page = pdfDoc.addPage([PW, PH]);
  let y = PH - margin;

  const colCount = Math.max(...rows.map(r => r.length), 1);
  const colW = (PW - margin * 2) / colCount;

  for (let ri = 0; ri < rows.length; ri++) {
    if (y < margin + rowH) {
      page = pdfDoc.addPage([PW, PH]);
      y = PH - margin;
    }

    const isHeader = ri === 0;

    page.drawRectangle({
      x: margin,
      y: y - rowH + 4,
      width: PW - margin * 2,
      height: rowH,
      color: isHeader ? rgb(0.24, 0.81, 0.55) : ri % 2 === 0 ? rgb(0.97, 0.97, 0.97) : rgb(1, 1, 1),
      opacity: isHeader ? 0.2 : 0.6,
    });

    for (let ci = 0; ci < rows[ri].length; ci++) {
      const cell = String(rows[ri][ci] ?? '').slice(0, 35);
      page.drawText(cell, {
        x: margin + ci * colW + 4,
        y: y + 1,
        size: fontSize,
        font: isHeader ? boldFont : font,
        color: isHeader ? rgb(0.1, 0.4, 0.3) : rgb(0.1, 0.1, 0.1),
      });
    }

    y -= rowH;
  }

  const bytes = await pdfDoc.save();
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

// ─── HTML to PDF ─────────────────────────────────────────────────────────────

export async function htmlToPdf(file: File): Promise<Blob> {
  let htmlText: string;
  try {
    htmlText = await file.text();
  } catch {
    throw new Error('Could not read the HTML file.');
  }

  if (!htmlText.trim()) throw new Error('The HTML file is empty. Nothing to render.');

  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;left:-10000px;top:0;width:1024px;height:768px;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  await new Promise<void>(resolve => {
    iframe.onload = () => resolve();
    iframe.srcdoc = htmlText;
    setTimeout(resolve, 3000);
  });

  const target = iframe.contentDocument?.body ?? document.body;

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(target, { scale: 1.5, useCORS: true, allowTaint: true });
  } catch {
    document.body.removeChild(iframe);
    throw new Error('Could not render the HTML. The page may reference external resources that are blocked by CORS.');
  }
  document.body.removeChild(iframe);

  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error('The HTML rendered as an empty page. Check that the file has visible content.');
  }

  const pngBlob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob(
      (b: Blob | null) => b ? res(b) : rej(new Error('Failed to encode the rendered HTML as an image.')),
      'image/png',
    ),
  );
  const pngBytes = await pngBlob.arrayBuffer();

  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(pngBytes).catch(() => {
    throw new Error('Could not embed the rendered page into the PDF.');
  });
  const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
  page.drawImage(pngImage, { x: 0, y: 0, width: pngImage.width, height: pngImage.height });

  const bytes = await pdfDoc.save();
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

// ─── PDF OCR ─────────────────────────────────────────────────────────────────

export async function pdfOcr(
  file: File,
  onProgress?: (pct: number, page: number, total: number) => void,
): Promise<string> {
  let pdfData: ArrayBuffer;
  try {
    pdfData = await file.arrayBuffer();
  } catch {
    throw new Error('Could not read the PDF file.');
  }

  let pdf: pdfjsLib.PDFDocumentProxy;
  try {
    pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  } catch {
    throw new Error('Could not parse the PDF. Make sure the file is a valid, non-encrypted PDF.');
  }

  let worker: Tesseract.Worker;
  try {
    worker = await Tesseract.createWorker('eng');
  } catch {
    throw new Error('OCR engine failed to load. Check your internet connection and try again.');
  }

  let fullText = '';

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const { w, h } = clampDimensions(viewport.width, viewport.height);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error(`Browser refused a canvas on page ${i}.`);

      const scaledViewport = page.getViewport({ scale: 2 * (w / viewport.width) });
      await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas } as RenderParameters).promise;

      const { data: { text } } = await worker.recognize(canvas);
      fullText += `=== Page ${i} ===\n${text.trim()}\n\n`;
      onProgress?.(Math.round((i / pdf.numPages) * 100), i, pdf.numPages);
    }
  } finally {
    await worker.terminate();
  }

  if (!fullText.trim()) {
    throw new Error('No text was found in this PDF. It may be an image-only scan with no detectable characters.');
  }

  return fullText.trim();
}

// ─── Flatten PDF ─────────────────────────────────────────────────────────────

export async function flattenPdf(file: File): Promise<Blob> {
  let pdfBytesIn: ArrayBuffer;
  try {
    pdfBytesIn = await file.arrayBuffer();
  } catch {
    throw new Error('Could not read the PDF file.');
  }

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(pdfBytesIn);
  } catch {
    throw new Error('Could not parse the PDF. The file may be corrupted or password-protected.');
  }

  try {
    pdfDoc.getForm().flatten();
  } catch {
    // No form fields — still return the PDF re-saved cleanly.
  }

  const bytes = await pdfDoc.save().catch(() => { throw new Error('Failed to save the flattened PDF.'); });
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}



export async function pdfToWord(file: File, onProgress: (pct: number) => void): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const paragraphs = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(' ');
    paragraphs.push(new Paragraph({ children: [new TextRun(text)] }));
    onProgress((i / pdf.numPages) * 100);
  }
  
  const doc = new DocxDocument({ sections: [{ children: paragraphs }] });
  return await Packer.toBlob(doc);
}

export async function pdfToExcel(file: File, onProgress: (pct: number) => void): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let allText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    allText += content.items.map((item: any) => item.str).join(' ') + '\n';
    onProgress((i / pdf.numPages) * 100);
  }
  
  const rows = allText.split('\n').map(line => line.split(/\s{2,}/));
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function wordToPdf(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  
  const fullHtml = `<!DOCTYPE html>
<html><head><style>
  body { font-family: sans-serif; padding: 20px; line-height: 1.5; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
  th, td { border: 1px solid #ccc; padding: 8px; }
  img { max-width: 100%; height: auto; }
</style></head><body>${result.value}</body></html>`;

  const htmlFile = new File([fullHtml], "word.html", { type: "text/html" });
  return await htmlToPdf(htmlFile);
}

export async function excelToPdf(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const html = XLSX.utils.sheet_to_html(worksheet);
  
  const fullHtml = `<!DOCTYPE html>
<html><head><style>
  body { font-family: sans-serif; padding: 20px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
  th { background-color: #f4f4f4; }
</style></head><body>${html}</body></html>`;

  const htmlFile = new File([fullHtml], "excel.html", { type: "text/html" });
  return await htmlToPdf(htmlFile);
}

export async function compressPdf(file: File, level: 'low' | 'medium' | 'high' = 'medium'): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();

  // Low compression: just useObjectStreams which losslessly compresses PDF structure
  if (level === 'low') {
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
  }

  // Medium / High: Rasterize pages to JPEG to force compression of all images/vectors
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const newPdfDoc = await PDFDocument.create();

  let scale = level === 'high' ? 0.7 : 1.2;
  let quality = level === 'high' ? 0.3 : 0.6;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    
    await page.render({ canvasContext: ctx, viewport } as any).promise;
    
    // Convert to compressed JPEG
    const imgDataUrl = canvas.toDataURL('image/jpeg', quality);
    const imgBytes = await fetch(imgDataUrl).then(res => res.arrayBuffer());
    
    const jpgImage = await newPdfDoc.embedJpg(imgBytes);
    
    // Use the ORIGINAL viewport dimensions so the PDF size remains physically the same
    const origViewport = page.getViewport({ scale: 1.0 });
    const pdfPage = newPdfDoc.addPage([origViewport.width, origViewport.height]);
    
    pdfPage.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width: origViewport.width,
      height: origViewport.height,
    });
  }

  const pdfBytes = await newPdfDoc.save({ useObjectStreams: true });
  return new Blob([pdfBytes as any], { type: 'application/pdf' });
}

export async function protectPdf(file: File, password: string): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let jsPdfDoc: jsPDF | null = null;
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({ canvasContext: ctx, viewport } as any).promise;
    
    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    const widthMm = (viewport.width / 2) * 0.264583;
    const heightMm = (viewport.height / 2) * 0.264583;
    
    if (i === 1) {
      jsPdfDoc = new jsPDF({
        orientation: widthMm > heightMm ? 'l' : 'p',
        unit: 'mm',
        format: [widthMm, heightMm],
        encryption: {
          userPassword: password,
          ownerPassword: password,
          userPermissions: ['print', 'modify', 'copy', 'annot-forms']
        }
      });
    } else {
      jsPdfDoc!.addPage([widthMm, heightMm], widthMm > heightMm ? 'l' : 'p');
    }
    
    jsPdfDoc!.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm);
  }
  
  if (!jsPdfDoc) throw new Error('No pages found');
  
  const arrayBufferOut = jsPdfDoc.output('arraybuffer');
  return new Blob([arrayBufferOut], { type: 'application/pdf' });
}


import pptxgen from "pptxgenjs";

export async function pdfToPpt(file: File, onProgress: (pct: number) => void): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pptx = new pptxgen();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport } as any).promise;
    
    const imgData = canvas.toDataURL("image/jpeg", 0.85);
    
    const slide = pptx.addSlide();
    slide.addImage({ data: imgData, x: 0, y: 0, w: "100%", h: "100%" });
    onProgress((i / pdf.numPages) * 100);
  }

  const blob = await pptx.write({ outputType: "blob" }) as Blob;
  return blob;
}

export async function pptToPdf(file: File, onProgress: (pct: number) => void): Promise<Blob> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);
  const pdf = new jsPDF();
  let pageCount = 0;
  
  const slideFiles = Object.keys(contents.files).filter(name => name.match(/ppt\/slides\/slide\d+\.xml/));
  
  if (slideFiles.length === 0) {
    throw new Error("Could not find any slides in this PowerPoint file.");
  }

  for (let i = 0; i < slideFiles.length; i++) {
    const slideName = "ppt/slides/slide1.xml";
    if (!contents.files[slideName]) continue;
    
    const xml = await contents.files[slideName].async("text");
    const matches = xml.match(/<a:t>(.*?)<\/a:t>/g);
    let text = "";
    if (matches) {
      text = matches.map(m => m.replace(/<a:t>/g, "").replace(/<\/a:t>/g, "")).join(" ");
    }
    
    if (pageCount > 0) pdf.addPage();
    
    const lines = pdf.splitTextToSize(text || " ", 180);
    pdf.text(lines, 15, 20);
    pageCount++;
    onProgress(((i + 1) / slideFiles.length) * 100);
  }

  return new Blob([pdf.output("arraybuffer") as any], { type: "application/pdf" });
}

export async function odtToPdf(file: File): Promise<Blob> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);
  const pdf = new jsPDF();
  
  if (!contents.files["content.xml"]) {
    throw new Error("Could not find content.xml in this ODT/ODS/ODP file.");
  }
  
  const xml = await contents.files["content.xml"].async("text");
  
  const matches = xml.match(/<text:p[^>]*>(.*?)<\/text:p>/g);
  let textLines: string[] = [];
  if (matches) {
    textLines = matches.map(m => m.replace(/<text:p[^>]*>/g, "").replace(/<\/text:p>/g, "").replace(/<[^>]+>/g, ""));
  }
  
  const fullText = textLines.join("\n");
  const lines = pdf.splitTextToSize(fullText, 180);
  
  let y = 20;
  for (let i = 0; i < lines.length; i++) {
    if (y > 280) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(lines[i], 15, y);
    y += 7;
  }
  
  return new Blob([pdf.output("arraybuffer") as any], { type: "application/pdf" });
}

export async function pagesToPdf(file: File): Promise<Blob> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);
  
  if (contents.files["QuickLook/Preview.pdf"]) {
    const pdfBytes = await contents.files["QuickLook/Preview.pdf"].async("uint8array");
    return new Blob([pdfBytes as any], { type: "application/pdf" });
  } else {
    throw new Error("This Pages document does not contain a QuickLook Preview.pdf. Try saving it in Pages with 'Include preview in document' enabled.");
  }
}
