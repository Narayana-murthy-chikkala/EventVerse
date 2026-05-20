import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import EventCard from '../components/EventCard';
import { getFeaturedEvents, getEventsByCategory, getUpcomingEvents } from '../services/eventService';
import { HiOutlineSearch, HiOutlineTicket, HiOutlineStar, HiOutlineArrowRight } from 'react-icons/hi';

const categoryEmojis = {
  'Classical Music': '🎵',
  'Folk Dance': '💃',
  'Classical Dance': '🩰',
  'Art Exhibition': '🎨',
  'Food Festival': '🍛',
  'Theater & Drama': '🎭',
  'Craft Fair': '🏺',
  'Cultural Parade': '🎪',
  'Literary Festival': '📚',
  'Film Festival': '🎬',
  'Spiritual & Religious': '🕉️',
  Other: '🎉',
};

const useCounter = (end, duration = 2200) => {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let startTimestamp = null;
          const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) window.requestAnimationFrame(step);
          };
          window.requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return [count, nodeRef];
};

/* ─── Premium Light Mode Styles ─── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Poppins:wght@300;400;500;600;700&display=swap');

  * { box-sizing: border-box; }

  :root {
    --primary-terra: #D4522A;
    --primary-light: #E8835E;
    --primary-dark: #A33E1C;
    --gold: #C9A84C;
    --gold-light: #E8C876;
    --sage: #6B8D5E;
    --white: #FFFFFF;
    --bg-light: #FAFAF8;
    --bg-lighter: #FFFFFF;
    --text-dark: #1A1510;
    --text-gray: #5A5048;
    --text-light: #8B7D6F;
    --border-light: #E5DDD5;
    --border-lighter: #F0E8E0;
  }

  .home-root {
    background: var(--bg-light);
    color: var(--text-dark);
    font-family: 'Poppins', sans-serif;
    overflow-x: hidden;
  }

  /* ── HERO SECTION ── */
  .hero {
    min-height: 100svh;
    display: grid;
    grid-template-rows: 1fr auto;
    position: relative;
    overflow: hidden;
    padding-top: 70px;
    background: linear-gradient(135deg, #FFFFFF 0%, #FAFAF8 50%, #F5F0EB 100%);
  }

  .hero-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 100% 80% at 15% 100%, rgba(212, 82, 42, 0.08) 0%, transparent 60%),
      radial-gradient(ellipse 80% 70% at 85% 10%, rgba(201, 168, 76, 0.06) 0%, transparent 55%);
    pointer-events: none;
  }

  .hero-ring {
    position: absolute;
    border-radius: 50%;
    border: 1.5px solid rgba(212, 82, 42, 0.08);
    pointer-events: none;
  }

  .hero-ring-1 {
    width: 700px;
    height: 700px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: spin-slow 80s linear infinite;
  }

  .hero-ring-2 {
    width: 900px;
    height: 900px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-color: rgba(201, 168, 76, 0.05);
    animation: spin-slow 120s linear infinite reverse;
  }

  .hero-ring-3 {
    width: 500px;
    height: 500px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-color: rgba(212, 82, 42, 0.06);
    border-style: dashed;
    animation: spin-slow 60s linear infinite;
  }

  @keyframes spin-slow {
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }

  .hero-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 80px 24px 40px;
    position: relative;
    z-index: 2;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
  }

  .hero-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px;
    border: 1.5px solid rgba(212, 82, 42, 0.25);
    border-radius: 50px;
    background: rgba(248, 245, 240, 0.8);
    backdrop-filter: blur(10px);
    margin-bottom: 32px;
    animation: fadeUp 0.8s ease both;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  }

  .hero-kicker-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary-terra);
    animation: pulse-warm 2s ease-in-out infinite;
  }

  @keyframes pulse-warm {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.1); }
  }

  .hero-kicker-text {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--primary-terra);
  }

  .hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(48px, 9vw, 100px);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.01em;
    color: var(--text-dark);
    margin: 0 0 16px 0;
    animation: fadeUp 0.8s 0.15s ease both;
  }

  .hero-title em {
    font-style: italic;
    color: var(--primary-terra);
  }

  .hero-title-line2 {
    display: block;
  }

  .hero-sub {
    font-size: clamp(15px, 2vw, 18px);
    color: var(--text-gray);
    line-height: 1.8;
    max-width: 550px;
    margin: 24px auto 48px;
    font-weight: 400;
    animation: fadeUp 0.8s 0.3s ease both;
    letter-spacing: 0.2px;
  }

  .hero-cta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    align-items: center;
    justify-content: center;
    animation: fadeUp 0.8s 0.45s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── BUTTONS ── */
  .btn-terra {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 32px;
    background: linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%);
    color: #fff;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(212, 82, 42, 0.2);
  }

  .btn-terra::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.2) 100%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .btn-terra:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(212, 82, 42, 0.3);
  }

  .btn-terra:active { transform: scale(0.97); }
  .btn-terra svg { flex-shrink: 0; transition: transform 0.3s; }
  .btn-terra:hover svg { transform: translateX(3px); }

  .btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 13px 32px;
    background: var(--bg-lighter);
    color: var(--text-dark);
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    border: 1.5px solid var(--border-light);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
  }

  .btn-outline:hover {
    background: var(--bg-light);
    border-color: var(--primary-terra);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(212, 82, 42, 0.1);
  }

  .btn-outline:active { transform: scale(0.97); }
  .btn-outline svg { transition: transform 0.3s; }
  .btn-outline:hover svg { transform: translateX(3px); }

  /* ── SCROLL INDICATOR ── */
  .hero-scroll {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px 0;
    animation: bounce 2.5s ease-in-out infinite;
  }

  .hero-scroll-text {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-light);
  }

  .hero-scroll-line {
    width: 1px;
    height: 24px;
    background: var(--primary-terra);
    opacity: 0.4;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(8px); }
  }

  /* ── MARQUEE ── */
  .marquee-section {
    background: var(--bg-lighter);
    padding: 32px 0;
    overflow: hidden;
    position: relative;
    border-top: 1px solid var(--border-lighter);
    border-bottom: 1px solid var(--border-lighter);
  }

  .marquee-track {
    display: flex;
    gap: 32px;
    animation: slide 35s linear infinite;
    white-space: nowrap;
  }

  .marquee-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 15px;
    font-weight: 500;
    color: var(--text-gray);
    flex-shrink: 0;
    padding: 0 8px;
  }

  .marquee-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--primary-terra);
    opacity: 0.5;
  }

  @keyframes slide {
    from { transform: translateX(0); }
    to { transform: translateX(calc(-100% - 32px)); }
  }

  /* ── STATS SECTION ── */
  .stats {
    background: var(--bg-light);
    padding: 100px 24px;
    position: relative;
  }

  .stats-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 24px;
  }

  .stat-item {
    padding: 48px 32px;
    border-radius: 12px;
    background: var(--bg-lighter);
    border: 1.5px solid var(--border-light);
    text-align: center;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    animation: slideInUp 0.6s ease both;
  }

  .stat-item:nth-child(1) { animation-delay: 0s; }
  .stat-item:nth-child(2) { animation-delay: 0.1s; }
  .stat-item:nth-child(3) { animation-delay: 0.2s; }
  .stat-item:nth-child(4) { animation-delay: 0.3s; }

  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(25px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .stat-item:hover {
    background: var(--bg-light);
    border-color: var(--primary-terra);
    transform: translateY(-6px);
    box-shadow: 0 12px 28px rgba(212, 82, 42, 0.1);
  }

  .stat-value {
    font-family: 'Playfair Display', serif;
    font-size: clamp(32px, 5vw, 52px);
    font-weight: 800;
    color: var(--primary-terra);
    margin-bottom: 8px;
    line-height: 1;
  }

  .stat-value span {
    font-size: 0.6em;
    margin-left: 4px;
  }

  .stat-label {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-light);
  }

  /* ── FEATURED SECTION ── */
  .featured {
    max-width: 1400px;
    margin: 0 auto;
    padding: 100px 24px;
    position: relative;
  }

  .featured-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 60px;
    flex-wrap: wrap;
    gap: 24px;
  }

  .section-eyebrow {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--primary-terra);
    margin-bottom: 12px;
  }

  .section-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(36px, 6vw, 56px);
    font-weight: 800;
    color: var(--text-dark);
    line-height: 1.2;
    margin: 0;
  }

  .section-title em {
    font-style: italic;
    color: var(--primary-terra);
  }

  .section-sub {
    font-size: 15px;
    color: var(--text-gray);
    line-height: 1.6;
    margin: 0;
  }

  .see-all-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--primary-terra);
    text-decoration: none;
    transition: all 0.3s;
    padding: 8px 0;
  }

  .see-all-link:hover {
    gap: 12px;
    color: var(--primary-dark);
  }

  .featured-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 28px;
  }

  /* ── HOW IT WORKS ── */
  .hiw {
    background: var(--bg-light);
    padding: 100px 24px;
    position: relative;
  }

  .hiw-inner {
    max-width: 1200px;
    margin: 0 auto;
  }

  .hiw-header {
    margin-bottom: 80px;
  }

  .hiw-header .section-title {
    max-width: 600px;
  }

  .hiw-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 32px;
    position: relative;
    z-index: 2;
  }

  .hiw-card {
    padding: 48px 40px;
    border-radius: 12px;
    background: var(--bg-lighter);
    border: 1.5px solid var(--border-light);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    animation: slideInUp 0.6s ease both;
  }

  .hiw-card:nth-child(1) { animation-delay: 0s; }
  .hiw-card:nth-child(2) { animation-delay: 0.15s; }
  .hiw-card:nth-child(3) { animation-delay: 0.3s; }

  .hiw-card:hover {
    transform: translateY(-10px);
    background: var(--bg-light);
    border-color: var(--primary-terra);
    box-shadow: 0 16px 40px rgba(212, 82, 42, 0.12);
  }

  .hiw-card-num {
    font-family: 'Playfair Display', serif;
    font-size: 48px;
    font-weight: 800;
    color: var(--primary-terra);
    margin-bottom: 20px;
    opacity: 0.7;
  }

  .hiw-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%);
    border-radius: 10px;
    margin-bottom: 24px;
    color: #fff;
    font-size: 28px;
    box-shadow: 0 6px 16px rgba(212, 82, 42, 0.18);
    transition: all 0.3s;
  }

  .hiw-card:hover .hiw-icon-wrap {
    transform: scale(1.1) rotate(5deg);
  }

  .hiw-card-title {
    font-family: 'Playfair Display', serif;
    font-size: 24px;
    font-weight: 700;
    color: var(--text-dark);
    margin-bottom: 12px;
  }

  .hiw-card-desc {
    font-size: 14px;
    line-height: 1.8;
    color: var(--text-gray);
  }

  .hiw-connector {
    position: absolute;
    top: 64px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, var(--primary-terra) 20%, var(--primary-terra) 80%, transparent 100%);
    z-index: 1;
    display: none;
  }

  @media (max-width: 768px) {
    .hiw-connector { display: none !important; }
  }

  /* ── TESTIMONIALS SECTION ── */
  .testimonials {
    padding: 120px 24px;
    position: relative;
    background: var(--bg-lighter);
    border-top: 1px solid var(--border-lighter);
  }

  .testimonials-inner {
    max-width: 1200px;
    margin: 0 auto;
  }

  .testimonials-header {
    text-align: center;
    margin-bottom: 80px;
  }

  .testimonials-header .section-title {
    margin: 0 auto 16px;
  }

  .testimonials-header .section-sub {
    margin: 0 auto;
    max-width: 500px;
  }

  .testimonials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 28px;
  }

  .testimonial-card {
    padding: 36px 32px;
    border-radius: 12px;
    background: var(--bg-light);
    border: 1.5px solid var(--border-light);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    animation: fadeUp 0.6s ease both;
  }

  .testimonial-card:nth-child(1) { animation-delay: 0s; }
  .testimonial-card:nth-child(2) { animation-delay: 0.15s; }
  .testimonial-card:nth-child(3) { animation-delay: 0.3s; }

  .testimonial-card:hover {
    transform: translateY(-8px);
    background: var(--bg-lighter);
    border-color: var(--primary-terra);
    box-shadow: 0 12px 32px rgba(212, 82, 42, 0.1);
  }

  .testimonial-rating {
    display: flex;
    gap: 6px;
    margin-bottom: 18px;
    font-size: 16px;
  }

  .testimonial-text {
    font-size: 15px;
    line-height: 1.8;
    color: var(--text-gray);
    margin-bottom: 28px;
    flex: 1;
    font-style: italic;
    font-family: 'Lora', serif;
  }

  .testimonial-author {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .testimonial-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    box-shadow: 0 4px 12px rgba(212, 82, 42, 0.15);
  }

  .testimonial-info h4 {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-dark);
    margin: 0 0 2px 0;
  }

  .testimonial-info p {
    font-size: 12px;
    color: var(--text-light);
    margin: 0;
  }

  /* ── FINAL CTA ── */
  .final-cta {
    background: linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%);
    padding: 100px 24px;
    position: relative;
    overflow: hidden;
  }

  .final-cta::before {
    content: '';
    position: absolute;
    inset: 0;
    background: 
      radial-gradient(ellipse 60% 60% at 10% 90%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse 80% 50% at 90% 10%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
    pointer-events: none;
  }

  .final-cta-inner {
    max-width: 700px;
    margin: 0 auto;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  .final-cta-eyebrow {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.85);
    margin-bottom: 20px;
  }

  .final-cta-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(36px, 6vw, 56px);
    font-weight: 800;
    color: #fff;
    line-height: 1.2;
    margin: 0 0 24px 0;
  }

  .final-cta-title em {
    font-style: italic;
  }

  .final-cta-sub {
    font-size: 16px;
    line-height: 1.8;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 40px;
  }

  .final-cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 16px 40px;
    background: var(--bg-lighter);
    color: var(--primary-terra);
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 700;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    z-index: 2;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  .final-cta-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  }

  .final-cta-btn:active {
    transform: scale(0.96);
  }

  .final-cta-btn svg {
    flex-shrink: 0;
    transition: transform 0.3s;
  }

  .final-cta-btn:hover svg {
    transform: translateX(4px);
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 768px) {
    .hero-inner { padding: 50px 20px 30px; }
    .featured { padding: 60px 20px; }
    .hiw { padding: 60px 20px; }
    .testimonials { padding: 80px 20px; }
    .final-cta { padding: 60px 20px; }
    .hiw-card { padding: 32px 24px; }
    .stat-item { padding: 36px 24px; }
    .testimonial-card { padding: 28px 24px; }
    .featured-header { flex-direction: column; }
    .section-title { font-size: clamp(28px, 5vw, 42px); }
  }
`;

const marqueeItems = [
  'Classical Music', 'Folk Dance', 'Art Exhibitions', 'Food Festivals',
  'Theater & Drama', 'Literary Festivals', 'Cultural Parades', 'Film Festivals',
  'Craft Fairs', 'Spiritual Gatherings',
];

const testimonials = [
  {
    id: 1,
    author: 'Priya Sharma',
    role: 'Cultural Enthusiast, Delhi',
    text: 'Finally a platform that celebrates our heritage! The event discovery is seamless and I have attended the most magical festivals through this app.',
    rating: 5,
    avatar: 'PS',
  },
  {
    id: 2,
    author: 'Rajesh Kumar',
    role: 'Festival Organizer, Mumbai',
    text: 'Exceptional platform with excellent reach. Our events now connect with thousands of culture lovers across the country. Highly recommended!',
    rating: 5,
    avatar: 'RK',
  },
  {
    id: 3,
    author: 'Ananya Patel',
    role: 'Travel & Culture Blogger, Bangalore',
    text: 'An absolute gem! Discovered hidden cultural treasures and unforgettable experiences. Every booking has been perfect and seamless.',
    rating: 5,
    avatar: 'AP',
  },
];

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [email, setEmail] = useState('');

  const [usersCount, usersRef] = useCounter(24500);
  const [eventsCount, eventsRef] = useCounter(1200);
  const [citiesCount, citiesRef] = useCounter(45);
  const [ticketsCount, ticketsRef] = useCounter(89000);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featRes, catRes, upRes] = await Promise.all([
          getFeaturedEvents(),
          getEventsByCategory(),
          getUpcomingEvents(),
        ]);
        setFeatured(featRes.data.data.events || []);
        setCategories(catRes.data.data.categories || []);
        setUpcoming(upRes.data.data.events || []);
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      }
    };
    fetchData();
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success('Thank you for subscribing! 🪔');
    setEmail('');
  };

  return (
    <>
      <style>{css}</style>
      <div className="home-root">

        {/* ── HERO SECTION ── */}
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-ring hero-ring-1" />
          <div className="hero-ring hero-ring-2" />
          <div className="hero-ring hero-ring-3" />

          <div className="hero-inner">
            <div className="hero-kicker">
              <div className="hero-kicker-dot" />
              <span className="hero-kicker-text">The Premier Cultural Platform</span>
            </div>

            <h1 className="hero-title">
              <em>Experience</em> the<br />
              <span className="hero-title-line2">Soul of Culture</span>
            </h1>

            <p className="hero-sub">
              Timeless traditions. Living heritage. Book unforgettable cultural experiences near you.
            </p>

            <div className="hero-cta-row">
              <Link to="/events" className="btn-terra">
                Discover Festivals
                <HiOutlineArrowRight style={{ width: 18, height: 18 }} />
              </Link>
              <a href="#how-it-works" className="btn-outline">
                How It Works
              </a>
            </div>
          </div>

          <div className="hero-scroll">
            <span className="hero-scroll-text">Scroll to explore</span>
            <div className="hero-scroll-line" />
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div className="marquee-section">
          <div className="marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="marquee-item">
                {categoryEmojis[item] || '✦'} {item}
                <span className="marquee-dot" />
              </span>
            ))}
          </div>
        </div>

        {/* ── STATS ── */}
        <section className="stats">
          <div className="stats-inner">
            {[
              { ref: usersRef, count: usersCount, label: 'Culture Enthusiasts', suffix: '+' },
              { ref: eventsRef, count: eventsCount, label: 'Cultural Events', suffix: '+' },
              { ref: citiesRef, count: citiesCount, label: 'Cities & Towns', suffix: '' },
              { ref: ticketsRef, count: ticketsCount, label: 'Tickets Sold', suffix: '' },
            ].map((stat, i) => (
              <div key={i} ref={stat.ref} className="stat-item">
                <div className="stat-value">
                  {stat.count.toLocaleString()}<span>{stat.suffix}</span>
                </div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURED ── */}
        {featured.length > 0 && (
          <section style={{ background: 'var(--bg-lighter)' }}>
            <div className="featured">
              <div className="featured-header">
                <div>
                  <span className="section-eyebrow">Curated Collection</span>
                  <h2 className="section-title">
                    Featured <em>Festivals</em>
                  </h2>
                  <p className="section-sub" style={{ marginTop: 12 }}>
                    Handpicked experiences celebrating the world's rich cultural tapestry.
                  </p>
                </div>
                <Link to="/events" className="see-all-link">
                  View all events <HiOutlineArrowRight style={{ width: 16, height: 16 }} />
                </Link>
              </div>

              <div className="featured-grid">
                {featured.slice(0, 6).map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── HOW IT WORKS ── */}
        <section className="hiw" id="how-it-works">
          <div className="hiw-inner">
            <div className="hiw-header">
              <span className="section-eyebrow">Simple Steps</span>
              <h2 className="section-title">
                From Discovery<br /><em>to Delight</em>
              </h2>
            </div>

            <div style={{ position: 'relative' }}>
              <div className="hiw-connector" />
              <div className="hiw-grid">
                {[
                  {
                    num: '01',
                    icon: <HiOutlineSearch />,
                    title: 'Discover',
                    desc: 'Browse authentic cultural events across classical music, dance, art, food & more. Filter by city, date, or tradition.',
                  },
                  {
                    num: '02',
                    icon: <HiOutlineTicket />,
                    title: 'Book Instantly',
                    desc: 'Secure your seat with our fast checkout. Get digital QR tickets instantly delivered to your phone.',
                  },
                  {
                    num: '03',
                    icon: <HiOutlineStar />,
                    title: 'Immerse Yourself',
                    desc: 'Arrive, scan your QR, and dive deep into the magic of our living cultural heritage.',
                  },
                ].map((step, i) => (
                  <div key={i} className="hiw-card">
                    <div className="hiw-card-num">{step.num}</div>
                    <div className="hiw-icon-wrap">{step.icon}</div>
                    <div className="hiw-card-title">{step.title}</div>
                    <div className="hiw-card-desc">{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS SECTION ── */}
        <section className="testimonials">
          <div className="testimonials-inner">
            <div className="testimonials-header">
              <h2 className="section-title">Loved by Thousands</h2>
              <p className="section-sub">
                Hear from our community members who've experienced unforgettable cultural moments.
              </p>
            </div>

            <div className="testimonials-grid">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="testimonial-card">
                  <div className="testimonial-rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i}>⭐</span>
                    ))}
                  </div>
                  <p className="testimonial-text">"{testimonial.text}"</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">{testimonial.avatar}</div>
                    <div className="testimonial-info">
                      <h4>{testimonial.author}</h4>
                      <p>{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="final-cta">
          <div className="final-cta-inner">
            <span className="final-cta-eyebrow">Join the community</span>
            <h2 className="final-cta-title">
              Ready for your next<br /><em>cultural adventure?</em>
            </h2>
            <p className="final-cta-sub">
              Join thousands of people celebrating heritage through unforgettable live experiences.
            </p>
            <Link to="/register" className="final-cta-btn">
              Join Free Today
              <HiOutlineArrowRight style={{ width: 18, height: 18 }} />
            </Link>
          </div>
        </section>

      </div>
    </>
  );
};

export default Home;