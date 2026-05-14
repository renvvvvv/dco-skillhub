import { useEffect, useRef } from 'react';

function initBinaryRain(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let animationFrameId = 0;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const FONT_SIZE = 14;
  const COLUMN_DENSITY = 0.7;
  const FALL_SPEED = 1.0;
  const CHARS = '0123456789ABCDEF';
  const randomChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

  interface Column {
    active: boolean;
    restartDelay: number;
    headY: number;
    speed: number;
    trailChars: { char: string; y: number }[];
    opacity: number;
  }

  let columns: Column[] = [];
  let colCount = 0;
  const colWidth = FONT_SIZE * 0.65;

  function createColumn(_index: number): Column {
    return {
      active: Math.random() < COLUMN_DENSITY,
      restartDelay: Math.random() * 3,
      headY: -Math.random() * height * 0.8,
      speed: (1.2 + Math.random() * 2.5) * FALL_SPEED,
      trailChars: [],
      opacity: 0.6 + Math.random() * 0.4,
    };
  }

  function initSystems() {
    colCount = Math.floor(width / colWidth);
    columns = Array.from({ length: colCount }, (_, i) => createColumn(i));
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initSystems();
  }

  let lastTime = 0;

  function render(timestamp: number) {
    const dt = Math.min((timestamp - (lastTime || timestamp)) / 1000, 0.05);
    lastTime = timestamp;

    // Fade trail with ice-blue tinted background
    ctx.fillStyle = 'rgba(248, 250, 255, 0.1)';
    ctx.fillRect(0, 0, width, height);

    if (!prefersReduced) {
      // Update columns
      for (const col of columns) {
        if (!col.active) {
          col.restartDelay -= dt;
          if (col.restartDelay <= 0) {
            col.active = true;
            col.headY = -FONT_SIZE * (5 + Math.random() * 15);
            col.speed = (1.2 + Math.random() * 2.5) * FALL_SPEED;
            col.trailChars = [];
            col.opacity = 0.6 + Math.random() * 0.4;
          }
          continue;
        }

        // Add current head char to trail
        col.trailChars.unshift({
          char: randomChar(),
          y: col.headY,
        });

        // Keep trail limited
        if (col.trailChars.length > 30) {
          col.trailChars.pop();
        }

        // Move head
        col.headY += col.speed * dt * 60;

        // Check if out of view
        if (col.headY > height + FONT_SIZE * 30) {
          col.active = false;
          col.restartDelay = 0.2 + Math.random() * 2;
        }
      }
    }

    // Draw columns
    ctx.font = `${FONT_SIZE}px "Fira Code", "SF Mono", "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let ci = 0; ci < columns.length; ci++) {
      const col = columns[ci];
      if (!col.active && col.trailChars.length === 0) continue;

      const x = ci * colWidth + colWidth / 2;

      // Draw trail
      for (let ti = 0; ti < col.trailChars.length; ti++) {
        const tc = col.trailChars[ti];
        const trailRatio = ti / col.trailChars.length;
        let brightness: number;

        if (ti === 0) {
          brightness = 1.0;
        } else if (ti < 3) {
          brightness = 0.9 - (ti - 1) * 0.1;
        } else {
          brightness = Math.max(0, 0.7 * (1 - trailRatio));
        }

        brightness *= col.opacity;
        if (brightness < 0.02) continue;

        // HSL-based blue/cyan coloring
        // Head: bright cyan, trail fades to deep blue
        const h = ti === 0 ? 180 : 190 + trailRatio * 20;
        const s = 100;
        const l = ti === 0 ? 85 : 70 - trailRatio * 50;

        ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${brightness})`;

        if (ti === 0) {
          ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
          ctx.shadowBlur = 8;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillText(tc.char, x, tc.y);
      }

      ctx.shadowBlur = 0;
    }

    animationFrameId = requestAnimationFrame(render);
  }

  function handleInteract(e: MouseEvent | TouchEvent) {
    const touch = 'touches' in e ? e.touches[0] : null;
    const mouseX = touch ? touch.clientX : (e as MouseEvent).clientX;

    const colIdx = Math.floor(mouseX / colWidth);
    for (let di = -2; di <= 2; di++) {
      const ci = colIdx + di;
      if (columns[ci]) {
        columns[ci].active = true;
        columns[ci].headY = -FONT_SIZE * 2;
        columns[ci].speed = 3 + Math.random() * 3;
        columns[ci].trailChars = [];
      }
    }

    // Spawn a burst of bright chars at mouse position
    const burstCount = 8;
    for (let i = 0; i < burstCount; i++) {
      const offsetCol = colIdx + (Math.floor(Math.random() * 5) - 2);
      if (columns[offsetCol]) {
        columns[offsetCol].active = true;
        columns[offsetCol].headY = -FONT_SIZE * Math.random() * 10;
        columns[offsetCol].speed = 2 + Math.random() * 4;
      }
    }
  }

  window.addEventListener('resize', resize);
  canvas.addEventListener('click', handleInteract);
  canvas.addEventListener('touchstart', handleInteract as EventListener, { passive: false });

  resize();
  animationFrameId = requestAnimationFrame(render);

  return () => {
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('click', handleInteract);
    canvas.removeEventListener('touchstart', handleInteract as EventListener);
    cancelAnimationFrame(animationFrameId);
  };
}

export default function AmberCascades() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const cleanup = initBinaryRain(canvasRef.current);
    return cleanup;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    />
  );
}
