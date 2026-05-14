import { footerConfig } from '../config';

export default function Footer() {
  if (!footerConfig.heading && footerConfig.columns.length === 0) {
    return null;
  }

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
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2B5CFF';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0033CC';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🚀 立即进入 随航守卫
            </button>
          </div>
        )}

        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: 1,
            background: 'rgba(102, 163, 255, 0.15)',
            marginBottom: 40,
          }}
        />

        {/* Links */}
        {footerConfig.columns.length > 0 && (
          <div
            className="grid grid-cols-2 md:grid-cols-4"
            style={{ gap: 32, marginBottom: 60 }}
          >
            {footerConfig.columns.map((column, colIndex) => (
              <div key={colIndex} className="flex flex-col" style={{ gap: 12 }}>
                {column.title && (
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      color: '#66A3FF',
                      opacity: 0.6,
                      marginBottom: 4,
                    }}
                  >
                    {column.title}
                  </span>
                )}
                {column.links.map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="footer-link"
                    style={{
                      width: 'fit-content',
                      color: '#D6E4FF',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 13,
                      fontWeight: 400,
                      textDecoration: 'none',
                      transition: 'color 0.3s ease',
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#00F0FF'; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#D6E4FF'; }}
                  >
                    {link}
                  </a>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between"
          style={{
            paddingTop: 20,
            borderTop: '1px solid rgba(102, 163, 255, 0.12)',
            gap: 8,
          }}
        >
          <div className="flex items-center" style={{ gap: 16 }}>
            {/* Logo in a light card container */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 10,
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(0, 51, 204, 0.15)',
              }}
            >
              <span className="text-lg font-bold" style={{ color: '#0033CC' }}>
                DC运维 · 数智中心
              </span>
            </div>
            {footerConfig.copyright && (
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: 12,
                  color: '#8C9DBE',
                  opacity: 0.5,
                }}
              >
                {footerConfig.copyright}
              </span>
            )}
          </div>
          {footerConfig.bottomLinks.length > 0 && (
            <div className="flex items-center" style={{ gap: 20 }}>
              {footerConfig.bottomLinks.map((bottomLink) => (
                <a
                  key={bottomLink.label}
                  href={bottomLink.href || '#'}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: 12,
                    color: '#8C9DBE',
                    opacity: 0.4,
                    textDecoration: 'none',
                    transition: 'opacity 0.3s',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '0.8'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.4'; }}
                >
                  {bottomLink.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
