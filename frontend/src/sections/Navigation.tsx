import { useEffect, useState } from 'react';
import { siteConfig, navigationConfig } from '../config';

export default function Navigation() {
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

  if (!siteConfig.brandName && navigationConfig.links.length === 0) {
    return null;
  }

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
        <a
          href="#footer"
          onClick={(e) => handleClick(e, '#footer')}
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
        </a>
      )}
    </nav>
  );
}
