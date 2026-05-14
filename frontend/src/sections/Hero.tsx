import { useRef, useEffect, useState } from 'react';
import AmberCascades from './AmberCascades';
import LiquidGlassButton from '../components/LiquidGlassButton';
import { heroConfig } from '../config';

export default function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [titleWidth, setTitleWidth] = useState<number>(0);

  useEffect(() => {
    const measure = () => {
      if (titleRef.current) setTitleWidth(titleRef.current.offsetWidth);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  if (!heroConfig.title) {
    return null;
  }

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden"
      style={{ height: '100vh' }}
    >
      <AmberCascades />
      <div
        className="relative z-10 flex flex-col justify-between pointer-events-none"
        style={{
          height: '100%',
          padding: '28vh 5vw 8vh',
        }}
      >
        <div className="flex flex-col items-center text-center">
          {/* Capsule badge */}
          <div
            className="pointer-events-auto mb-6"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 16px',
              borderRadius: 999,
              background: '#D6E4FF',
              border: '1px solid rgba(0, 51, 204, 0.2)',
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              color: '#0033CC',
            }}
          >
            <span>⚡</span>
            <span>运维事业部 · 数智中心</span>
          </div>

          <h1
            ref={titleRef}
            style={{
              fontFamily: "'Inter', 'GeistMono', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(48px, 6vw, 96px)',
              lineHeight: 1.1,
              letterSpacing: '-2px',
              color: '#0033CC',
              marginBottom: 'clamp(16px, 2vw, 24px)',
              width: 'fit-content',
              maxWidth: '100%',
            }}
          >
            {heroConfig.title}
          </h1>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 'clamp(20px, 2.5vw, 36px)',
              lineHeight: 1.3,
              letterSpacing: '-0.5px',
              color: '#2B5CFF',
              margin: '0 0 clamp(16px, 2vw, 24px) 0',
              width: titleWidth || 'auto',
              maxWidth: '100%',
            }}
          >
            {heroConfig.subtitleLine2}
          </p>

          {heroConfig.subtitleLine1 && (
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontSize: 'clamp(14px, 1.3vw, 18px)',
                lineHeight: 1.7,
                color: '#0F1A4D',
                margin: '0 0 clamp(32px, 4vw, 56px) 0',
                width: Math.min(titleWidth * 1.2, 680) || 'auto',
                maxWidth: '90vw',
              }}
            >
              {heroConfig.subtitleLine1}
            </p>
          )}

          {/* Stats row */}
          <div
            className="pointer-events-auto flex flex-wrap justify-center"
            style={{
              gap: 'clamp(32px, 5vw, 72px)',
              marginBottom: 'clamp(32px, 4vw, 48px)',
            }}
          >
            {[
              { value: '50+', label: '专业智能体' },
              { value: '2,000+', label: '累计服务次数' },
              { value: '85%', label: '效率提升' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span
                  style={{
                    fontFamily: "'Fira Code', 'GeistMono', monospace",
                    fontWeight: 600,
                    fontSize: 'clamp(28px, 3vw, 44px)',
                    color: '#0033CC',
                    lineHeight: 1.1,
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: 13,
                    color: '#8C9DBE',
                    marginTop: 4,
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {heroConfig.ctaText && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }} className="pointer-events-auto flex-wrap">
            <LiquidGlassButton
              onClick={() => {
                document.querySelector('#curriculum')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>🚀</span>
              <span style={{ marginLeft: 6 }}>{heroConfig.ctaText}</span>
            </LiquidGlassButton>
            <button
              onClick={() => {
                document.querySelector('#cinematic')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                padding: '16px 40px',
                borderRadius: 999,
                border: '1.5px solid #0033CC',
                background: 'transparent',
                color: '#0033CC',
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 51, 204, 0.05)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              了解更多
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
