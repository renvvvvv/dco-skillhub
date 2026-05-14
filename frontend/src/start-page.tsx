// 新首页 - 整合升级后的设计
import { useEffect, useRef, useState } from 'react';
import AmberCascades from './sections/AmberCascades';
import LiquidGlassButton from './components/LiquidGlassButton';
import { heroConfig, siteConfig, navigationConfig, capabilitiesConfig, architectureConfig, researchConfig, footerConfig } from './config';
import gsap from 'gsap';

// Navigation 组件
function Navigation({ onEnter }: { onEnter: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-all duration-500"
      style={{
        height: 72,
        padding: '0 5vw',
        backgroundColor: scrolled ? 'rgba(248, 250, 255, 0.95)' : 'rgba(248, 250, 255, 0.7)',
        backdropFilter: scrolled ? 'blur(12px)' : 'blur(8px)',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'blur(8px)',
        borderBottom: scrolled ? '1px solid #D6E4FF' : '1px solid transparent',
      }}
    >
      <a
        href="#hero"
        onClick={(e) => handleClick(e, '#hero')}
        className="no-underline flex items-center"
        style={{ gap: 10 }}
      >
        <div className="text-xl font-bold" style={{ color: '#0033CC' }}>
          {siteConfig.brandName}
        </div>
      </a>

      <div className="hidden md:flex items-center" style={{ gap: 32 }}>
        {navigationConfig.links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={(e) => handleClick(e, link.href)}
            className="nav-link"
            style={{
              color: '#0F1A4D',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: 14,
              letterSpacing: '0.3px',
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {navigationConfig.ctaText && (
        <button
          onClick={onEnter}
          className="nav-cta hidden md:inline-flex"
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            background: '#0033CC',
            color: '#fff',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: 13,
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2B5CFF';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#0033CC';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {navigationConfig.ctaText}
        </button>
      )}
    </nav>
  );
}

// Hero 组件
function Hero({ onEnter }: { onEnter: () => void }) {
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
              onClick={onEnter}
            >
              <span>🚀</span>
              <span style={{ marginLeft: 6 }}>{heroConfig.ctaText}</span>
            </LiquidGlassButton>
            <button
              onClick={() => {
                document.querySelector('#curriculum')?.scrollIntoView({ behavior: 'smooth' });
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

// Curriculum 组件
function Curriculum() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items = itemRefs.current.filter(Boolean) as HTMLDivElement[];
    const observers: IntersectionObserver[] = [];

    items.forEach((item) => {
      gsap.set(item, { opacity: 0, y: 50, scale: 0.96 });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const idx = items.indexOf(entry.target as HTMLDivElement);
              const col = idx % 2;
              const row = Math.floor(idx / 2);
              gsap.to(item, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.9,
                delay: col * 0.15 + row * 0.12,
                ease: 'power3.out',
              });
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );

      observer.observe(item);
      observers.push(observer);
    });

    // Header fade-in
    if (headerRef.current) {
      gsap.set(headerRef.current.children, { opacity: 0, y: 20 });
      const headerObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              gsap.to((entry.target as HTMLElement).children, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
              });
              headerObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      headerObserver.observe(headerRef.current);
    }

    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, []);

  return (
    <section
      id="curriculum"
      ref={sectionRef}
      style={{
        padding: '120px 5vw',
        background: '#F8FAFF',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div ref={headerRef} className="text-center mb-16">
          <div
            className="mb-4"
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 999,
              background: '#D6E4FF',
              border: '1px solid rgba(0, 51, 204, 0.2)',
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              color: '#0033CC',
            }}
          >
            {capabilitiesConfig.sectionLabel}
          </div>
          <h2
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(28px, 3.5vw, 48px)',
              lineHeight: 1.2,
              letterSpacing: '-1px',
              color: '#0F1A4D',
              margin: '0 0 16px 0',
            }}
          >
            运维智能体矩阵
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 16,
              lineHeight: 1.7,
              color: '#8C9DBE',
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            覆盖全栈运维场景，从故障诊断到容量规划，每个智能体都是资深专家的数字化分身
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capabilitiesConfig.items.map((item, index) => (
            <div
              key={item.slug}
              ref={(el) => { itemRefs.current[index] = el; }}
              className="group cursor-pointer"
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E8EEF7',
                padding: 32,
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0033CC';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 51, 204, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E8EEF7';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                  style={{
                    background: 'linear-gradient(135deg, #0033CC 0%, #2B5CFF 100%)',
                    color: '#FFFFFF',
                  }}
                >
                  {['🔧', '📊', '🔒', '⚙️'][index]}
                </div>
                <div className="flex-1">
                  <h3
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      fontSize: 18,
                      color: '#0F1A4D',
                      marginBottom: 8,
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: '#8C9DBE',
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// AlumniArchives 组件
function AlumniArchives() {
  const gridRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items = itemRefs.current.filter(Boolean) as HTMLDivElement[];

    items.forEach((item) => {
      gsap.set(item, { opacity: 0, y: 40, scale: 0.97 });
    });

    // Header animation
    if (headerRef.current) {
      gsap.set(headerRef.current.children, { opacity: 0, y: 20 });
      const headerObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              gsap.to((entry.target as HTMLElement).children, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
              });
              headerObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      headerObserver.observe(headerRef.current);
    }

    // Card staggered fade-in: 3 columns
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = items.indexOf(entry.target as HTMLDivElement);
            const col = idx % 3;
            const row = Math.floor(idx / 3);
            gsap.to(entry.target, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              delay: col * 0.1 + row * 0.08,
              ease: 'power3.out',
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="alumni"
      style={{
        padding: '120px 5vw',
        background: '#FFFFFF',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div ref={headerRef} className="text-center mb-16">
          <div
            className="mb-4"
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 999,
              background: '#D6E4FF',
              border: '1px solid rgba(0, 51, 204, 0.2)',
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              color: '#0033CC',
            }}
          >
            {researchConfig.sectionLabel}
          </div>
          <h2
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(28px, 3.5vw, 48px)',
              lineHeight: 1.2,
              letterSpacing: '-1px',
              color: '#0F1A4D',
              margin: '0 0 16px 0',
            }}
          >
            运维智能体矩阵
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 16,
              lineHeight: 1.7,
              color: '#8C9DBE',
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            覆盖全栈运维场景的智能体生态
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {researchConfig.projects.map((project, index) => (
            <div
              key={project.title}
              ref={(el) => { itemRefs.current[index] = el; }}
              className="group"
              style={{
                background: '#F8FAFF',
                borderRadius: 16,
                border: '1px solid #E8EEF7',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0033CC';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 51, 204, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E8EEF7';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                className="h-48 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #0033CC 0%, #2B5CFF 50%, #66A3FF 100%)',
                }}
              >
                <span className="text-4xl">{['🔧', '📊', '🔒', '⚙️', '🚨', '📚', '🐳', '🗄️', '💾'][index]}</span>
              </div>
              <div style={{ padding: 24 }}>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#66A3FF',
                    marginBottom: 8,
                  }}
                >
                  {project.year}
                </div>
                <h3
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    fontSize: 18,
                    color: '#0F1A4D',
                    marginBottom: 8,
                  }}
                >
                  {project.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: '#8C9DBE',
                  }}
                >
                  {project.discipline}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CinematicVision 组件
function CinematicVision() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const text = titleRef.current;
    if (!text) return;

    gsap.set(text, { opacity: 0, y: 30 });
    if (descRef.current) gsap.set(descRef.current, { opacity: 0, y: 20 });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(text, {
              opacity: 1,
              y: 0,
              duration: 1.0,
              ease: 'power3.out',
            });
            if (descRef.current) {
              gsap.to(descRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                delay: 0.2,
                ease: 'power3.out',
              });
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(text);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="cinematic"
      ref={sectionRef}
      style={{
        padding: '120px 5vw',
        background: '#0F1A4D',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Section label */}
        {architectureConfig.sectionLabel && (
          <div
            className="mb-6 text-center"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: '#66A3FF',
              opacity: 0.8,
            }}
          >
            {architectureConfig.sectionLabel}
          </div>
        )}
        <div
          className="mb-14"
          style={{
            width: '100%',
            height: 1,
            background: 'rgba(102, 163, 255, 0.2)',
          }}
        />

        {/* Text: centered single column */}
        <div className="text-center">
          {architectureConfig.title && (
            <h2
              ref={titleRef}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(24px, 3vw, 40px)',
                lineHeight: 1.3,
                letterSpacing: '-0.5px',
                color: '#FFFFFF',
                margin: '0 auto 20px',
                maxWidth: 700,
                textWrap: 'balance',
              }}
            >
              每一次使用都在积累，每一个智能体都在进化
            </h2>
          )}
          {architectureConfig.description && (
            <p
              ref={descRef}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontSize: 15,
                lineHeight: 1.8,
                color: '#8C9DBE',
                margin: '0 auto',
                maxWidth: 600,
                textWrap: 'pretty',
              }}
            >
              运维技术结晶，高复用价值。专家经验数字化沉淀，基于使用反馈和数据积累，智能体越用越聪明，知识资产持续增值
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// Footer 组件
function Footer({ onEnter }: { onEnter: () => void }) {
  return (
    <footer
      id="footer"
      style={{
        padding: '100px 5vw 40px',
        background: '#0F1A4D',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* CTA row */}
        {footerConfig.heading && (
          <div
            className="flex flex-col md:flex-row md:items-center md:justify-between"
            style={{ marginBottom: 60, gap: 20 }}
          >
            <h2
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(26px, 3vw, 40px)',
                lineHeight: 1.2,
                letterSpacing: '-0.5px',
                color: '#FFFFFF',
                margin: 0,
                textWrap: 'balance',
              }}
            >
              {footerConfig.heading}
            </h2>
            <button
              onClick={onEnter}
              style={{
                padding: '12px 32px',
                borderRadius: 8,
                background: '#0033CC',
                color: '#FFFFFF',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2B5CFF';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0033CC';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              立即进入
            </button>
          </div>
        )}

        <div
          style={{
            width: '100%',
            height: 1,
            background: 'rgba(102, 163, 255, 0.15)',
            marginBottom: 40,
          }}
        />

        {/* Links row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8" style={{ marginBottom: 60 }}>
          {footerConfig.columns.map((col) => (
            <div key={col.title}>
              <h4
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#FFFFFF',
                  marginBottom: 16,
                  letterSpacing: '0.5px',
                }}
              >
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 14,
                        color: '#8C9DBE',
                        cursor: 'pointer',
                        transition: 'color 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#FFFFFF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#8C9DBE';
                      }}
                    >
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div
          className="flex flex-col md:flex-row md:items-center md:justify-between"
          style={{ gap: 16 }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              color: '#8C9DBE',
            }}
          >
            {footerConfig.copyright}
          </p>
          <div className="flex gap-6">
            {footerConfig.bottomLinks.map((link) => (
              <span
                key={link.label}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: '#8C9DBE',
                  cursor: 'pointer',
                  transition: 'color 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#8C9DBE';
                }}
              >
                {link.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// 主页面组件
export function StartPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div
      style={{
        background: '#F8FAFF',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      <Navigation onEnter={onEnter} />

      <main>
        <Hero onEnter={onEnter} />
        <Curriculum />
        <AlumniArchives />
        <CinematicVision />
        <Footer onEnter={onEnter} />
      </main>
    </div>
  );
}
