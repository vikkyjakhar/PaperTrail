import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router';
import {
  ChevronRight, Sparkles, Zap, Globe, HelpCircle, MessageSquare,
  UploadCloud, Loader2, Key, Send, FileText,
} from 'lucide-react';
import { getToolById } from '../data/tools';
import type { LucideIcon } from 'lucide-react';
import { chatWithGemini, extractTextFromPdf } from '../lib/aiUtils';

const iconMap: Record<string, LucideIcon> = {
  Sparkles, Zap, Globe, HelpCircle, MessageSquare,
};

function ToolIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = iconMap[name] ?? Sparkles;
  return <Icon size={size} />;
}

export default function AIToolPage() {
  const { toolId } = useParams<{ toolId: string }>();
  const tool = getToolById(toolId ?? '');

  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('gemini_api_key') ||
      'AQ.Ab8RN6Jv8Jh4Tengdg7ug5Z2EC8x_PzmRFt0r8g_7aVoNi737g',
  );
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [pdfText, setPdfText] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!tool) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center gap-6 text-center">
        <Sparkles size={40} style={{ color: '#3ECF8E' }} />
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
          Tool not found
        </h1>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: '#3ECF8E', color: '#0D1512' }}
        >
          Back to all tools
        </Link>
      </div>
    );
  }

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setIsEditingKey(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfName(file.name);
      setLoading(true);
      try {
        const text = await extractTextFromPdf(file);
        setPdfText(text);
        setMessages([
          { role: 'ai', text: `I've successfully read "${file.name}". How can I help you with it?` },
        ]);
      } catch {
        setMessages([
          { role: 'ai', text: 'Failed to read the PDF. Please try a valid text-based PDF.' },
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey) return;

    // Rate limit check
    const today = new Date().toISOString().split('T')[0];
    let usage = JSON.parse(localStorage.getItem('ai_usage') || '{"date":"","count":0}');
    
    if (usage.date !== today) {
      usage = { date: today, count: 0 };
    }

    if (usage.count >= 3) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', text: input },
        { role: 'ai', text: 'You have reached your limit of 3 free AI requests for today. Please come back tomorrow!' },
      ]);
      setInput('');
      return;
    }

    usage.count += 1;
    localStorage.setItem('ai_usage', JSON.stringify(usage));

    const userMessage = input;
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const aiResponse = await chatWithGemini(userMessage, apiKey, pdfText);
      setMessages((prev) => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: `Error: ${err.message || 'Something went wrong.'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Breadcrumb + API key button */}
      <nav className="flex items-center justify-between mb-8 text-sm">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="transition-colors"
            style={{ color: 'rgba(143, 168, 155, 0.55)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#8FA89B')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(143, 168, 155, 0.55)')}
          >
            Tools
          </Link>
          <ChevronRight size={14} style={{ color: 'rgba(143, 168, 155, 0.3)' }} />
          <span style={{ color: 'rgba(143, 168, 155, 0.85)' }}>{tool.name}</span>
        </div>
        <button
          onClick={() => setIsEditingKey(!isEditingKey)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
          style={{
            backgroundColor: 'rgba(62, 207, 142, 0.08)',
            color: '#3ECF8E',
            border: '1px solid rgba(62, 207, 142, 0.25)',
          }}
        >
          <Key size={12} />
          {apiKey ? 'API Key Saved' : 'Set API Key'}
        </button>
      </nav>

      {/* API key editor */}
      {isEditingKey && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center gap-4 shadow-lg"
          style={{ backgroundColor: '#16211C', border: '1px solid #3ECF8E' }}
        >
          <Key className="w-5 h-5" style={{ color: '#3ECF8E' }} />
          <input
            type="password"
            placeholder="Paste your Gemini API Key here..."
            className="flex-1 bg-transparent border-none text-white focus:outline-none text-sm"
            style={{ color: '#fff' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveApiKey(e.currentTarget.value);
            }}
            onBlur={(e) => {
              if (e.currentTarget.value) saveApiKey(e.currentTarget.value);
            }}
          />
          <span className="text-xs" style={{ color: '#8FA89B' }}>
            Save (Enter)
          </span>
        </div>
      )}

      {/* Tool header */}
      <div className="flex items-start gap-5 mb-8 flex-shrink-0">
        <div
          className="p-3.5 rounded-xl flex-shrink-0"
          style={{
            backgroundColor: 'rgba(62, 207, 142, 0.12)',
            border: '1px solid rgba(62, 207, 142, 0.2)',
            color: '#3ECF8E',
          }}
        >
          <ToolIcon name={tool.iconName} size={26} />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1
              className="text-2xl md:text-3xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {tool.name}
            </h1>
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: 'rgba(62, 207, 142, 0.12)',
                color: '#3ECF8E',
                border: '1px solid rgba(62, 207, 142, 0.25)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <Sparkles size={10} />
              AI · Gemini Flash
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(143, 168, 155, 0.7)' }}>
            {tool.description}
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div
        className="rounded-2xl flex-1 flex flex-col overflow-hidden shadow-lg"
        style={{ border: '1px solid rgba(62, 207, 142, 0.2)', backgroundColor: '#16211C' }}
      >
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {/* Upload prompt */}
          {!pdfText && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <UploadCloud size={40} style={{ color: '#3ECF8E' }} />
              <p className="text-sm" style={{ color: '#8FA89B' }}>
                Upload a PDF to get started.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 text-sm font-semibold rounded-lg transition-all"
                style={{ backgroundColor: '#3ECF8E', color: '#0D1512' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#2DBA7E')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#3ECF8E')}
              >
                Browse PDF File
              </button>
            </div>
          )}

          {/* Messages */}
          {pdfText &&
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
                  }`}
                  style={
                    m.role === 'user'
                      ? { backgroundColor: '#3ECF8E', color: '#0D1512' }
                      : {
                          backgroundColor: 'rgba(62, 207, 142, 0.1)',
                          border: '1px solid rgba(62, 207, 142, 0.2)',
                          color: '#fff',
                        }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}

          {/* Loading */}
          {loading && (
            <div className="flex justify-start">
              <div
                className="rounded-2xl p-4 rounded-tl-sm flex items-center gap-2 text-sm"
                style={{
                  backgroundColor: 'rgba(62, 207, 142, 0.1)',
                  border: '1px solid rgba(62, 207, 142, 0.2)',
                  color: '#8FA89B',
                }}
              >
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div
          className="p-4 relative"
          style={{ backgroundColor: '#0D1512', borderTop: '1px solid rgba(62, 207, 142, 0.2)' }}
        >
          {pdfName && (
            <div
              className="absolute -top-7 left-4 text-xs px-3 py-1 rounded-t-lg flex items-center gap-1.5"
              style={{
                color: 'rgba(143, 168, 155, 0.8)',
                backgroundColor: '#16211C',
                border: '1px solid rgba(62, 207, 142, 0.2)',
                borderBottom: 'none',
              }}
            >
              <FileText size={10} />
              {pdfName}
            </div>
          )}
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                apiKey
                  ? tool.aiPromptPlaceholder || 'Ask anything about your PDF…'
                  : 'Set API Key to continue'
              }
              disabled={!apiKey || !pdfText || loading}
              className="w-full rounded-xl py-3 pl-4 pr-12 text-white text-sm transition-all disabled:opacity-50 focus:outline-none"
              style={{
                backgroundColor: '#16211C',
                border: '1px solid rgba(62, 207, 142, 0.3)',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || !apiKey || !pdfText || loading}
              className="absolute right-2 p-2 rounded-lg transition-colors disabled:opacity-30"
              style={{ backgroundColor: '#3ECF8E', color: '#0D1512' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
