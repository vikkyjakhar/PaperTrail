/**
 * Unit tests for src/utils/converters.ts
 *
 * All heavy browser APIs (canvas, pdfjs, tesseract, html2canvas) are mocked.
 * Tests verify: argument validation, empty/malformed input rejection, correct
 * output types, multi-page / multi-file routing, and the canvas size guard.
 */

import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';

// ─── Hoist mock state so vi.mock factories can reference it ──────────────────

const mocks = vi.hoisted(() => {
  const save = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
  const addPage = vi.fn().mockReturnValue({
    drawImage: vi.fn(),
    drawText: vi.fn(),
    drawRectangle: vi.fn(),
  });
  const embedJpg = vi.fn().mockResolvedValue({ width: 100, height: 200 });
  const embedPng = vi.fn().mockResolvedValue({ width: 100, height: 200 });
  const embedFont = vi.fn().mockResolvedValue({});
  const getForm = vi.fn().mockReturnValue({ flatten: vi.fn() });
  const pdfDoc = { addPage, embedJpg, embedPng, embedFont, getForm, save };

  const render = vi.fn().mockReturnValue({ promise: Promise.resolve() });
  const getPage = vi.fn().mockResolvedValue({
    getViewport: vi.fn().mockReturnValue({ width: 800, height: 600 }),
    render,
  });
  const getDocument = vi.fn().mockReturnValue({
    promise: Promise.resolve({ numPages: 2, getPage }),
  });

  const terminate = vi.fn().mockResolvedValue(undefined);
  const recognize = vi.fn().mockResolvedValue({ data: { text: 'hello ocr' } });
  const createWorker = vi.fn().mockResolvedValue({ recognize, terminate });

  const html2canvasMock = vi.fn().mockResolvedValue({
    width: 1024,
    height: 768,
    toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['png'], { type: 'image/png' })),
  });

  const papaParse = vi.fn().mockReturnValue({
    data: [['Name', 'Age'], ['Alice', '30']],
    errors: [],
  });

  const zipFile = vi.fn();
  const generateAsync = vi.fn().mockResolvedValue(new Blob(['zip']));

  return { save, addPage, embedJpg, embedPng, embedFont, getForm, pdfDoc,
           render, getPage, getDocument, terminate, recognize, createWorker,
           html2canvasMock, papaParse, zipFile, generateAsync };
});

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: vi.fn().mockResolvedValue(mocks.pdfDoc),
    load: vi.fn().mockResolvedValue(mocks.pdfDoc),
  },
  StandardFonts: { Courier: 'Courier', Helvetica: 'Helvetica', HelveticaBold: 'HelveticaBold' },
  rgb: vi.fn().mockReturnValue({}),
}));

vi.mock('pdfjs-dist', () => ({
  default: {},
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: (args: unknown) => mocks.getDocument(args),
}));

vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: 'worker.js' }));

vi.mock('tesseract.js', () => ({
  default: { createWorker: (...args: unknown[]) => mocks.createWorker(...args) },
}));

vi.mock('html2canvas', () => ({
  default: (...args: unknown[]) => mocks.html2canvasMock(...args),
}));

vi.mock('papaparse', () => ({
  default: { parse: (...args: unknown[]) => mocks.papaParse(...args) },
}));

vi.mock('jszip', () => {
  const ZipCtor = function (this: Record<string, unknown>) {
    this.file = mocks.zipFile;
    this.generateAsync = mocks.generateAsync;
  };
  return { default: ZipCtor };
});

// ─── Import module under test (after mocks are set up) ───────────────────────

import { validateFiles, FILE_SIZE_LIMITS } from './converters';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const originalCreateElement = document.createElement.bind(document);

function makeFakeCanvas(opts: { width?: number; height?: number } = {}) {
  const { width = 100, height = 100 } = opts;
  return {
    width,
    height,
    getContext: vi.fn().mockReturnValue({ drawImage: vi.fn() }),
    toBlob: (cb: (b: Blob | null) => void) =>
      cb(new Blob([new Uint8Array([255])], { type: 'image/jpeg' })),
  };
}

function makeFakeImg(naturalWidth = 100, naturalHeight = 200, fail = false) {
  const img: {
    onload: (() => void) | null;
    onerror: (() => void) | null;
    src: string;
    naturalWidth: number;
    naturalHeight: number;
  } = {
    onload: null, onerror: null, src: '',
    naturalWidth, naturalHeight,
  };
  setTimeout(() => (fail ? img.onerror?.() : img.onload?.()), 0);
  return img;
}

// ─── Tests: validateFiles ─────────────────────────────────────────────────────

describe('validateFiles', () => {
  it('returns error for empty files array', () => {
    expect(validateFiles('image-to-pdf', [])).toBe('No file selected.');
  });

  it('returns null for one valid file', () => {
    const f = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    expect(validateFiles('image-to-pdf', [f])).toBeNull();
  });

  it('rejects more than 50 images', () => {
    const files = Array.from({ length: 51 }, (_, i) =>
      new File(['x'], `img${i}.jpg`, { type: 'image/jpeg' }),
    );
    expect(validateFiles('image-to-pdf', files)).toMatch(/Maximum 50/);
  });

  it('allows exactly 50 images', () => {
    const files = Array.from({ length: 50 }, (_, i) =>
      new File(['x'], `img${i}.jpg`, { type: 'image/jpeg' }),
    );
    expect(validateFiles('image-to-pdf', files)).toBeNull();
  });

  it('rejects a file exceeding the tool size limit', () => {
    const limit = FILE_SIZE_LIMITS['pdf-ocr'];
    const oversized = new File([new Uint8Array(limit + 1)], 'big.pdf');
    expect(validateFiles('pdf-ocr', [oversized])).toMatch(/exceeds the 50 MB/);
  });

  it('accepts a file exactly at the size limit', () => {
    const limit = FILE_SIZE_LIMITS['pdf-ocr'];
    const exact = new File([new Uint8Array(limit)], 'exact.pdf');
    expect(validateFiles('pdf-ocr', [exact])).toBeNull();
  });

  it('returns null for an unknown toolId (no limit)', () => {
    expect(validateFiles('unknown-tool', [new File(['x'], 'f.pdf')])).toBeNull();
  });
});

// ─── Tests: imageToPdf ────────────────────────────────────────────────────────

describe('imageToPdf', () => {
  let createElement: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    // Re-attach default implementations after clearAllMocks
    mocks.save.mockResolvedValue(new Uint8Array([1, 2, 3]));
    mocks.addPage.mockReturnValue({ drawImage: vi.fn(), drawText: vi.fn(), drawRectangle: vi.fn() });
    mocks.embedJpg.mockResolvedValue({ width: 100, height: 200 });
    mocks.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 2, getPage: mocks.getPage }) });
    mocks.getPage.mockResolvedValue({ getViewport: vi.fn().mockReturnValue({ width: 800, height: 600 }), render: mocks.render });
    mocks.render.mockReturnValue({ promise: Promise.resolve() });
    mocks.recognize.mockResolvedValue({ data: { text: 'hello ocr' } });
    mocks.terminate.mockResolvedValue(undefined);
    mocks.generateAsync.mockResolvedValue(new Blob(['zip']));
    mocks.html2canvasMock.mockResolvedValue({
      width: 1024, height: 768,
      toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['png'], { type: 'image/png' })),
    });
    mocks.papaParse.mockReturnValue({ data: [['Name', 'Age'], ['Alice', '30']], errors: [] });

    URL.createObjectURL = vi.fn().mockReturnValue('blob:fake');
    URL.revokeObjectURL = vi.fn();
    createElement = vi.spyOn(document, 'createElement');
  });

  it('throws for empty files array', async () => {
    const { imageToPdf } = await import('./converters');
    await expect(imageToPdf([])).rejects.toThrow('No images provided.');
  });

  it('converts a single image', async () => {
    createElement.mockImplementation((tag: string) => {
      if (tag === 'canvas') return makeFakeCanvas();
      if (tag === 'img') return makeFakeImg();
      return originalCreateElement(tag);
    });

    const { imageToPdf } = await import('./converters');
    const file = new File(['fake'], 'test.jpg', { type: 'image/jpeg' });
    const result = await imageToPdf([file]);
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/pdf');
    expect(mocks.addPage).toHaveBeenCalledTimes(1);
  });

  it('creates one page per image for multi-file input', async () => {
    createElement.mockImplementation((tag: string) => {
      if (tag === 'canvas') return makeFakeCanvas();
      if (tag === 'img') return makeFakeImg(50, 50);
      return originalCreateElement(tag);
    });

    const { imageToPdf } = await import('./converters');
    const files = [
      new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg'), new File(['c'], 'c.jpg'),
    ];
    const progress: number[] = [];
    await imageToPdf(files, pct => progress.push(pct));

    expect(mocks.addPage).toHaveBeenCalledTimes(3);
    expect(progress).toEqual([
      Math.round((1 / 3) * 100),
      Math.round((2 / 3) * 100),
      100,
    ]);
  });

  it('throws user-facing error when image decode fails', async () => {
    createElement.mockImplementation((tag: string) => {
      if (tag === 'canvas') return makeFakeCanvas();
      if (tag === 'img') return makeFakeImg(0, 0, true /* fail */);
      return originalCreateElement(tag);
    });

    const { imageToPdf } = await import('./converters');
    const file = new File(['bad'], 'corrupt.jpg', { type: 'image/jpeg' });
    await expect(imageToPdf([file])).rejects.toThrow(/Could not open "corrupt.jpg"/);
  });
});

// ─── Tests: pdfToJpg ─────────────────────────────────────────────────────────

describe('pdfToJpg', () => {
  let createElement: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.save.mockResolvedValue(new Uint8Array([1, 2, 3]));
    mocks.addPage.mockReturnValue({ drawImage: vi.fn() });
    mocks.render.mockReturnValue({ promise: Promise.resolve() });
    mocks.getPage.mockResolvedValue({ getViewport: vi.fn().mockReturnValue({ width: 800, height: 600 }), render: mocks.render });
    mocks.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 2, getPage: mocks.getPage }) });
    mocks.generateAsync.mockResolvedValue(new Blob(['zip']));
    mocks.zipFile.mockReset();
    createElement = vi.spyOn(document, 'createElement');
  });

  it('produces a zip with one jpg per page', async () => {
    createElement.mockImplementation((tag: string) => {
      if (tag === 'canvas') return makeFakeCanvas();
      return originalCreateElement(tag);
    });

    const { pdfToJpg } = await import('./converters');
    const file = new File([new Uint8Array([1, 2, 3])], 'test.pdf', { type: 'application/pdf' });
    const result = await pdfToJpg(file);
    expect(result).toBeInstanceOf(Blob);
    expect(mocks.zipFile).toHaveBeenCalledTimes(2);
    expect(mocks.zipFile.mock.calls[0][0]).toBe('page-001.jpg');
    expect(mocks.zipFile.mock.calls[1][0]).toBe('page-002.jpg');
  });

  it('reports per-page progress', async () => {
    createElement.mockImplementation((tag: string) => {
      if (tag === 'canvas') return makeFakeCanvas();
      return originalCreateElement(tag);
    });

    const { pdfToJpg } = await import('./converters');
    const file = new File([new Uint8Array([0])], 'doc.pdf');
    const calls: Array<[number, number, number]> = [];
    await pdfToJpg(file, (pct, page, total) => calls.push([pct, page, total]));

    expect(calls).toHaveLength(2);
    expect(calls[0]).toEqual([50, 1, 2]);
    expect(calls[1]).toEqual([100, 2, 2]);
  });

  it('throws when PDF cannot be parsed', async () => {
    mocks.getDocument.mockReturnValueOnce({ promise: Promise.reject(new Error('parse error')) });
    const { pdfToJpg } = await import('./converters');
    const file = new File(['bad'], 'bad.pdf');
    await expect(pdfToJpg(file)).rejects.toThrow(/Could not parse the PDF/);
  });
});

// ─── Tests: txtToPdf ─────────────────────────────────────────────────────────

describe('txtToPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.save.mockResolvedValue(new Uint8Array([1, 2, 3]));
    mocks.addPage.mockReturnValue({ drawImage: vi.fn(), drawText: vi.fn(), drawRectangle: vi.fn() });
    mocks.embedFont.mockResolvedValue({});
  });

  it('throws for an empty text file', async () => {
    const { txtToPdf } = await import('./converters');
    const file = new File(['  \n  '], 'empty.txt', { type: 'text/plain' });
    await expect(txtToPdf(file)).rejects.toThrow(/appears to be empty/);
  });

  it('converts a single-line text file', async () => {
    const { txtToPdf } = await import('./converters');
    const file = new File(['Hello world'], 'hello.txt', { type: 'text/plain' });
    const result = await txtToPdf(file);
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/pdf');
  });

  it('paginates long content across multiple pages', async () => {
    mocks.addPage.mockReturnValue({ drawText: vi.fn(), drawRectangle: vi.fn(), drawImage: vi.fn() });
    const { txtToPdf } = await import('./converters');
    const longText = Array.from({ length: 300 }, (_, i) => `Line ${i}: ${'x'.repeat(80)}`).join('\n');
    const file = new File([longText], 'long.txt');
    await txtToPdf(file);
    expect(mocks.addPage.mock.calls.length).toBeGreaterThan(1);
  });
});

// ─── Tests: csvToPdf ─────────────────────────────────────────────────────────

describe('csvToPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.save.mockResolvedValue(new Uint8Array([1, 2, 3]));
    mocks.addPage.mockReturnValue({ drawText: vi.fn(), drawRectangle: vi.fn(), drawImage: vi.fn() });
    mocks.embedFont.mockResolvedValue({});
    mocks.papaParse.mockReturnValue({ data: [['Name', 'Age'], ['Alice', '30']], errors: [] });
  });

  it('converts a normal CSV', async () => {
    const { csvToPdf } = await import('./converters');
    const file = new File(['Name,Age\nAlice,30'], 'data.csv', { type: 'text/csv' });
    const result = await csvToPdf(file);
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/pdf');
  });

  it('throws for an empty CSV', async () => {
    mocks.papaParse.mockReturnValueOnce({ data: [], errors: [] });
    const { csvToPdf } = await import('./converters');
    const file = new File([''], 'empty.csv');
    await expect(csvToPdf(file)).rejects.toThrow(/empty/i);
  });

  it('throws when papaparse returns no rows and reports errors', async () => {
    mocks.papaParse.mockReturnValueOnce({ data: [], errors: [{ message: 'bad delimiter' }] });
    const { csvToPdf } = await import('./converters');
    const file = new File([';;;'], 'bad.csv');
    await expect(csvToPdf(file)).rejects.toThrow(/could not be parsed/i);
  });
});

// ─── Tests: htmlToPdf ────────────────────────────────────────────────────────

describe('htmlToPdf', () => {
  let createElement: MockInstance;
  let appendChildSpy: MockInstance;
  let removeChildSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.save.mockResolvedValue(new Uint8Array([1, 2, 3]));
    mocks.addPage.mockReturnValue({ drawImage: vi.fn() });
    mocks.embedPng.mockResolvedValue({ width: 100, height: 200 });
    mocks.html2canvasMock.mockResolvedValue({
      width: 1024, height: 768,
      toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['png'], { type: 'image/png' })),
    });
    createElement = vi.spyOn(document, 'createElement');
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(n => n as Node);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(n => n as Node);
  });

  afterEach(() => {
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('throws for an empty HTML file', async () => {
    const { htmlToPdf } = await import('./converters');
    const file = new File(['   '], 'empty.html', { type: 'text/html' });
    await expect(htmlToPdf(file)).rejects.toThrow(/empty/i);
  });

  it('converts an HTML file to a PDF blob', async () => {
    createElement.mockImplementation((tag: string) => {
      if (tag === 'iframe') {
        const iframe = {
          style: { cssText: '' },
          onload: null as (() => void) | null,
          srcdoc: '',
          contentDocument: { body: document.createElement('div') },
        };
        setTimeout(() => iframe.onload?.(), 0);
        return iframe;
      }
      return originalCreateElement(tag);
    });

    const { htmlToPdf } = await import('./converters');
    const file = new File(['<h1>Hello</h1>'], 'page.html', { type: 'text/html' });
    const result = await htmlToPdf(file);
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/pdf');
  });
});

// ─── Tests: pdfOcr ───────────────────────────────────────────────────────────

describe('pdfOcr', () => {
  let createElement: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.render.mockReturnValue({ promise: Promise.resolve() });
    mocks.getPage.mockResolvedValue({ getViewport: vi.fn().mockReturnValue({ width: 800, height: 600 }), render: mocks.render });
    mocks.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 2, getPage: mocks.getPage }) });
    mocks.recognize.mockResolvedValue({ data: { text: 'hello ocr' } });
    mocks.terminate.mockResolvedValue(undefined);
    mocks.createWorker.mockResolvedValue({ recognize: mocks.recognize, terminate: mocks.terminate });
    createElement = vi.spyOn(document, 'createElement');
  });

  it('throws when PDF cannot be parsed', async () => {
    mocks.getDocument.mockReturnValueOnce({ promise: Promise.reject(new Error('bad pdf')) });
    const { pdfOcr } = await import('./converters');
    const file = new File(['bad'], 'bad.pdf');
    await expect(pdfOcr(file)).rejects.toThrow(/Could not parse/);
  });

  it('extracts text with page headers and terminates worker', async () => {
    createElement.mockImplementation((tag: string) => {
      if (tag === 'canvas') return makeFakeCanvas();
      return originalCreateElement(tag);
    });

    const { pdfOcr } = await import('./converters');
    const file = new File([new Uint8Array([0])], 'scan.pdf');
    const result = await pdfOcr(file);

    expect(result).toContain('=== Page 1 ===');
    expect(result).toContain('=== Page 2 ===');
    expect(result).toContain('hello ocr');
    expect(mocks.terminate).toHaveBeenCalled();
  });

  it('reports per-page progress', async () => {
    createElement.mockImplementation((tag: string) => {
      if (tag === 'canvas') return makeFakeCanvas();
      return originalCreateElement(tag);
    });

    const { pdfOcr } = await import('./converters');
    const file = new File([new Uint8Array([0])], 'scan.pdf');
    const calls: Array<[number, number, number]> = [];
    await pdfOcr(file, (pct, page, total) => calls.push([pct, page, total]));

    expect(calls[0]).toEqual([50, 1, 2]);
    expect(calls[1]).toEqual([100, 2, 2]);
  });

  it('always terminates worker even when a page throws', async () => {
    mocks.recognize.mockRejectedValueOnce(new Error('ocr crash'));
    createElement.mockImplementation((tag: string) => {
      if (tag === 'canvas') return makeFakeCanvas();
      return originalCreateElement(tag);
    });

    const { pdfOcr } = await import('./converters');
    const file = new File([new Uint8Array([0])], 'scan.pdf');
    await expect(pdfOcr(file)).rejects.toThrow('ocr crash');
    expect(mocks.terminate).toHaveBeenCalled();
  });
});

// ─── Tests: flattenPdf ───────────────────────────────────────────────────────

describe('flattenPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.save.mockResolvedValue(new Uint8Array([1, 2, 3]));
    mocks.getForm.mockReturnValue({ flatten: vi.fn() });
  });

  it('returns a PDF blob for a valid file', async () => {
    const { flattenPdf } = await import('./converters');
    const file = new File([new Uint8Array([1, 2, 3])], 'form.pdf', { type: 'application/pdf' });
    const result = await flattenPdf(file);
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/pdf');
    expect(mocks.getForm).toHaveBeenCalled();
  });

  it('succeeds even when flatten() throws (no form fields)', async () => {
    mocks.getForm.mockReturnValueOnce({ flatten: vi.fn().mockImplementation(() => { throw new Error('no form'); }) });
    const { flattenPdf } = await import('./converters');
    const file = new File([new Uint8Array([1])], 'noform.pdf');
    const result = await flattenPdf(file);
    expect(result).toBeInstanceOf(Blob);
  });

  it('throws user-facing error for a corrupt file', async () => {
    const { PDFDocument } = await import('pdf-lib');
    (PDFDocument.load as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('corrupt'));

    const { flattenPdf } = await import('./converters');
    const file = new File([new Uint8Array([0xff])], 'corrupt.pdf');
    await expect(flattenPdf(file)).rejects.toThrow(/corrupted or password-protected/);
  });
});

// ─── Tests: canvas size clamping ─────────────────────────────────────────────

describe('canvas size clamping', () => {
  let createElement: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.save.mockResolvedValue(new Uint8Array([1, 2, 3]));
    mocks.addPage.mockReturnValue({ drawImage: vi.fn() });
    mocks.embedJpg.mockResolvedValue({ width: 100, height: 200 });
    URL.createObjectURL = vi.fn().mockReturnValue('blob:fake');
    URL.revokeObjectURL = vi.fn();
    createElement = vi.spyOn(document, 'createElement');
  });

  it('clamps a 8000×6000 image to ≤ 4096 in each dimension', async () => {
    let capturedCanvas: { width: number; height: number } | null = null;

    createElement.mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const c = makeFakeCanvas({ width: 0, height: 0 });
        capturedCanvas = c;
        return c;
      }
      if (tag === 'img') return makeFakeImg(8000, 6000);
      return originalCreateElement(tag);
    });

    const { imageToPdf } = await import('./converters');
    await imageToPdf([new File(['x'], 'huge.jpg', { type: 'image/jpeg' })]);

    expect(capturedCanvas!.width).toBeLessThanOrEqual(4096);
    expect(capturedCanvas!.height).toBeLessThanOrEqual(4096);
    expect(capturedCanvas!.width * capturedCanvas!.height).toBeLessThanOrEqual(4096 * 4096);
  });
});
