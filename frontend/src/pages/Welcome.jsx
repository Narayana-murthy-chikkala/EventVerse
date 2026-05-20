import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300;1,600;1,700&family=Cormorant:ital,wght@0,700;1,700&family=Poppins:wght@300;400;500;600;700;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #FAFAF8; overflow: hidden; }

  .wv-root {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(160deg, #FFFFFF 0%, #FAFAF8 45%, #F5F0EB 100%);
    position: relative;
    overflow: hidden;
  }

  /* ── Canvas ── */
  .wv-canvas {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
  }

  /* ── Orb glows ── */
  .wv-glow {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    z-index: 2;
  }
  .wv-glow-a {
    top: -20%; left: -15%;
    width: 70vw; height: 70vw;
    background: radial-gradient(circle, rgba(212,82,42,0.08) 0%, transparent 65%);
    animation: orb-a 14s ease-in-out infinite alternate;
  }
  .wv-glow-b {
    bottom: -25%; right: -15%;
    width: 65vw; height: 65vw;
    background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 65%);
    animation: orb-b 18s ease-in-out infinite alternate-reverse;
  }
  .wv-glow-c {
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 30vw; height: 30vw;
    background: radial-gradient(circle, rgba(212,82,42,0.04) 0%, transparent 70%);
    animation: orb-c 8s ease-in-out infinite alternate;
  }
  @keyframes orb-a { to { transform: translate(4%, 6%) scale(1.08); } }
  @keyframes orb-b { to { transform: translate(-3%, -5%) scale(1.05); } }
  @keyframes orb-c { to { transform: translate(-50%,-50%) scale(1.4); opacity: 0.5; } }

  /* ── Rings ── */
  .wv-ring {
    position: absolute;
    top: 50%; left: 50%;
    border-radius: 50%;
    pointer-events: none;
    z-index: 3;
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.7);
    transition: opacity 0.9s ease, transform 0.9s cubic-bezier(0.16,1,0.3,1);
  }
  .wv-ring.show {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  .wv-ring-1 {
    width: min(680px,92vw); height: min(680px,92vw);
    border: 1px dashed rgba(212,82,42,0.13);
    animation: spin-cw 75s linear infinite;
    transition-delay: 0s;
  }
  .wv-ring-2 {
    width: min(490px,70vw); height: min(490px,70vw);
    border: 0.5px solid rgba(201,168,76,0.12);
    animation: spin-ccw 50s linear infinite;
    transition-delay: 0.15s;
  }
  .wv-ring-3 {
    width: min(310px,46vw); height: min(310px,46vw);
    border: 0.5px dashed rgba(212,82,42,0.09);
    animation: spin-cw 35s linear infinite;
    transition-delay: 0.3s;
  }
  @keyframes spin-cw  { to { transform: translate(-50%,-50%) rotate(360deg);  } }
  @keyframes spin-ccw { to { transform: translate(-50%,-50%) rotate(-360deg); } }

  /* ── Arc ── */
  .wv-arc {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%,-50%) rotate(-90deg);
    width: min(680px,92vw); height: min(680px,92vw);
    z-index: 4;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.8s 0.4s ease;
    animation: spin-cw 11s linear infinite;
  }
  .wv-arc.show { opacity: 1; }

  /* ── Dot nodes on ring 1 ── */
  .wv-dots {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    width: min(680px,92vw); height: min(680px,92vw);
    z-index: 4;
    pointer-events: none;
    opacity: 0;
    transition: opacity 1s 0.5s ease;
    animation: spin-ccw 75s linear infinite;
  }
  .wv-dots.show { opacity: 1; }

  /* ══════════════════════════════════════════════════
     THE WORD  — complete typographic rework
  ══════════════════════════════════════════════════ */

  .wv-word {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: baseline;
    gap: 0;
    cursor: default;
    user-select: none;
    /* optical vertical nudge so baseline sits on the ring centre */
    transform: translateY(4px);
  }

  /* ── "EVENT" — Cormorant Garamond, ultra-light, wide tracking ── */
  .wv-a {
    display: flex;
    align-items: baseline;
    position: relative;
  }

  .wv-a .wv-letter {
    display: inline-block;
    font-family: 'Cormorant Garamond', serif;
    font-weight: 300;
    font-style: normal;
    font-size: clamp(52px, 11.5vw, 136px);
    line-height: 0.95;
    letter-spacing: 0.18em;
    color: #1A1510;
    opacity: 0;
    transform: translateY(48px);
    animation: letter-rise 0.9s cubic-bezier(0.16,1,0.3,1) forwards;
    -webkit-font-smoothing: antialiased;
    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
  }

  /* Last letter of EVENT — no extra tracking gap before VERSE */
  .wv-a .wv-letter:last-child {
    letter-spacing: 0.04em;
  }

  .wv-a .wv-letter:hover {
    transform: translateY(-10px) scale(1.05) !important;
    color: #D4522A;
  }

  /* ── Thin vertical divider between EVENT and VERSE ── */
  .wv-divider {
    display: inline-block;
    width: 1px;
    height: clamp(36px, 7.5vw, 88px);
    background: linear-gradient(to bottom, transparent, rgba(212,82,42,0.35), transparent);
    margin: 0 clamp(10px, 1.8vw, 22px);
    align-self: center;
    opacity: 0;
    animation: divider-in 0.6s 0.85s ease forwards;
    flex-shrink: 0;
  }

  @keyframes divider-in {
    to { opacity: 1; }
  }

  /* ── "VERSE" — Cormorant italic, heavier, gradient shimmer ── */
  .wv-b {
    display: flex;
    align-items: baseline;
    position: relative;
  }

  .wv-b .wv-letter {
    display: inline-block;
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-style: italic;
    font-size: clamp(52px, 11.5vw, 136px);
    line-height: 0.95;
    letter-spacing: 0.06em;
    background: linear-gradient(
      125deg,
      #A33E1C 0%,
      #D4522A 22%,
      #E8835E 40%,
      #C9A84C 58%,
      #E8C56A 72%,
      #D4522A 88%,
      #A33E1C 100%
    );
    background-size: 320% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    opacity: 0;
    transform: translateY(48px);
    animation:
      letter-rise 0.9s cubic-bezier(0.16,1,0.3,1) forwards,
      gold-shimmer 6s 2.6s ease-in-out infinite;
    -webkit-font-smoothing: antialiased;
    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
  }

  .wv-b .wv-letter:hover {
    transform: translateY(-10px) scale(1.05) !important;
  }

  @keyframes letter-rise {
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes gold-shimmer {
    0%,100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }
  }

  /* ── Subtitle tag line ── */
  .wv-tagline {
    position: absolute;
    bottom: -clamp(28px, 4.5vw, 46px);
    left: 0;
    right: 0;
    text-align: center;
    font-family: 'Poppins', sans-serif;
    font-weight: 300;
    font-size: clamp(10px, 1.4vw, 13px);
    letter-spacing: 0.38em;
    text-transform: uppercase;
    color: rgba(90,72,60,0.45);
    opacity: 0;
    animation: tagline-in 1s 1.6s ease forwards;
    white-space: nowrap;
    overflow: hidden;
  }

  /* animate the text-reveal via clip-path */
  @keyframes tagline-in {
    from { opacity: 0; letter-spacing: 0.55em; }
    to   { opacity: 1; letter-spacing: 0.38em; }
  }

  /* ── Refined underline: two-line rule beneath VERSE ── */
  .wv-underline-wrap {
    position: absolute;
    bottom: -10px;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 3.5px;
    overflow: hidden;
  }

  .wv-underline {
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, #D4522A 30%, #C9A84C 60%, transparent 100%);
    transform: scaleX(0);
    transform-origin: left;
    border-radius: 1px;
  }

  .wv-underline:nth-child(1) {
    animation: underline-draw 0.7s 1.4s cubic-bezier(0.16,1,0.3,1) forwards;
  }
  .wv-underline:nth-child(2) {
    height: 0.5px;
    opacity: 0.45;
    animation: underline-draw 0.7s 1.55s cubic-bezier(0.16,1,0.3,1) forwards;
  }

  @keyframes underline-draw {
    to { transform: scaleX(1); }
  }

  /* ── Morphing background watermark ── */
  .wv-watermark {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    z-index: 0;
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-style: italic;
    font-size: clamp(130px, 30vw, 360px);
    letter-spacing: -0.01em;
    white-space: nowrap;
    color: transparent;
    -webkit-text-stroke: 1px rgba(212,82,42,0.045);
    pointer-events: none;
    opacity: 0;
    animation: wm-fade 1.4s 0.6s ease forwards, wm-float 11s 2s ease-in-out infinite alternate;
    user-select: none;
  }

  @keyframes wm-fade  { to { opacity: 1; } }
  @keyframes wm-float {
    from { transform: translate(-50%,-50%) scale(1);    }
    to   { transform: translate(-50%,-50%) scale(1.04); }
  }

  /* ── Progress bar ── */
  .wv-progress {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 2px;
    background: rgba(212,82,42,0.07);
    z-index: 50;
  }

  .wv-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #A33E1C, #D4522A, #C9A84C);
    box-shadow: 0 0 14px rgba(212,82,42,0.4);
    transition: width 0.04s linear;
  }

  /* ── Fade-out overlay ── */
  .wv-fadeout {
    position: fixed;
    inset: 0;
    background: #FAFAF8;
    z-index: 100;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.65s ease;
  }
  .wv-fadeout.active { opacity: 1; pointer-events: all; }
`;

/* ── Letter sets ── */
const EVENT_LETTERS = ['E','V','E','N','T'];
const VERSE_LETTERS = ['V','E','R','S','E'];

/* ── Canvas: warm dust + mouse-reactive constellation ── */
const useCanvas = (canvasRef) => {
  const mouse = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let raf;

    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    const onMove = (e) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMove);

    /* Dust motes */
    const DUST = Array.from({ length: 50 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 2 + 0.3,
      vy: -(Math.random() * 0.18 + 0.04),
      vx: (Math.random() - 0.5) * 0.07,
      maxA: Math.random() * 0.22 + 0.04,
      life: Math.random(), spd: Math.random() * 0.004 + 0.001,
      gold: Math.random() > 0.5,
    }));

    /* Constellation nodes */
    const NODES = Array.from({ length: 16 }, () => ({
      ox: Math.random() * W, oy: Math.random() * H,
      x: 0, y: 0,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.2 + 0.3,
      alpha: Math.random() * 0.2 + 0.05,
    }));
    NODES.forEach(n => { n.x = n.ox; n.y = n.oy; });

    let t = 0;
    const CONNECT_DIST = Math.min(W, H) * 0.22;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t++;
      const { x: mx, y: my } = mouse.current;

      /* Dust */
      DUST.forEach(p => {
        p.life += p.spd;
        const a = p.maxA * (0.4 + 0.6 * Math.abs(Math.sin(p.life * Math.PI)));
        p.x += p.vx; p.y += p.vy;
        if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold ? `rgba(201,168,76,${a})` : `rgba(212,82,42,${a*0.6})`;
        ctx.fill();
      });

      /* Nodes drift + mouse repel */
      NODES.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        const dx = n.x - mx, dy = n.y - my;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 100) { n.x += (dx/d)*1.5; n.y += (dy/d)*1.5; }
      });

      /* Connections */
      for (let i = 0; i < NODES.length; i++) {
        for (let j = i+1; j < NODES.length; j++) {
          const dx = NODES[i].x - NODES[j].x, dy = NODES[i].y - NODES[j].y;
          const d = Math.sqrt(dx*dx+dy*dy);
          if (d < CONNECT_DIST) {
            ctx.beginPath();
            ctx.moveTo(NODES[i].x, NODES[i].y);
            ctx.lineTo(NODES[j].x, NODES[j].y);
            ctx.strokeStyle = `rgba(212,82,42,${(1-d/CONNECT_DIST)*0.07})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
        /* Mouse connection */
        const dx = NODES[i].x - mx, dy = NODES[i].y - my;
        const d = Math.sqrt(dx*dx+dy*dy);
        if (d < 160) {
          ctx.beginPath();
          ctx.moveTo(NODES[i].x, NODES[i].y);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(212,82,42,${(1-d/160)*0.12})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }

      /* Node dots */
      NODES.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(201,168,76,${n.alpha})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
    };
  }, [canvasRef]);
};

/* ── Dot positions on ring (12 evenly spaced) ── */
const RingDots = () => {
  const r = 336;
  const dots = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const cx = 340 + Math.cos(angle) * r;
    const cy = 340 + Math.sin(angle) * r;
    return { cx, cy, large: i % 3 === 0 };
  });
  return (
    <svg width="680" height="680" viewBox="0 0 680 680" fill="none"
      style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'min(680px,92vw)', height:'min(680px,92vw)' }}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.large ? 3 : 1.5}
          fill={d.large ? 'rgba(212,82,42,0.35)' : 'rgba(201,168,76,0.25)'} />
      ))}
    </svg>
  );
};

const Welcome = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const ring1Ref = useRef(null);
  const ring2Ref = useRef(null);
  const ring3Ref = useRef(null);
  const arcRef   = useRef(null);
  const dotsRef  = useRef(null);
  const progRef  = useRef(null);
  const fadeRef  = useRef(null);
  useCanvas(canvasRef);

  useEffect(() => {
    const t1 = setTimeout(() => {
      ring1Ref.current?.classList.add('show');
      ring2Ref.current?.classList.add('show');
      ring3Ref.current?.classList.add('show');
      arcRef.current?.classList.add('show');
      dotsRef.current?.classList.add('show');
    }, 1000);

    const dur = 6000, tick = 30;
    let prog = 0;
    const timer = setInterval(() => {
      prog = Math.min(prog + 100/(dur/tick), 100);
      if (progRef.current) progRef.current.style.width = `${prog}%`;
      if (prog >= 100) {
        clearInterval(timer);
        fadeRef.current?.classList.add('active');
        setTimeout(() => navigate('/home'), 680);
      }
    }, tick);

    return () => { clearTimeout(t1); clearInterval(timer); };
  }, [navigate]);

  return (
    <>
      <style>{css}</style>
      <div className="wv-root">

        {/* Canvas */}
        <canvas ref={canvasRef} className="wv-canvas" />

        {/* Glows */}
        <div className="wv-glow wv-glow-a" />
        <div className="wv-glow wv-glow-b" />
        <div className="wv-glow wv-glow-c" />

        {/* Watermark — now italic serif for elegance */}
        <div className="wv-watermark" aria-hidden="true">EV</div>

        {/* Rings */}
        <div ref={ring1Ref} className="wv-ring wv-ring-1" />
        <div ref={ring2Ref} className="wv-ring wv-ring-2" />
        <div ref={ring3Ref} className="wv-ring wv-ring-3" />

        {/* Arc */}
        <div ref={arcRef} className="wv-arc">
          <svg width="100%" height="100%" viewBox="0 0 680 680" fill="none">
            <defs>
              <linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#D4522A" stopOpacity="0"/>
                <stop offset="50%"  stopColor="#D4522A" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#D4522A" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <circle cx="340" cy="340" r="338"
              stroke="url(#ag)"
              strokeWidth="1.5"
              strokeDasharray="70 2054"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Dots */}
        <div ref={dotsRef} className="wv-dots">
          <RingDots />
        </div>

        {/* THE WORD — new typographic layout */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          <div className="wv-word">

            {/* EVENT — light-weight wide-tracked serif */}
            <div className="wv-a">
              {EVENT_LETTERS.map((l, i) => (
                <span
                  key={i}
                  className="wv-letter"
                  style={{ animationDelay: `${0.05 + i * 0.08}s` }}
                >{l}</span>
              ))}
            </div>

            {/* Vertical divider */}
            <div className="wv-divider" />

            {/* VERSE — bold italic serif with shimmer gradient */}
            <div className="wv-b">
              {VERSE_LETTERS.map((l, i) => (
                <span
                  key={i}
                  className="wv-letter"
                  style={{ animationDelay: `${0.48 + i * 0.08}s` }}
                >{l}</span>
              ))}
              {/* Double underline rule */}
              <div className="wv-underline-wrap">
                <div className="wv-underline" />
                <div className="wv-underline" />
              </div>
            </div>

          </div>

          {/* Tagline */}
          <div className="wv-tagline">
            Celebrate Culture &nbsp;·&nbsp; Book Experiences
          </div>

        </div>

        {/* Progress */}
        <div className="wv-progress">
          <div ref={progRef} className="wv-progress-fill" style={{ width:'0%' }} />
        </div>

        {/* Fade out */}
        <div ref={fadeRef} className="wv-fadeout" />
      </div>
    </>
  );
};

export default Welcome;