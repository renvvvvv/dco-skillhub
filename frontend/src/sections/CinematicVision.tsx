import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { architectureConfig } from '../config';

export default function CinematicVision() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // 确保视频自动播放
      video.play().catch(err => {
        console.log('Auto-play prevented:', err);
        // 如果自动播放被阻止，尝试静音后播放
        video.muted = true;
        video.play().catch(e => console.log('Still cannot play:', e));
      });
    }

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

  if (!architectureConfig.sectionLabel && !architectureConfig.title) {
    return null;
  }

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

        {/* Video */}
        {architectureConfig.videoPath && (
          <div
            className="relative overflow-hidden mb-16"
            style={{
              width: '100%',
              maxWidth: 900,
              margin: '0 auto 56px',
              aspectRatio: '16/9',
              borderRadius: 12,
              boxShadow: '0 20px 60px rgba(0, 51, 204, 0.2)',
              background: '#0a1628',
            }}
          >
            <video
              ref={videoRef}
              src={architectureConfig.videoPath}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
              style={{ display: 'block', minHeight: '200px' }}
              onLoadedData={() => console.log('Video loaded successfully')}
              onError={(e) => {
                console.error('Video failed to load:', architectureConfig.videoPath);
                const videoEl = e.target as HTMLVideoElement;
                videoEl.style.display = 'none';
                // 显示备用内容
                const container = videoEl.parentElement;
                if (container) {
                  container.style.background = 'linear-gradient(135deg, #0033CC 0%, #2B5CFF 100%)';
                  container.style.display = 'flex';
                  container.style.alignItems = 'center';
                  container.style.justifyContent = 'center';
                  const fallback = document.createElement('div');
                  fallback.innerHTML = '<div style="text-align:center;color:white;"><div style="font-size:48px;margin-bottom:16px;">🎬</div><div style="font-size:18px;font-weight:600;">智能体复利效应</div></div>';
                  container.appendChild(fallback);
                }
              }}
            />
          </div>
        )}

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
