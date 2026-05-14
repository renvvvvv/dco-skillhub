import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { capabilitiesConfig } from '../config';

export default function Curriculum() {
  const navigate = useNavigate();
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

  if (!capabilitiesConfig.sectionLabel && capabilitiesConfig.items.length === 0) {
    return null;
  }

  return (
    <section
      id="curriculum"
      ref={sectionRef}
      className="relative"
      style={{
        padding: '150px 5vw',
        minHeight: '80vh',
        background: '#F8FAFF',
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div ref={headerRef}>
          {capabilitiesConfig.sectionLabel && (
            <div
              className="mb-6"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: '#0033CC',
                opacity: 0.7,
              }}
            >
              {capabilitiesConfig.sectionLabel}
            </div>
          )}
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
              position: 'relative',
              overflow: 'hidden',
              textWrap: 'balance',
            }}
          >
            运维智能体矩阵
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
              textWrap: 'pretty',
            }}
          >
            覆盖全栈运维场景，从故障诊断到容量规划，从安全审计到自动化运维，每个智能体都是资深专家的数字化分身
          </p>
        </div>

        {/* 2-column card grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2"
          style={{ gap: 24 }}
        >
          {capabilitiesConfig.items.map((item, i) => (
            <div
              key={item.title}
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
              onClick={() => navigate(`/capability/${item.slug}`)}
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
              {/* Image */}
              <div
                className="relative overflow-hidden"
                style={{ aspectRatio: '16/10' }}
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    style={{
                      opacity: 0.6,
                      filter: 'grayscale(80%) brightness(0.95)',
                      transition: 'all 0.6s ease',
                    }}
                    onMouseEnter={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.opacity = '1';
                      img.style.filter = 'grayscale(0%) brightness(1.05)';
                      img.style.transform = 'scale(1.06)';
                    }}
                    onMouseLeave={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.opacity = '0.6';
                      img.style.filter = 'grayscale(80%) brightness(0.95)';
                      img.style.transform = 'scale(1)';
                    }}
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

              {/* Text */}
              <div style={{ padding: '22px 26px 24px' }}>
                <h3
                  className="group-hover:text-[#0033CC]"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    fontSize: 20,
                    color: '#0F1A4D',
                    margin: '0 0 10px 0',
                    lineHeight: 1.3,
                    transition: 'color 0.3s ease',
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: '#8C9DBE',
                    margin: 0,
                    textWrap: 'pretty',
                  }}
                >
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
