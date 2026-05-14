import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { researchConfig } from '../config';

export default function AlumniArchives() {
  const gridRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);

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
              duration: 0.9,
              delay: col * 0.12 + row * 0.1,
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

  const handleImgEnter = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    gsap.to(img, { opacity: 1, scale: 1.06, duration: 0.6, ease: 'power2.out' });
    img.style.filter = 'grayscale(0%) brightness(1.05)';
  };

  const handleImgLeave = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    gsap.to(img, { opacity: 0.55, scale: 1, duration: 0.6, ease: 'power2.out' });
    img.style.filter = 'grayscale(80%) brightness(0.95)';
  };

  if (!researchConfig.sectionLabel && researchConfig.projects.length === 0) {
    return null;
  }

  return (
    <section
      id="alumni"
      style={{
        padding: '150px 5vw',
        background: '#F8FAFF',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div ref={headerRef}>
          <div
            className="mb-12"
            style={{
              width: '100%',
              height: 1,
              background: '#D6E4FF',
            }}
          />
          <h2
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(28px, 3.5vw, 48px)',
              lineHeight: 1.15,
              letterSpacing: '-1px',
              color: '#0F1A4D',
              marginBottom: 16,
              textWrap: 'balance',
            }}
          >
            覆盖全栈运维场景
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: 16,
              lineHeight: 1.7,
              color: '#8C9DBE',
              marginBottom: 80,
              maxWidth: 640,
            }}
          >
            每个智能体都是资深专家的数字化分身，让运维能力可复用、可沉淀、可进化
          </p>
        </div>

        {/* 3-column grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: 20 }}
        >
          {researchConfig.projects.map((project, i) => (
            <div
              key={`${project.title}-${i}`}
              ref={(el) => { itemRefs.current[i] = el; }}
              className="group cursor-pointer"
              style={{
                background: '#FFFFFF',
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow: '0 2px 16px rgba(0, 51, 204, 0.06)',
                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                border: '1px solid #D6E4FF',
                opacity: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 20px 50px rgba(0, 51, 204, 0.14)';
                e.currentTarget.style.borderColor = 'rgba(0, 51, 204, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 16px rgba(0, 51, 204, 0.06)';
                e.currentTarget.style.borderColor = '#D6E4FF';
              }}
            >
              <div
                className="relative overflow-hidden"
                style={{ aspectRatio: '16/10' }}
              >
                {project.image && (
                  <img
                    ref={(el) => { imgRefs.current[i] = el; }}
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover"
                    style={{
                      opacity: 0.55,
                      filter: 'grayscale(80%) brightness(0.95)',
                      transition: 'filter 0.6s ease',
                    }}
                    onMouseEnter={handleImgEnter}
                    onMouseLeave={handleImgLeave}
                    loading="lazy"
                  />
                )}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,51,204,0.08) 0%, transparent 40%)',
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: 'radial-gradient(ellipse at 50% 100%, rgba(0,240,255,0.08) 0%, transparent 70%)',
                  }}
                />
              </div>

              <div style={{ padding: '20px 24px 22px' }}>
                <div className="flex items-center justify-between mb-2">
                  <h4
                    className="group-hover:text-[#0033CC]"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      fontSize: 17,
                      color: '#0F1A4D',
                      margin: 0,
                      lineHeight: 1.3,
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {project.title}
                  </h4>
                  <span
                    style={{
                      fontFamily: "'Fira Code', monospace",
                      fontWeight: 400,
                      fontSize: 11,
                      color: '#D6E4FF',
                      flexShrink: 0,
                    }}
                  >
                    {project.year}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: 12,
                    color: '#8C9DBE',
                    lineHeight: 1.5,
                    margin: 0,
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
