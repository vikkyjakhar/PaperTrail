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

  const plannedTools = getToolsByCategory('planned');

  return (
    <div>
      

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
