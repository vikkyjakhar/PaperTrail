import { Link } from 'react-router';
import {
  Shield, Lock, EyeOff, ArrowRight, ChevronRight,
  Image, FileText, Table, Code, Scan, Layers, MessageSquare,
  Zap, Globe, HelpCircle, Sparkles, FileType, BarChart2,
  Monitor, FileOutput, Files, Minimize2, ShieldCheck, BookOpen,
  GitBranch, Cpu, Wifi, Cloud,
} from 'lucide-react';
import type { Tool } from '../data/tools';
import { getToolsByCategory } from '../data/tools';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Image,
  FileImage: Image,
  FileText,
  Table,
  Code,
  Scan,
  Layers,
  MessageSquare,
  Zap,
  Globe,
  HelpCircle,
  Sparkles,
  FileType,
  BarChart2,
  Monitor,
  FileOutput,
  Files,
  Minimize2,
  ShieldCheck,
  BookOpen,
  Cloud,
};

function ToolIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = iconMap[name] ?? FileText;
  return <Icon size={size} />;
}

const techBadges = [
  { label: 'React', color: '#61DAFB' },
  { label: 'Vite', color: '#BD34FE' },
  { label: 'TypeScript', color: '#3178C6' },
  { label: 'Tailwind CSS', color: '#38BDF8' },
  { label: 'Node.js', color: '#68A063' },
  { label: 'Gemini API', color: '#4285F4' },
];

const whyPoints = [
  { icon: Lock, text: 'Files never leave your device — core tools run 100% in-browser' },
  { icon: EyeOff, text: 'No tracking, no analytics, no cookies' },
  { icon: Shield, text: 'No account required — not now, not ever' },
  { icon: GitBranch, text: 'Open source and publicly auditable on GitHub' },
  { icon: Wifi, text: 'Core tools work fully offline after first load' },
  { icon: Cpu, text: 'AI tools are anonymous and rate-limited — no profile stored' },
];

function CoreToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      to={tool.path}
      className="group flex flex-col gap-4 p-5 rounded-xl transition-all duration-200"
      style={{
        backgroundColor: 'rgba(62, 207, 142, 0.06)',
        border: '1px solid rgba(62, 207, 142, 0.2)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(62, 207, 142, 0.55)';
        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(62, 207, 142, 0.12)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(62, 207, 142, 0.2)';
        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(62, 207, 142, 0.06)';
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="p-2.5 rounded-lg"
          style={{ backgroundColor: 'rgba(62, 207, 142, 0.15)', color: '#3ECF8E' }}
        >
          <ToolIcon name={tool.iconName} size={18} />
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
          style={{
            backgroundColor: 'rgba(62, 207, 142, 0.25)',
            color: '#8FA89B',
            fontFamily: "'JetBrains Mono', monospace",
            border: '1px solid rgba(62, 207, 142, 0.2)',
          }}
        >
          <Shield size={9} />
          Browser
        </span>
      </div>

      <div className="flex flex-col gap-1.5 flex-1">
        <h3 className="font-semibold text-white text-sm leading-snug" style={{ fontFamily: "'Sora', sans-serif" }}>
          {tool.name}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(143, 168, 155, 0.65)' }}>
          {tool.description}
        </p>
      </div>

      <div className="flex items-center gap-1 text-xs font-semibold transition-colors" style={{ color: '#3ECF8E' }}>
        Try now
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function AIToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      to={tool.path}
      className="group flex flex-col gap-4 p-5 rounded-xl transition-all duration-200"
      style={{
        backgroundColor: 'rgba(62, 207, 142, 0.08)',
        border: '1px solid rgba(62, 207, 142, 0.45)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#3ECF8E';
        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(62, 207, 142, 0.16)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(62, 207, 142, 0.45)';
        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(62, 207, 142, 0.08)';
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="p-2.5 rounded-lg"
          style={{ backgroundColor: 'rgba(62, 207, 142, 0.35)', color: '#3ECF8E' }}
        >
          <ToolIcon name={tool.iconName} size={18} />
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
          style={{
            backgroundColor: 'rgba(62, 207, 142, 0.18)',
            color: '#3ECF8E',
            fontFamily: "'JetBrains Mono', monospace",
            border: '1px solid rgba(62, 207, 142, 0.3)',
          }}
        >
          <Sparkles size={9} />
          3 free/day
        </span>
      </div>

      <div className="flex flex-col gap-1.5 flex-1">
        <h3 className="font-semibold text-white text-sm leading-snug" style={{ fontFamily: "'Sora', sans-serif" }}>
          {tool.name}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(143, 168, 155, 0.65)' }}>
          {tool.description}
        </p>
      </div>

      <div className="flex items-center gap-1 text-xs font-semibold transition-colors" style={{ color: '#3ECF8E' }}>
        Try now
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function CloudConvertToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      to={tool.path}
      className="group flex flex-col gap-4 p-5 rounded-xl transition-all duration-200"
      style={{
        backgroundColor: 'rgba(99, 179, 237, 0.06)',
        border: '1px solid rgba(99, 179, 237, 0.2)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99, 179, 237, 0.5)';
        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(99, 179, 237, 0.12)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99, 179, 237, 0.2)';
        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(99, 179, 237, 0.06)';
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="p-2.5 rounded-lg"
          style={{ backgroundColor: 'rgba(99, 179, 237, 0.15)', color: '#63B3ED' }}
        >
          <ToolIcon name={tool.iconName} size={18} />
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
          style={{
            backgroundColor: 'rgba(99, 179, 237, 0.12)',
            color: '#63B3ED',
            fontFamily: "'JetBrains Mono', monospace",
            border: '1px solid rgba(99, 179, 237, 0.25)',
          }}
        >
          <Cloud size={9} />
          CloudConvert
        </span>
      </div>

      <div className="flex flex-col gap-1.5 flex-1">
        <h3 className="font-semibold text-white text-sm leading-snug" style={{ fontFamily: "'Sora', sans-serif" }}>
          {tool.name}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(143, 168, 155, 0.65)' }}>
          {tool.description}
        </p>
      </div>

      <div className="flex items-center gap-1 text-xs font-semibold transition-colors" style={{ color: '#63B3ED' }}>
        Convert now
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  badge,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 mb-10">
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#3ECF8E', fontFamily: "'JetBrains Mono', monospace" }}
        >
          {eyebrow}
        </span>
        {badge}
      </div>
      <h2
        className="text-2xl md:text-3xl font-bold text-white leading-tight"
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        {title}
      </h2>
      <p className="text-sm md:text-base max-w-xl" style={{ color: 'rgba(143, 168, 155, 0.7)' }}>
        {subtitle}
      </p>
    </div>
  );
}

export default function Landing() {
  const coreTools = getToolsByCategory('core');
  const aiTools = getToolsByCategory('ai');
  const cloudconvertTools = getToolsByCategory('cloudconvert');
  const plannedTools = getToolsByCategory('planned');

  return (
    <div>
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0D1512 0%, #0D1512 18%, #3ECF8E 52%, #3ECF8E 80%, #8FA89B 100%)',
          minHeight: '92vh',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(143, 168, 155, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(143, 168, 155, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(62, 207, 142, 0.35) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 pt-28 pb-24 flex flex-col items-center text-center">
          {/* Logo mark */}
          <div
            className="mb-8 p-4 rounded-2xl inline-flex"
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Shield size={36} color="white" />
          </div>

          {/* Headline */}
          <h1
            className="text-5xl md:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6 max-w-4xl"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            PDF tools that leave
            <br />
            <span style={{ color: '#8FA89B' }}>no paper trail.</span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-lg md:text-xl mb-4 max-w-xl leading-relaxed"
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
          >
            No login required. No files stored anywhere.
            Most tools process entirely in your browser.
          </p>

          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
            The GitHub repository will be made public in the coming months. Stay tuned.
          </p>

          {/* Trust micro-row */}
          <div className="flex items-center gap-5 mb-10 flex-wrap justify-center">
            {[
              { icon: Lock, text: 'No accounts' },
              { icon: EyeOff, text: 'No tracking' },
              { icon: Shield, text: 'No file storage' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon size={13} style={{ color: '#8FA89B' }} />
                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>{text}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-4 flex-wrap justify-center mb-16">
            <a
              href="#tools"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold transition-all"
              style={{ backgroundColor: 'white', color: '#0D1512' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#8FA89B')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
            >
              Browse All Tools
              <ChevronRight size={16} />
            </a>
          </div>

          {/* Tech stack pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs mr-1" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>
              built with
            </span>
            {techBadges.map(({ label }) => (
              <span
                key={label}
                className="text-xs font-medium px-3 py-1 rounded-full"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why PaperTrail ── */}
      <section id="why" className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <span
              className="text-xs font-semibold uppercase tracking-widest mb-4 block"
              style={{ color: '#3ECF8E', fontFamily: "'JetBrains Mono', monospace" }}
            >
              Why PaperTrail
            </span>
            <h2
              className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Your documents stay
              <br />
              <span style={{ color: '#3ECF8E' }}>yours. Always.</span>
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'rgba(143, 168, 155, 0.7)' }}>
              Most PDF tools upload your files to a server, log your activity, and profit from your data.
              PaperTrail is different — we built every core tool to run entirely inside your browser,
              with zero server involvement.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {whyPoints.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-start gap-4 p-4 rounded-xl"
                style={{
                  backgroundColor: 'rgba(62, 207, 142, 0.06)',
                  border: '1px solid rgba(62, 207, 142, 0.15)',
                }}
              >
                <div
                  className="p-1.5 rounded-lg flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: 'rgba(62, 207, 142, 0.15)' }}
                >
                  <Icon size={14} style={{ color: '#3ECF8E' }} />
                </div>
                <span className="text-sm leading-relaxed" style={{ color: 'rgba(143, 168, 155, 0.85)' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="max-w-7xl mx-auto px-6">
        <div style={{ borderTop: '1px solid rgba(62, 207, 142, 0.12)' }} />
      </div>

      {/* ── Core Tools ── */}
      <section id="tools" className="max-w-7xl mx-auto px-6 py-20">
        <SectionHeader
          eyebrow="Core Tools"
          title="Client-side. No upload. No server."
          subtitle="Every core tool runs entirely in your browser using WebAssembly and modern browser APIs. Nothing ever touches a server."
          badge={
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: 'rgba(62, 207, 142, 0.12)',
                color: '#3ECF8E',
                border: '1px solid rgba(62, 207, 142, 0.25)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <Shield size={10} />
              Runs in your browser
            </span>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {coreTools.map(tool => (
            <CoreToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* ── AI Tools ── */}
      <section
        className="py-20"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(62, 207, 142, 0.07) 30%, rgba(62, 207, 142, 0.07) 70%, transparent 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            eyebrow="AI Tools"
            title="AI-powered. Anonymous. Rate-limited."
            subtitle="Powered by Gemini Flash. No signup, no profile. Each tool gives you 3 free actions per day — reset at midnight."
            badge={
              <span
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: 'rgba(62, 207, 142, 0.3)',
                  color: '#8FA89B',
                  border: '1px solid rgba(62, 207, 142, 0.5)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <Sparkles size={10} />
                3 free/day · no signup
              </span>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiTools.map(tool => (
              <AIToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Format Conversion ── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <SectionHeader
          eyebrow="Format Conversion"
          title="Convert between any format."
          subtitle="Powered by CloudConvert. Files are sent only for conversion and deleted immediately after download."
          badge={
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: 'rgba(99, 179, 237, 0.1)',
                color: '#63B3ED',
                border: '1px solid rgba(99, 179, 237, 0.25)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <Cloud size={10} />
              CloudConvert
            </span>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cloudconvertTools.map(tool => (
            <CloudConvertToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {plannedTools.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <SectionHeader
            eyebrow="Coming Soon"
            title="More tools on the roadmap."
            subtitle="Follow on GitHub for updates."
            badge={
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: 'rgba(143, 168, 155, 0.07)',
                  color: 'rgba(143, 168, 155, 0.45)',
                  border: '1px solid rgba(143, 168, 155, 0.12)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                In Development
              </span>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {plannedTools.map(tool => (
              <div
                key={tool.id}
                className="flex flex-col gap-4 p-5 rounded-xl"
                style={{ backgroundColor: 'rgba(143, 168, 155, 0.04)', border: '1px solid rgba(143, 168, 155, 0.1)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(143, 168, 155, 0.07)', color: 'rgba(143, 168, 155, 0.35)' }}>
                    <ToolIcon name={tool.iconName} size={18} />
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(143, 168, 155, 0.08)', color: 'rgba(143, 168, 155, 0.45)', fontFamily: "'JetBrains Mono', monospace", border: '1px solid rgba(143, 168, 155, 0.12)' }}>
                    {tool.plannedLabel ?? 'Coming Soon'}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <h3 className="font-semibold text-sm leading-snug" style={{ color: 'rgba(143, 168, 155, 0.45)', fontFamily: "'Sora', sans-serif" }}>{tool.name}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(143, 168, 155, 0.3)' }}>{tool.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
