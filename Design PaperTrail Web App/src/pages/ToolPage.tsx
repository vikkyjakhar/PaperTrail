import { useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import {
  ChevronRight, Upload, Download, Loader2, CheckCircle,
  Shield, Lock, X, FileText, AlertCircle,
  Image, Table, Code, Scan, Layers, Sparkles,
  FileType, BarChart2, Monitor, FileOutput, Files, Minimize2, ShieldCheck, BookOpen,
  Copy, Check, Plus,
} from 'lucide-react';
import { getToolById } from '../data/tools';
import { downloadBlob, downloadText } from '../utils/download';
import {
  imageToPdf,
  pdfToJpg,
  txtToPdf,
  csvToPdf,
  htmlToPdf,
  pdfOcr,
  flattenPdf,
  validateFiles,
} from '../utils/converters';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Image, FileImage: Image, FileText, Table, Code, Scan, Layers,
  Sparkles, FileType, BarChart2, Monitor, FileOutput, Files,
  Minimize2, ShieldCheck, BookOpen,
};

type ProcessState = 'idle' | 'ready' | 'processing' | 'done' | 'error';

type ToolOutput =
  | { kind: 'blob'; blob: Blob; filename: string }
  | { kind: 'text'; text: string; filename: string }
  | null;

const MULTI_FILE_TOOLS = new Set(['image-to-pdf']);

const REAL_TOOLS = new Set([
  'image-to-pdf', 'pdf-to-jpg', 'txt-to-pdf',
  'csv-to-pdf', 'html-to-pdf', 'pdf-ocr', 'flatten-pdf',
]);

function ToolIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = iconMap[name] ?? FileText;
  return <Icon size={size} />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getOutputFilename(toolId: string, inputName: string): string {
  const base = inputName.replace(/\.[^.]+$/, '');
  switch (toolId) {
    case 'image-to-pdf': return `${base}.pdf`;
    case 'pdf-to-jpg': return `${base}-pages.zip`;
    case 'txt-to-pdf': return `${base}.pdf`;
    case 'csv-to-pdf': return `${base}.pdf`;
    case 'html-to-pdf': return `${base}.pdf`;
    case 'pdf-ocr': return `${base}-extracted.txt`;
    case 'flatten-pdf': return `${base}-flat.pdf`;
    default: return 'papertrail-output';
  }
}

async function runConverter(
  toolId: string,
  files: File[],
  onProgress: (pct: number) => void,
  onPageProgress: (pct: number, page: number, total: number) => void,
): Promise<ToolOutput> {
  const file = files[0];
  const filename = getOutputFilename(toolId, file.name);

  switch (toolId) {
    case 'image-to-pdf':
      return { kind: 'blob', blob: await imageToPdf(files, onProgress), filename: files.length > 1 ? 'combined.pdf' : filename };
    case 'pdf-to-jpg':
      return { kind: 'blob', blob: await pdfToJpg(file, onPageProgress), filename };
    case 'txt-to-pdf':
      return { kind: 'blob', blob: await txtToPdf(file), filename };
    case 'csv-to-pdf':
      return { kind: 'blob', blob: await csvToPdf(file), filename };
    case 'html-to-pdf':
      return { kind: 'blob', blob: await htmlToPdf(file), filename };
    case 'pdf-ocr':
      return { kind: 'text', text: await pdfOcr(file, onPageProgress), filename };
    case 'flatten-pdf':
      return { kind: 'blob', blob: await flattenPdf(file), filename };
    default:
      throw new Error(`No converter implemented for "${toolId}"`);
  }
}

// ─── OCR text output ──────────────────────────────────────────────────────────

function OcrResult({ text, filename }: { text: string; filename: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-semibold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>Extracted Text</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ border: '1px solid rgba(62,207,142,0.3)', color: '#3ECF8E' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(62,207,142,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={() => downloadText(text, filename)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ backgroundColor: '#3ECF8E', color: '#0D1512' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2DBA7E')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#3ECF8E')}
          >
            <Download size={12} />
            Download .txt
          </button>
        </div>
      </div>
      <pre
        className="text-xs leading-relaxed whitespace-pre-wrap overflow-y-auto p-4 rounded-xl max-h-72"
        style={{
          backgroundColor: 'rgba(62,207,142,0.04)',
          border: '1px solid rgba(62,207,142,0.15)',
          color: 'rgba(255,255,255,0.85)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {text || '(no text extracted)'}
      </pre>
    </div>
  );
}

// ─── Multi-file list (image-to-pdf) ──────────────────────────────────────────

function FileList({
  files,
  onRemove,
  onAddMore,
}: {
  files: File[];
  onRemove: (i: number) => void;
  onAddMore: () => void;
}) {
  const totalBytes = files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(62,207,142,0.6)', fontFamily: "'JetBrains Mono', monospace" }}>
          {files.length} image{files.length !== 1 ? 's' : ''} selected · {formatBytes(totalBytes)} total
        </p>
        <button
          onClick={onAddMore}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ border: '1px solid rgba(62,207,142,0.3)', color: '#3ECF8E' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(62,207,142,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Plus size={11} />
          Add more
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
        {files.map((f, i) => (
          <div
            key={`${f.name}-${i}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ backgroundColor: 'rgba(62,207,142,0.06)', border: '1px solid rgba(62,207,142,0.15)' }}
          >
            <div
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ backgroundColor: 'rgba(62,207,142,0.15)', color: '#3ECF8E', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {i + 1}
            </div>
            <Image size={14} style={{ color: '#3ECF8E', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate leading-tight">{f.name}</p>
              <p className="text-xs" style={{ color: 'rgba(143,168,155,0.5)', fontFamily: "'JetBrains Mono', monospace" }}>
                {formatBytes(f.size)}
              </p>
            </div>
            <button
              onClick={() => onRemove(i)}
              className="p-1 rounded transition-colors flex-shrink-0"
              style={{ color: 'rgba(143,168,155,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(143,168,155,0.3)')}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ToolPage() {
  const { toolId } = useParams<{ toolId: string }>();
  const tool = getToolById(toolId ?? '');

  const isMulti = MULTI_FILE_TOOLS.has(toolId ?? '');
  const isReal = REAL_TOOLS.has(toolId ?? '');

  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<ProcessState>('idle');
  const [progress, setProgress] = useState(0);
  const [pageLabel, setPageLabel] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [output, setOutput] = useState<ToolOutput>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = useCallback((incoming: File[]) => {
    if (isMulti) {
      setFiles(prev => {
        const existing = new Set(prev.map(f => f.name + f.size));
        const fresh = incoming.filter(f => !existing.has(f.name + f.size));
        return [...prev, ...fresh];
      });
    } else {
      setFiles([incoming[0]]);
    }
    setState('ready');
    setOutput(null);
    setErrorMsg('');
  }, [isMulti]);

  const removeFile = useCallback((idx: number) => {
    setFiles(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0) setState('idle');
      return next;
    });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length) addFiles(dropped);
    },
    [addFiles],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length) addFiles(picked);
    // reset input so same files can be re-added after removal
    e.target.value = '';
  };

  const handleProcess = async () => {
    if (!files.length || !toolId) return;

    const validationError = validateFiles(toolId, files);
    if (validationError) { setErrorMsg(validationError); setState('error'); return; }

    setState('processing');
    setProgress(0);
    setPageLabel('');
    setErrorMsg('');

    const hasStepProgress = ['pdf-to-jpg', 'pdf-ocr', 'image-to-pdf'].includes(toolId);

    let fakeTimer: ReturnType<typeof setInterval> | null = null;
    if (isReal && !hasStepProgress) {
      let fake = 0;
      fakeTimer = setInterval(() => {
        fake = Math.min(fake + Math.random() * 14, 88);
        setProgress(Math.round(fake));
      }, 280);
    }

    if (!isReal) {
      const steps = [8, 22, 41, 58, 74, 88, 97, 100];
      let i = 0;
      const tick = () => {
        if (i < steps.length) { setProgress(steps[i++]); setTimeout(tick, 220 + Math.random() * 160); }
        else { setState('done'); setOutput(null); }
      };
      setTimeout(tick, 120);
      return;
    }

    try {
      const result = await runConverter(
        toolId,
        files,
        pct => setProgress(pct),
        (pct, page, total) => { setProgress(pct); setPageLabel(`Page ${page} of ${total}`); },
      );
      if (fakeTimer) clearInterval(fakeTimer);
      setProgress(100);
      setPageLabel('');
      setOutput(result);
      setState('done');
    } catch (err) {
      if (fakeTimer) clearInterval(fakeTimer);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : String(err) || 'Processing failed — check the browser console for details.',
      );
      setState('error');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setState('idle');
    setProgress(0);
    setPageLabel('');
    setOutput(null);
    setErrorMsg('');
  };

  if (!tool) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center gap-6 text-center">
        <AlertCircle size={40} style={{ color: '#3ECF8E' }} />
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>Tool not found</h1>
        <Link to="/" className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#3ECF8E', color: '#0D1512' }}>
          Back to all tools
        </Link>
      </div>
    );
  }

  const hasFiles = files.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-8 text-sm">
        <Link to="/" className="transition-colors" style={{ color: 'rgba(143,168,155,0.55)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#8FA89B')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(143,168,155,0.55)')}>
          Tools
        </Link>
        <ChevronRight size={14} style={{ color: 'rgba(143,168,155,0.3)' }} />
        <span style={{ color: 'rgba(143,168,155,0.85)' }}>{tool.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="p-3.5 rounded-xl flex-shrink-0" style={{ backgroundColor: 'rgba(62,207,142,0.12)', border: '1px solid rgba(62,207,142,0.2)', color: '#3ECF8E' }}>
          <ToolIcon name={tool.iconName} size={26} />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              {tool.name}
            </h1>
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(62,207,142,0.12)', color: '#3ECF8E', border: '1px solid rgba(62,207,142,0.25)', fontFamily: "'JetBrains Mono', monospace" }}
            >
              <Shield size={10} />
              {isReal ? 'Runs in your browser' : 'Coming soon'}
            </span>
            {isMulti && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(62,207,142,0.08)', color: '#8FA89B', border: '1px solid rgba(62,207,142,0.15)', fontFamily: "'JetBrains Mono', monospace" }}
              >
                Multi-file supported
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(143,168,155,0.7)' }}>{tool.description}</p>
          {tool.acceptedFormats && (
            <p className="text-xs" style={{ color: 'rgba(143,168,155,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>
              Accepts: {tool.acceptedFormats}
            </p>
          )}
        </div>
      </div>

      {/* Error banner */}
      {state === 'error' && (
        <div className="mb-5 flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
          <div className="flex flex-col gap-0.5 flex-1">
            <p className="text-sm font-semibold" style={{ color: '#EF4444' }}>Processing failed</p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(239,68,68,0.8)' }}>{errorMsg}</p>
          </div>
          <button onClick={() => { setErrorMsg(''); setState('ready'); }} className="p-1 flex-shrink-0" style={{ color: 'rgba(239,68,68,0.5)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.5)')}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main card */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(62,207,142,0.2)', backgroundColor: 'rgba(62,207,142,0.05)' }}>

        {/* Drop zone / file list — shown during idle, ready, error */}
        {(state === 'idle' || state === 'ready' || state === 'error') && (
          <div className="p-6 flex flex-col gap-4">

            {/* Hidden file input */}
            <input
              ref={inputRef}
              type="file"
              multiple={isMulti}
              className="hidden"
              aria-label={`Upload file for ${tool.name}`}
              onChange={onFileChange}
            />

            {/* Drop area — always shown so user can add more */}
            <div
              role="button"
              tabIndex={0}
              aria-label={isMulti ? 'Drop images here or press Enter to browse' : 'Drop file here or press Enter to browse'}
              className="cursor-pointer transition-all"
              style={{
                padding: hasFiles ? '20px 24px' : '48px 32px',
                border: dragOver ? '2px dashed #3ECF8E' : '2px dashed rgba(62,207,142,0.25)',
                borderRadius: '14px',
                backgroundColor: dragOver ? 'rgba(62,207,142,0.1)' : 'transparent',
              }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
            >
              {hasFiles && isMulti ? (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(62,207,142,0.12)', color: '#3ECF8E' }}>
                    <Upload size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Drop more images here</p>
                    <p className="text-xs" style={{ color: 'rgba(143,168,155,0.5)' }}>or click to browse · they will be added to the list</p>
                  </div>
                </div>
              ) : !hasFiles ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-5 rounded-2xl" style={{ backgroundColor: dragOver ? 'rgba(62,207,142,0.25)' : 'rgba(62,207,142,0.1)', color: '#3ECF8E' }}>
                    <Upload size={32} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-base font-semibold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {dragOver
                        ? 'Drop your file(s) here'
                        : isMulti
                        ? 'Drag & drop images here — select as many as you want'
                        : 'Drag & drop your file here'}
                    </p>
                    <p className="text-sm" style={{ color: 'rgba(143,168,155,0.55)' }}>
                      or{' '}
                      <button
                        onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                        className="underline"
                        style={{ color: '#3ECF8E' }}
                      >
                        click to browse
                      </button>
                      {isMulti && <span style={{ color: 'rgba(143,168,155,0.55)' }}> · multiple selection enabled</span>}
                    </p>
                    {tool.acceptedFormats && (
                      <p className="text-xs mt-1" style={{ color: 'rgba(143,168,155,0.35)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {tool.acceptedFormats}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* single-file selected state */
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl flex-shrink-0" style={{ backgroundColor: 'rgba(62,207,142,0.15)', color: '#3ECF8E' }}>
                    <FileText size={22} />
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{files[0].name}</p>
                    <p className="text-xs" style={{ color: 'rgba(143,168,155,0.5)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatBytes(files[0].size)}
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleReset(); }}
                    className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                    style={{ color: 'rgba(143,168,155,0.4)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#3ECF8E')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(143,168,155,0.4)')}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Multi-file list */}
            {isMulti && hasFiles && (
              <FileList
                files={files}
                onRemove={removeFile}
                onAddMore={() => inputRef.current?.click()}
              />
            )}
          </div>
        )}

        {/* Processing */}
        {state === 'processing' && (
          <div className="p-10 flex flex-col items-center gap-6 text-center">
            <Loader2 size={40} style={{ color: '#3ECF8E' }} className="animate-spin" />
            <div className="flex flex-col gap-2 max-w-sm">
              <p className="text-base font-semibold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                {toolId === 'pdf-ocr'
                  ? 'Running OCR on each page...'
                  : toolId === 'image-to-pdf' && files.length > 1
                  ? `Combining ${files.length} images into one PDF...`
                  : 'Converting your file...'}
              </p>
              <p className="text-sm" style={{ color: 'rgba(143,168,155,0.6)' }}>
                All computation happens right here in your browser.
              </p>
            </div>
            <div className="w-full max-w-sm">
              <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(143,168,155,0.5)', fontFamily: "'JetBrains Mono', monospace" }}>
                <span>
                  {pageLabel
                    ? pageLabel
                    : toolId === 'image-to-pdf' && files.length > 1
                    ? `Image ${Math.max(1, Math.ceil((progress / 100) * files.length))} of ${files.length}`
                    : 'Processing'}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(62,207,142,0.15)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: '#3ECF8E' }} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(143,168,155,0.4)' }}>
              <Lock size={11} style={{ color: '#3ECF8E' }} />
              Processing locally — nothing leaves your device
            </div>
          </div>
        )}

        {/* Done */}
        {state === 'done' && (
          <div className="p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full" style={{ backgroundColor: 'rgba(62,207,142,0.12)' }}>
                <CheckCircle size={24} style={{ color: '#3ECF8E' }} />
              </div>
              <div>
                <p className="text-base font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {output?.kind === 'text' ? 'Text extracted!' : 'Conversion complete!'}
                </p>
                <p className="text-xs" style={{ color: 'rgba(143,168,155,0.5)' }}>
                  {output?.kind === 'blob'
                    ? `${output.filename} · ${formatBytes(output.blob.size)}`
                    : output?.kind === 'text'
                    ? `${output.text.length.toLocaleString()} characters extracted`
                    : 'Processing completed successfully.'}
                </p>
              </div>
            </div>

            {output?.kind === 'text' ? (
              <OcrResult text={output.text} filename={output.filename} />
            ) : output?.kind === 'blob' ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto justify-center"
                  style={{ backgroundColor: '#3ECF8E', color: '#0D1512' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2DBA7E')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#3ECF8E')}
                  onClick={() => downloadBlob(output.blob, output.filename)}
                >
                  <Download size={15} />
                  Download {output.filename.split('.').pop()?.toUpperCase()}
                </button>
                <button
                  className="px-5 py-3 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto"
                  style={{ color: '#3ECF8E', border: '1px solid rgba(62,207,142,0.3)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(62,207,142,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={handleReset}
                >
                  Convert another
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold w-full sm:w-auto justify-center"
                  style={{ backgroundColor: '#3ECF8E', color: '#0D1512' }}
                  onClick={() => { const a = document.createElement('a'); a.href = '#'; a.download = 'papertrail-output.pdf'; a.click(); }}
                >
                  <Download size={15} />
                  Download Result
                </button>
                <button
                  className="px-5 py-3 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto"
                  style={{ color: '#3ECF8E', border: '1px solid rgba(62,207,142,0.3)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(62,207,142,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={handleReset}
                >
                  Process another
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(143,168,155,0.35)' }}>
              <Shield size={11} style={{ color: '#3ECF8E' }} />
              No files stored · No upload · No tracking
            </div>
          </div>
        )}

        {/* Action footer — ready or error with files present */}
        {(state === 'ready' || state === 'error') && hasFiles && (
          <div
            className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap"
            style={{ borderTop: '1px solid rgba(62,207,142,0.12)', backgroundColor: '#16211C' }}
          >
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(143,168,155,0.45)' }}>
              <Lock size={11} style={{ color: '#3ECF8E' }} />
              {isReal
                ? isMulti
                  ? `${files.length} file${files.length !== 1 ? 's' : ''} queued · nothing leaves your device`
                  : 'Processes locally — nothing leaves your device'
                : 'Demo mode — real conversion coming soon'}
            </div>
            <div className="flex items-center gap-2">
              {isMulti && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ color: 'rgba(143,168,155,0.5)', border: '1px solid rgba(62,207,142,0.15)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#3ECF8E')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(143,168,155,0.5)')}
                >
                  Clear all
                </button>
              )}
              <button
                onClick={handleProcess}
                className="flex items-center gap-2 px-7 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{ backgroundColor: '#3ECF8E', color: '#0D1512' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2DBA7E')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#3ECF8E')}
              >
                {state === 'error' ? 'Retry' : isMulti && files.length > 1 ? `Combine ${files.length} Images → PDF` : 'Convert File'}
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info cards — idle only */}
      {state === 'idle' && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: Shield,
              label: isReal ? 'Browser-native' : 'Client-side',
              desc: isReal ? 'Powered by pdf-lib — runs entirely in your browser.' : 'Runs locally in your browser tab.',
            },
            {
              icon: Lock,
              label: 'Zero upload',
              desc: isMulti ? 'All images stay on your device — never uploaded.' : 'Your file never leaves your device.',
            },
            {
              icon: CheckCircle,
              label: 'No account',
              desc: 'Use it now, no sign-in ever required.',
            },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex flex-col gap-2 p-4 rounded-xl" style={{ backgroundColor: 'rgba(62,207,142,0.05)', border: '1px solid rgba(62,207,142,0.12)' }}>
              <Icon size={16} style={{ color: '#3ECF8E' }} />
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(143,168,155,0.55)' }}>{desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
