import { Outlet, Link, useLocation } from 'react-router';
import { Shield, GitBranch, Lock, EyeOff, ExternalLink } from 'lucide-react';

export default function Root() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: '#0D1512' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: 'rgba(13, 21, 18, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(62, 207, 142, 0.18)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="p-1.5 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(62, 207, 142, 0.25)', border: '1px solid rgba(62, 207, 142, 0.3)' }}
            >
              <Shield size={18} style={{ color: '#3ECF8E' }} />
            </div>
            <span
              className="font-display font-bold text-lg tracking-tight text-white"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Paper<span style={{ color: '#3ECF8E' }}>Trail</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {isHome ? (
              <a href="#tools" className="text-sm font-medium transition-colors" style={{ color: 'rgba(255,255,255,0.65)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}>
                Tools
              </a>
            ) : (
              <Link to="/" className="text-sm font-medium transition-colors" style={{ color: 'rgba(255,255,255,0.65)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}>
                Tools
              </Link>
            )}
            <a
              href={isHome ? '#why' : '/#why'}
              className="text-sm font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.65)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
            >
              Why PaperTrail
            </a>
            <a
              href="https://github.com/vikkyjakhar/PaperTrail"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.65)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
            >
              <GitBranch size={15} />
              GitHub
            </a>
          </nav>

        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(62, 207, 142, 0.15)', backgroundColor: '#16211C' }}>
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Brand */}
            <div className="flex flex-col gap-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div
                  className="p-1.5 rounded-lg"
                  style={{ backgroundColor: 'rgba(62, 207, 142, 0.2)', border: '1px solid rgba(62, 207, 142, 0.25)' }}
                >
                  <Shield size={16} style={{ color: '#3ECF8E' }} />
                </div>
                <span className="font-display font-bold text-base text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Paper<span style={{ color: '#3ECF8E' }}>Trail</span>
                </span>
              </Link>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(143, 168, 155, 0.7)' }}>
                PDF tools that leave no paper trail. Open source, privacy-first, browser-native.
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(143, 168, 155, 0.45)' }}>
                The GitHub repository will be made public in the coming months. Stay tuned.
              </p>
            </div>

            {/* Trust pillars */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(62, 207, 142, 0.7)', fontFamily: "'JetBrains Mono', monospace" }}>
                Our guarantees
              </p>
              {[
                { icon: Lock, label: 'No accounts. Ever.' },
                { icon: EyeOff, label: 'No tracking or analytics.' },
                { icon: Shield, label: 'No file storage on any server.' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <Icon size={13} style={{ color: '#3ECF8E', flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: 'rgba(143, 168, 155, 0.75)' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* GitHub CTA */}
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(62, 207, 142, 0.7)', fontFamily: "'JetBrains Mono', monospace" }}>
                Open source
              </p>
              <p className="text-sm" style={{ color: 'rgba(143, 168, 155, 0.7)' }}>
                All code will be publicly auditable. No hidden data collection — ever.
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(143, 168, 155, 0.45)' }}>
                The GitHub repository will be made public in the coming months. Stay tuned.
              </p>
              <a
                href="https://github.com/vikkyjakhar/PaperTrail"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold w-fit transition-all"
                style={{ border: '1px solid rgba(62, 207, 142, 0.35)', color: '#3ECF8E', backgroundColor: 'rgba(62, 207, 142, 0.05)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(62, 207, 142, 0.12)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(62, 207, 142, 0.05)')}
              >
                <GitBranch size={15} />
                View on GitHub
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          <div
            className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderTop: '1px solid rgba(62, 207, 142, 0.1)' }}
          >
            <p className="text-xs" style={{ color: 'rgba(143, 168, 155, 0.35)' }}>
              © 2026 PaperTrail · MIT License · Files never leave your device
            </p>
            <p className="text-xs font-mono" style={{ color: 'rgba(143, 168, 155, 0.25)', fontFamily: "'JetBrains Mono', monospace" }}>
              v1.0.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
