import { useParams, Link } from 'react-router';
import {
  ChevronRight, Shield, Sparkles, Wrench, ArrowRight,
  MessageSquare, Globe, HelpCircle, Zap,
} from 'lucide-react';
import { getToolById } from '../data/tools';
import type { LucideIcon } from 'lucide-react';

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

  if (!tool) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center gap-6 text-center">
        <Sparkles size={40} style={{ color: '#3ECF8E' }} />
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
          Tool not found
        </h1>
        <Link to="/" className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#3ECF8E', color: '#0D1512' }}>
          Back to all tools
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <nav className="flex items-center gap-2 mb-8 text-sm">
        <Link
          to="/"
          className="transition-colors"
          style={{ color: 'rgba(143, 168, 155, 0.55)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#8FA89B')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(143, 168, 155, 0.55)')}
        >
          Tools
        </Link>
        <ChevronRight size={14} style={{ color: 'rgba(143, 168, 155, 0.3)' }} />
        <span style={{ color: 'rgba(143, 168, 155, 0.85)' }}>{tool.name}</span>
      </nav>

      <div className="flex items-start gap-5 mb-10">
        <div
          className="p-3.5 rounded-xl flex-shrink-0"
          style={{ backgroundColor: 'rgba(62, 207, 142, 0.12)', border: '1px solid rgba(62, 207, 142, 0.2)', color: '#3ECF8E' }}
        >
          <ToolIcon name={tool.iconName} size={26} />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              {tool.name}
            </h1>
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(62, 207, 142, 0.12)', color: '#3ECF8E', border: '1px solid rgba(62, 207, 142, 0.25)', fontFamily: "'JetBrains Mono', monospace" }}
            >
              <Sparkles size={10} />
              AI · Gemini Flash
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(143, 168, 155, 0.7)' }}>{tool.description}</p>
        </div>
      </div>

      <div
        className="rounded-2xl"
        style={{ border: '1px solid rgba(62, 207, 142, 0.2)', backgroundColor: 'rgba(62, 207, 142, 0.03)' }}
      >
        <div className="p-12 flex flex-col items-center gap-6 text-center">
          <div
            className="p-5 rounded-2xl"
            style={{ backgroundColor: 'rgba(62, 207, 142, 0.1)', border: '1px solid rgba(62, 207, 142, 0.2)' }}
          >
            <Wrench size={32} style={{ color: '#3ECF8E' }} />
          </div>

          <div className="flex flex-col gap-3 max-w-md">
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
              Coming Soon
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(143, 168, 155, 0.65)' }}>
              This AI feature is currently being set up. The Gemini-powered backend will be available shortly.
              Follow on GitHub to get notified when it goes live.
            </p>
          </div>

          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs"
            style={{ backgroundColor: 'rgba(62, 207, 142, 0.06)', border: '1px solid rgba(62, 207, 142, 0.15)', color: 'rgba(143, 168, 155, 0.55)' }}
          >
            <Shield size={12} style={{ color: '#3ECF8E' }} />
            When live: 3 free actions/day · PDF sent only to Gemini · no file stored
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              to="/"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ backgroundColor: '#3ECF8E', color: '#0D1512' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#2DBA7E'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#3ECF8E'}
            >
              Browse working tools
              <ArrowRight size={14} />
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ border: '1px solid rgba(62, 207, 142, 0.3)', color: '#3ECF8E' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(62, 207, 142, 0.08)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
            >
              Follow on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
