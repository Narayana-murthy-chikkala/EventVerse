import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FullscreenLoader } from '../components/Loader';
import {
  getEventById,
  getAllEvents,
  registerForEvent,
  getMyRegistrations,
  getMyRegistrationsForEvent,
  cancelRegistration,
  getEventImage,
  sendTicketEmail,
} from '../services/eventService';
import EventCard from '../components/EventCard';
import { blobToObjectUrl, revokeObjectUrl } from '../utils/imageUtils';
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlineMap,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDown,
  HiCheckCircle,
  HiOutlineDownload,
  HiOutlineX,
  HiOutlineQrcode,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiArrowLeft,
  HiOutlineShare,
  HiOutlineClipboardCopy,
  HiOutlineInformationCircle,
  HiOutlineTicket,
  HiOutlineMail,
} from 'react-icons/hi';

/* ──────────────────────────────────────────────────────────────
   Design: "Festival day" (light theme) for the body.
   Hero section: full-bleed terracotta / glass design (Fraunces + DM Sans).
   Display: Bricolage Grotesque · Body: Figtree · Hero: Fraunces / DM Sans
   ────────────────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700;9..144,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

  .ev {
    --bg: #F7F5FB;
    --bg-2: #EFEBF7;
    --surface: #FFFFFF;
    --surface-2: #F3EFFA;
    --line: rgba(40,20,70,.10);
    --line-2: rgba(40,20,70,.18);
    --text: #1A1226;
    --text-2: #5A4E70;
    --text-3: #7A6E94;
    --accent: #B0245F;
    --accent-soft: #FCE7EF;
    --gold: #FFB627;
    --gold-ink: #2A1A00;
    --rose: #E8396B;
    --mint: #1FA463;
    --mint-soft: #DDF5E8;
    --amber: #F2A11D;
    --danger: #D93B3B;
    --grad: linear-gradient(120deg, #7A2A9B 0%, #C2336B 55%, #F2603F 100%);
    --shadow: 0 1px 2px rgba(40,20,70,.05), 0 12px 32px rgba(40,20,70,.08);
    --nav-h: 76px;

    font-family: 'Figtree', system-ui, -apple-system, sans-serif;
    color: var(--text);
    background: var(--bg);
    min-height: 100vh;
    padding-bottom: 96px;
    overflow-x: clip;
    -webkit-font-smoothing: antialiased;
  }
  .ev *, .ev *::before, .ev *::after { box-sizing: border-box; }
  .ev a { text-decoration: none; color: inherit; }
  .ev button { font-family: inherit; }
  .ev :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  .ev-wrap { max-width: 1240px; margin: 0 auto; padding: 0 20px; }
  @media (min-width: 768px) { .ev-wrap { padding: 0 32px; } }

  /* ───────── Hero (full-bleed, full-screen) ───────── */
  .ev-hero {
    position: relative;
    width: 100%;
    min-height: 100vh;
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    padding: 100px 0 28px;
    font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
    background: linear-gradient(135deg, #2A1209, #7A2E14 55%, #C94A23);
    isolation: isolate;
    overflow: hidden;
  }
  .ev-hero-in { width: 100%; max-width: 1240px; margin: 0 auto; padding: 0 20px; }
  @media (min-width: 768px) { .ev-hero-in { padding: 0 32px; } }

  .ev-slide { position: absolute; inset: 0; opacity: 0; transition: opacity .9s ease; z-index: -2; }
  .ev-slide.on { opacity: 1; }
  .ev-slide img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; transform: scale(1.06); transition: transform 7s ease-out; }
  .ev-slide.on img { transform: scale(1); }
  .ev-shade {
    position: absolute; inset: 0; z-index: -1;
    background:
      linear-gradient(180deg, rgba(14,9,6,.6) 0%, rgba(14,9,6,0) 26%),
      linear-gradient(0deg, rgba(14,9,6,.94) 0%, rgba(14,9,6,.7) 38%, rgba(14,9,6,.1) 72%, rgba(14,9,6,0) 100%);
  }

  .ev-hero-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .ev-hero-content { margin-top: auto; padding-top: 48px; }
  .ev-hero-body { animation: evRise .8s cubic-bezier(.2,.7,.2,1) both; max-width: 920px; }
  @keyframes evRise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }

  .ev .ev-hero h1 {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 700; letter-spacing: -0.03em;
    font-size: clamp(38px, 7vw, 88px); line-height: 1.02;
    margin: 18px 0 16px; overflow-wrap: anywhere; text-wrap: balance;
    color: #ffffff !important;
    text-shadow: 0 2px 30px rgba(0,0,0,.45);
  }
  .ev .ev-hero p.lead { font-size: clamp(16px, 1.6vw, 19px); line-height: 1.6; color: rgba(255,255,255,.9) !important; max-width: 640px; margin: 0; text-shadow: 0 1px 14px rgba(0,0,0,.4); }

  .ev-glass {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 18px; border-radius: 999px;
    background: rgba(255,255,255,.14);
    border: 1px solid rgba(255,255,255,.3);
    -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
    color: #fff; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: background .2s, transform .2s;
  }
  .ev-glass:hover { background: rgba(255,255,255,.28); }
  .ev-round { width: 48px; height: 48px; padding: 0; justify-content: center; }
  .ev-round:hover { transform: scale(1.06); }

  .ev-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .ev-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; font-size: 12.5px; font-weight: 600; white-space: nowrap; }
  .ev-chip.glass { background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.32); color: #fff; -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }
  .ev-chip.live { background: #fff; color: #4F7A4A; }
  .ev-chip.ongoing { background: #fff; color: #D9600F; }
  .ev-chip.done { background: rgba(255,255,255,.88); color: #5B5047; }
  .ev-chip.cancelled { background: #fff; color: #D32F2F; }
  .ev-chip.past { background: rgba(0,0,0,.55); color: rgba(255,255,255,.8); border: 1px solid rgba(255,255,255,.18); }
  .ev-chip.accent { background: var(--accent-soft); color: var(--accent); }

  /* Pagination — lives in the normal flow, so nothing can cover it */
  .ev-pager { display: flex; align-items: center; gap: 18px; margin: 36px 0 18px; }
  .ev-thumbs { position: relative; display: flex; gap: 10px; flex: 1; min-width: 0; overflow-x: auto; padding: 6px 4px; scrollbar-width: none; }
  .ev-thumbs::-webkit-scrollbar { display: none; }
  .ev-thumb { flex: 0 0 auto; width: 92px; height: 62px; padding: 0; border-radius: 14px; overflow: hidden; cursor: pointer; background: #000; border: 2px solid rgba(255,255,255,.25); opacity: .6; transition: opacity .25s, transform .25s, border-color .25s; }
  .ev-thumb:hover { opacity: .9; }
  .ev-thumb.on { opacity: 1; border-color: #fff; transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,.45); }
  .ev-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ev-pager-ctl { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .ev-count { font-size: 14px; font-weight: 600; color: #fff; min-width: 54px; text-align: center; font-variant-numeric: tabular-nums; }
  @media (max-width: 640px) {
    .ev-thumb { width: 68px; height: 48px; border-radius: 10px; }
    .ev-pager { gap: 10px; margin: 26px 0 14px; }
    .ev-round { width: 42px; height: 42px; }
    .ev-count { min-width: 44px; font-size: 13px; }
  }

  /* Facts — glass panel inside the hero, below the pagination */
  .ev-facts {
    background: rgba(20,13,9,.42);
    border: 1px solid rgba(255,255,255,.22);
    -webkit-backdrop-filter: blur(22px) saturate(1.3); backdrop-filter: blur(22px) saturate(1.3);
    border-radius: 24px;
    display: grid; grid-template-columns: 1fr;
    overflow: hidden;
  }
  @media (min-width: 900px) { .ev-facts { grid-auto-flow: column; grid-auto-columns: 1fr; } }
  .ev-fact { display: flex; align-items: center; gap: 14px; padding: 18px 22px; min-width: 0; color: #fff; }
  .ev-fact + .ev-fact { border-top: 1px solid rgba(255,255,255,.16); }
  @media (min-width: 900px) { .ev-fact + .ev-fact { border-top: 0; border-left: 1px solid rgba(255,255,255,.16); } }
  .ev-fact-ic { width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,.18); color: #fff; display: grid; place-items: center; flex-shrink: 0; }
  .ev-fact small { display: block; font-size: 12.5px; color: rgba(255,255,255,.7); margin-bottom: 2px; }
  .ev-fact b { display: block; font-size: 15.5px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ev-fact .sub { font-size: 12.5px; color: rgba(255,255,255,.75); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ev-maplink { margin-left: auto; flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #fff; padding: 9px 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,.35); transition: background .2s; }
  .ev-maplink:hover { background: rgba(255,255,255,.2); }

  /* ───────── Section nav ───────── */
  .ev-nav {
    position: sticky; top: var(--nav-h); z-index: 30;
    background: rgba(247,245,251,.88); -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px);
    border-bottom: 1px solid var(--line);
  }
  .ev-nav-in { display: flex; gap: 6px; overflow-x: auto; padding: 10px 0; scrollbar-width: none; }
  .ev-nav-in::-webkit-scrollbar { display: none; }
  .ev-nav a { flex: 0 0 auto; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 600; color: var(--text-2); transition: background .2s, color .2s; }
  .ev-nav a:hover { color: var(--text); background: rgba(40,20,70,.06); }
  .ev-nav a.on { background: var(--text); color: #fff; }

  /* ───────── Layout ───────── */
  .ev-grid { display: grid; grid-template-columns: 1fr; gap: 44px; margin-top: 44px; align-items: start; }
  @media (min-width: 1024px) { .ev-grid { grid-template-columns: minmax(0, 1fr) 390px; gap: 64px; } }
  .ev-main > * + * { margin-top: 64px; }
  .ev-main section { scroll-margin-top: calc(var(--nav-h) + 70px); }
  .ev-side { min-width: 0; }
  @media (min-width: 1024px) { .ev-side { position: sticky; top: calc(var(--nav-h) + 76px); } }

  .ev-h2 { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: clamp(26px, 3vw, 34px); letter-spacing: -0.03em; margin: 0 0 20px; display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px 14px; color: var(--text); }
  .ev-h2 span { font-family: 'Figtree', sans-serif; font-size: 14px; font-weight: 500; color: var(--text-3); letter-spacing: 0; }
  .ev-prose { font-size: 17px; line-height: 1.75; color: var(--text-2); white-space: pre-line; overflow-wrap: anywhere; max-width: 68ch; margin: 0; }
  .ev-link { background: none; border: 0; padding: 0; margin-top: 14px; color: var(--accent); font-weight: 700; font-size: 15px; cursor: pointer; }
  .ev-link:hover { text-decoration: underline; }

  .ev-culture { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow); }
  .ev-culture > div { background: var(--surface); padding: 20px 22px; }
  .ev-culture small { display: block; font-size: 13px; color: var(--text-3); margin-bottom: 4px; }
  .ev-culture b { font-size: 17px; font-weight: 600; }
  .ev-tip { display: flex; gap: 12px; align-items: flex-start; margin-top: 14px; padding: 18px 22px; border-radius: 20px; background: #FFF6DD; border: 1px solid #F5DFA0; color: #6B5314; font-size: 14.5px; line-height: 1.6; }
  .ev-tip svg { color: #B97A00; flex-shrink: 0; margin-top: 2px; }
  .ev-tip strong { color: #3F2F05; }

  .ev-timeline { list-style: none; margin: 0; padding: 0; position: relative; }
  .ev-timeline::before { content: ''; position: absolute; left: 107px; top: 14px; bottom: 14px; width: 2px; background: linear-gradient(180deg, #7A2A9B, #F2603F); opacity: .35; }
  .ev-tl { display: grid; grid-template-columns: 90px 34px 1fr; align-items: start; padding: 14px 0; }
  .ev-tl time { font-size: 14px; font-weight: 700; color: var(--accent); text-align: right; padding-top: 2px; font-variant-numeric: tabular-nums; }
  .ev-tl-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--bg); border: 3px solid var(--accent); margin: 4px auto 0; position: relative; z-index: 1; }
  .ev-tl b { display: block; font-size: 17px; font-weight: 600; }
  .ev-tl span { font-size: 14px; color: var(--text-3); }
  @media (max-width: 520px) {
    .ev-timeline::before { left: 67px; }
    .ev-tl { grid-template-columns: 50px 34px 1fr; }
    .ev-tl time { font-size: 12.5px; }
  }

  .ev-lineup { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
  .ev-artist { display: flex; align-items: center; gap: 14px; min-width: 0; padding: 14px; border-radius: 20px; background: var(--surface); border: 1px solid var(--line); box-shadow: var(--shadow); transition: border-color .2s, transform .2s; }
  .ev-artist:hover { border-color: var(--line-2); transform: translateY(-2px); }
  .ev-avatar { width: 60px; height: 60px; border-radius: 18px; object-fit: cover; flex-shrink: 0; background: var(--grad); color: #fff; display: grid; place-items: center; font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 24px; }
  .ev-artist b { display: block; font-size: 16px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ev-artist .role { display: block; font-size: 13px; color: var(--accent); font-weight: 600; margin-top: 1px; }
  .ev-artist .bio { font-size: 12.5px; color: var(--text-3); margin-top: 3px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

  .ev-amenities-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
  .ev-amenity-card { display: flex; align-items: flex-start; gap: 14px; padding: 16px 18px; border-radius: 18px; background: var(--surface); border: 1px solid var(--line); }
  .ev-amenity-icon { width: 42px; height: 42px; border-radius: 12px; background: var(--surface-2); display: grid; place-items: center; font-size: 21px; flex-shrink: 0; }
  .ev-amenity-card b { display: block; font-size: 15px; font-weight: 600; margin-bottom: 2px; }
  .ev-amenity-card p { font-size: 13px; color: var(--text-3); margin: 0; line-height: 1.45; }

  .ev-faq-list { display: flex; flex-direction: column; gap: 10px; }
  .ev-faq-item { background: var(--surface); border: 1px solid var(--line); border-radius: 18px; overflow: hidden; transition: border-color .2s, box-shadow .2s; }
  .ev-faq-item.open { border-color: rgba(176,36,95,.4); box-shadow: var(--shadow); }
  .ev-faq-q { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 18px 22px; background: none; border: none; text-align: left; font-size: 16px; font-weight: 600; color: var(--text); cursor: pointer; }
  .ev-faq-q:hover { color: var(--accent); }
  .ev-faq-chevron { flex-shrink: 0; color: var(--text-3); transition: transform .25s ease; }
  .ev-faq-item.open .ev-faq-chevron { transform: rotate(180deg); color: var(--accent); }
  .ev-faq-a { padding: 0 22px 20px; font-size: 14.5px; line-height: 1.7; color: var(--text-2); }

  .ev-tags { display: flex; flex-wrap: wrap; gap: 8px; }
  .ev-tag { font-size: 13px; font-weight: 600; color: var(--text-2); background: var(--surface); border: 1px solid var(--line); padding: 6px 14px; border-radius: 999px; }

  /* Passes */
  .ev-passes { border-radius: 28px; padding: 28px; background: linear-gradient(135deg, #FFF4D9, #FCE7EF); border: 1px solid #F5D9B8; }
  .ev-stubs { display: grid; gap: 14px; }
  .ev-stubcard { position: relative; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 22px 18px 28px; border-radius: 18px; background: #fff; border: 1px solid var(--line); box-shadow: var(--shadow); overflow: hidden; }
  .ev-stubcard::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: var(--grad); }
  .ev-stub-id { font-size: 13px; font-weight: 700; color: var(--accent); margin-bottom: 4px; letter-spacing: .02em; }
  .ev-stub-title { font-size: 16.5px; font-weight: 600; }
  .ev-stub-meta { font-size: 13px; color: var(--text-3); margin-top: 4px; }
  .ev-paid { display: inline-block; font-size: 12.5px; font-weight: 700; color: #0E6B3E; background: var(--mint-soft); padding: 3px 11px; border-radius: 999px; margin-top: 8px; }
  .ev-paid.pending { color: #8A5A00; background: #FFEDC2; }
  .ev-stub-side { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .ev-mini { height: 40px; padding: 0 16px; border-radius: 12px; font-size: 13.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; transition: all .15s; border: 1px solid transparent; }
  .ev-mini.primary { background: var(--text); color: #fff; }
  .ev-mini.primary:hover { background: var(--accent); }
  .ev-mini.icon { width: 40px; padding: 0; justify-content: center; background: var(--surface-2); border-color: var(--line); color: var(--text); }
  .ev-mini.icon:hover { border-color: var(--accent); color: var(--accent); background: #fff; }
  .ev-mini.ghost { background: transparent; border-color: var(--line-2); color: var(--text-2); }
  .ev-mini.ghost:hover { background: #FDECEC; color: var(--danger); border-color: #F5B5B5; }

  /* Booking card */
  .ev-book { background: var(--surface); border: 1px solid var(--line); border-radius: 28px; box-shadow: 0 2px 4px rgba(40,20,70,.05), 0 24px 56px rgba(40,20,70,.14); overflow: hidden; }
  .ev-book-head { position: relative; padding: 24px 28px; background: radial-gradient(120% 140% at 0% 0%, #FFE9B5, transparent 60%), #FFF8EC; border-bottom: 1px solid var(--line); }
  .ev-book-head small { font-size: 13.5px; font-weight: 500; color: var(--text-2); }
  .ev-price { font-family: 'Bricolage Grotesque', sans-serif; font-size: 46px; font-weight: 800; line-height: 1; letter-spacing: -0.04em; margin-top: 6px; }
  .ev-price.free { color: var(--mint); }
  .ev-early { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 14px; }
  .ev-early s { color: var(--text-3); }
  .ev-early span { background: var(--gold); color: var(--gold-ink); padding: 2px 9px; border-radius: 6px; font-weight: 700; font-size: 12px; }

  .ev-cd { padding: 18px 28px 0; }
  .ev-cd-label { font-size: 13.5px; font-weight: 600; color: var(--text-2); margin-bottom: 10px; }
  .ev-cd-digits { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; text-align: center; }
  .ev-cd-box { background: var(--bg); border-radius: 14px; padding: 10px 4px; border: 1px solid var(--line); }
  .ev-cd-num { font-family: 'Bricolage Grotesque', sans-serif; font-size: 24px; font-weight: 700; line-height: 1; display: block; font-variant-numeric: tabular-nums; color: var(--text); }
  .ev-cd-lbl { font-size: 12px; color: var(--text-3); margin-top: 4px; display: block; }
  .ev-past-banner { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-radius: 14px; background: var(--bg); border: 1px solid var(--line); font-size: 14px; font-weight: 600; color: var(--text-2); }
  .ev-past-banner svg { color: var(--text-3); flex-shrink: 0; }

  .ev-book-body { padding: 22px 28px 26px; display: grid; gap: 20px; }
  .ev-cap-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
  .ev-cap-row span:last-child { color: var(--text-3); font-weight: 500; }
  .ev-bar { width: 100%; height: 8px; background: var(--bg-2); border-radius: 99px; overflow: hidden; }
  .ev-bar i { display: block; height: 100%; border-radius: 99px; transition: width .7s ease; }
  .ev-qty-label { display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
  .ev-qty-label span { color: var(--text-3); font-weight: 500; font-size: 13px; }
  .ev-qty { display: flex; align-items: center; justify-content: space-between; background: var(--bg); border: 1px solid var(--line); border-radius: 18px; padding: 6px; }
  .ev-qty button { width: 46px; height: 46px; border-radius: 13px; border: 1px solid var(--line-2); background: #fff; font-size: 20px; font-weight: 600; color: var(--text); cursor: pointer; transition: all .15s; }
  .ev-qty button:hover:not(:disabled) { background: var(--text); color: #fff; border-color: var(--text); }
  .ev-qty button:disabled { opacity: .35; cursor: not-allowed; }
  .ev-qty div { text-align: center; line-height: 1.15; }
  .ev-qty div b { font-family: 'Bricolage Grotesque', sans-serif; font-size: 26px; }
  .ev-qty div span { display: block; font-size: 12.5px; color: var(--text-3); }
  .ev-total { display: flex; justify-content: space-between; align-items: baseline; font-size: 14.5px; color: var(--text-2); }
  .ev-total b { font-family: 'Bricolage Grotesque', sans-serif; font-size: 26px; color: var(--text); }
  .ev-btn { width: 100%; min-height: 56px; padding: 0 20px; border: 0; border-radius: 18px; background: var(--grad); color: #fff; font-size: 16px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; text-align: center; box-shadow: 0 12px 28px rgba(194,51,107,.35); transition: transform .2s, box-shadow .2s, filter .2s; }
  .ev-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 16px 36px rgba(194,51,107,.45); }
  .ev-btn:disabled { opacity: .65; cursor: not-allowed; box-shadow: none; }
  .ev-btn.muted { background: var(--bg-2); color: var(--text-3); opacity: 1; box-shadow: none; }
  .ev-spin { width: 18px; height: 18px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: evSpin .7s linear infinite; }
  @keyframes evSpin { to { transform: rotate(360deg); } }
  .ev-holding { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; color: #11803F; font-weight: 600; }
  .ev-holding a { text-decoration: underline; }

  .ev-side-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; position: relative; }
  .ev-action-btn { display: flex; align-items: center; justify-content: center; gap: 7px; padding: 12px 14px; border-radius: 16px; font-size: 14px; font-weight: 600; color: var(--text); background: var(--surface); border: 1px solid var(--line); cursor: pointer; transition: border-color .2s, color .2s; }
  .ev-action-btn:hover { border-color: var(--accent); color: var(--accent); }
  .ev-dropdown-menu { position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: #fff; border: 1px solid var(--line-2); border-radius: 18px; padding: 8px; box-shadow: 0 20px 44px rgba(40,20,70,.2); z-index: 40; display: flex; flex-direction: column; gap: 2px; animation: evPop .2s cubic-bezier(.34,1.56,.64,1); }
  .ev-dropdown-item { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 11px; font-size: 14px; font-weight: 600; color: var(--text); background: transparent; border: 0; cursor: pointer; text-align: left; width: 100%; }
  .ev-dropdown-item:hover { background: var(--surface-2); color: var(--accent); }

  .ev-host { margin-top: 14px; display: flex; gap: 14px; align-items: center; padding: 16px 18px; border-radius: 20px; border: 1px solid var(--line); background: var(--surface); }
  .ev-host .ev-avatar { width: 48px; height: 48px; font-size: 19px; border-radius: 50%; }
  .ev-host small { font-size: 13px; color: var(--text-3); display: block; }
  .ev-host b { font-size: 16px; display: block; }
  .ev-host .ver { display: inline-flex; gap: 4px; align-items: center; color: #11803F; font-size: 13px; font-weight: 600; }

  .ev-mbar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 50; padding: 12px 18px calc(12px + env(safe-area-inset-bottom, 0px)); background: rgba(255,255,255,.94); -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px); border-top: 1px solid var(--line-2); display: flex; align-items: center; gap: 16px; }
  .ev-mbar small { display: block; font-size: 12.5px; color: var(--text-3); }
  .ev-mbar strong { font-family: 'Bricolage Grotesque', sans-serif; font-size: 24px; }
  .ev-mbar .ev-btn { flex: 1; min-height: 50px; }
  @media (min-width: 1024px) { .ev-mbar { display: none; } }

  /* Modals */
  .ev-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(26,18,38,.6); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); display: flex; padding: 16px; overflow-y: auto; animation: evFade .2s ease; }
  .ev-overlay > * { margin: auto; }
  @keyframes evFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes evPop { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: none; } }
  .ev-confirm { background: #fff; border-radius: 28px; padding: 32px; max-width: 410px; width: 100%; text-align: center; box-shadow: 0 30px 80px rgba(20,10,40,.4); animation: evPop .25s cubic-bezier(.34,1.56,.64,1); }
  .ev-confirm h3 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 26px; margin: 14px 0 8px; }
  .ev-confirm p { font-size: 15px; line-height: 1.6; color: var(--text-2); margin: 0 0 24px; }
  .ev-confirm-ic { width: 60px; height: 60px; border-radius: 50%; background: #FDECEC; display: grid; place-items: center; margin: 0 auto; font-size: 26px; }
  .ev-confirm-row { display: flex; gap: 12px; }
  .ev-confirm-row button { flex: 1; height: 50px; border-radius: 14px; font-weight: 700; font-size: 15px; cursor: pointer; }
  .ev-keep { background: #fff; border: 1.5px solid var(--line-2); color: var(--text); }
  .ev-keep:hover { border-color: var(--text); }
  .ev-danger { background: var(--danger); border: 0; color: #fff; }
  .ev-danger:hover { filter: brightness(.92); }

  .ev-ticket { max-width: 400px; width: 100%; filter: drop-shadow(0 30px 50px rgba(20,10,40,.45)); animation: evPop .28s cubic-bezier(.34,1.56,.64,1); }
  .ev-ticket-top {
    position: relative; padding: 26px 24px 34px; text-align: center; color: #fff;
    background: linear-gradient(140deg, #5B1E7A 0%, #C2336B 55%, #FF7A59 100%);
    border-radius: 28px 28px 0 0;
    -webkit-mask: radial-gradient(circle 14px at 0 100%, transparent 98%, #000) left / 51% 100% no-repeat, radial-gradient(circle 14px at 100% 100%, transparent 98%, #000) right / 51% 100% no-repeat;
    mask: radial-gradient(circle 14px at 0 100%, transparent 98%, #000) left / 51% 100% no-repeat, radial-gradient(circle 14px at 100% 100%, transparent 98%, #000) right / 51% 100% no-repeat;
  }
  .ev-ticket-top h3 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 27px; margin: 12px 0 4px; }
  .ev-ticket-top p { font-size: 13.5px; color: rgba(255,255,255,.85); margin: 0; letter-spacing: .04em; }
  .ev-ticket-close { position: absolute; top: 14px; right: 14px; width: 34px; height: 34px; border-radius: 50%; border: 0; background: rgba(255,255,255,.2); color: #fff; display: grid; place-items: center; cursor: pointer; }
  .ev-ticket-close:hover { background: rgba(255,255,255,.34); }
  .ev-ticket-bottom {
    position: relative; padding: 34px 24px 24px; background: #fff; color: var(--text); text-align: center; border-radius: 0 0 28px 28px; display: grid; gap: 16px;
    -webkit-mask: radial-gradient(circle 14px at 0 0, transparent 98%, #000) left / 51% 100% no-repeat, radial-gradient(circle 14px at 100% 0, transparent 98%, #000) right / 51% 100% no-repeat;
    mask: radial-gradient(circle 14px at 0 0, transparent 98%, #000) left / 51% 100% no-repeat, radial-gradient(circle 14px at 100% 0, transparent 98%, #000) right / 51% 100% no-repeat;
  }
  .ev-ticket-bottom::before { content: ''; position: absolute; top: 0; left: 22px; right: 22px; border-top: 2px dashed #D9CFE6; }
  .ev-ticket-bottom h4 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 22px; line-height: 1.2; margin: 0 0 8px; }
  .ev-tline { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 14px; color: #5B4F70; margin-top: 3px; }
  .ev-tline svg { color: #C2336B; flex-shrink: 0; }
  .ev-pills { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
  .ev-pill { padding: 5px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; background: #F1EAF8; color: #3A2B54; }
  .ev-pill.ok { background: #D8F5E6; color: #0E6B3E; }
  .ev-qr { display: inline-block; margin: 0 auto; padding: 14px; border-radius: 20px; background: #fff; border: 2px solid #EDE5F5; box-shadow: 0 8px 24px rgba(40,20,70,.12); }
  .ev-qr img { width: 184px; height: 184px; display: block; }
  .ev-valid { display: flex; justify-content: center; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 600; color: #0E6B3E; }
  .ev-valid i { width: 8px; height: 8px; border-radius: 50%; background: #1FA463; animation: evPulse 1.6s ease-in-out infinite; }
  @keyframes evPulse { 50% { opacity: .3; } }
  .ev-pending { padding: 14px; border-radius: 14px; background: #FFF4D6; border: 1px solid #F0DDA0; color: #7A5C0A; font-size: 14px; }
  .ev-attendee { font-size: 13.5px; color: #6E6285; margin: 0; }

  /* Suggestions */
  .ev-suggestions { margin-top: 96px; padding-top: 56px; border-top: 1px solid var(--line-2); }
  .ev-suggestions-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 32px; }
  .ev-suggestions-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: clamp(30px, 4vw, 44px); font-weight: 800; letter-spacing: -0.035em; margin: 12px 0 0; line-height: 1.05; }
  .ev-suggestions-sub { font-size: 15.5px; color: var(--text-2); margin: 8px 0 0; }
  .ev-more-link { display: inline-flex; align-items: center; gap: 6px; font-size: 14.5px; font-weight: 600; color: var(--text); padding: 10px 20px; border-radius: 999px; background: var(--surface); border: 1px solid var(--line-2); transition: all .2s ease; white-space: nowrap; }
  .ev-more-link:hover { background: var(--text); color: #fff; border-color: var(--text); }
  .ev-suggestions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 24px; }
  .ev-skeleton-card { height: 380px; border-radius: 22px; background: linear-gradient(90deg, #ECE7F5 0%, #F7F4FC 50%, #ECE7F5 100%); background-size: 200% 100%; animation: evShimmer 1.5s infinite; border: 1px solid var(--line); }
  @keyframes evShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  @media (prefers-reduced-motion: reduce) {
    .ev *, .ev-overlay, .ev-overlay * { animation-duration: .01ms !important; transition-duration: .01ms !important; }
  }
`;

const EventDetails = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [ticketModal, setTicketModal] = useState(null);
  const [regToCancel, setRegToCancel] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [imageUrls, setImageUrls] = useState([]);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [ticketsCount, setTicketsCount] = useState(1);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('about');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [emailRecipient, setEmailRecipient] = useState('');

  const blobUrlsRef = useRef([]);
  const thumbsRef = useRef(null);
  const touchX = useRef(null);
  const actionsRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setCalendarOpen(false);
        setShareOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Countdown
  useEffect(() => {
    if (!event?.date) return;
    const calculateTime = () => {
      const diff = new Date(event.date).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
          isPast: false,
        });
      }
    };
    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [event?.date]);

  // Suggestions loader
  const loadSuggestions = async (targetEvent) => {
    if (!targetEvent?._id) return;
    setRelatedLoading(true);
    try {
      let filtered = [];
      if (targetEvent.category) {
        const res = await getAllEvents({ category: targetEvent.category, limit: 8 });
        const list = res.data?.data?.events || [];
        filtered = list.filter((e) => e._id !== targetEvent._id);
      }
      if (filtered.length < 4) {
        const fallbackRes = await getAllEvents({ limit: 10, sortBy: 'popularity' });
        const allOther = fallbackRes.data?.data?.events || [];
        const extras = allOther.filter(
          (e) => e._id !== targetEvent._id && !filtered.some((f) => f._id === e._id)
        );
        filtered = [...filtered, ...extras];
      }
      setRelatedEvents(filtered.slice(0, 4));
    } catch (err) {
      console.error('Failed to load related event suggestions:', err);
    } finally {
      setRelatedLoading(false);
    }
  };

  // Load event
  useEffect(() => {
    let cancelled = false;

    const fetchEvent = async () => {
      setLoading(true);
      setShowFullDesc(false);
      setTicketsCount(1);
      setTicketModal(null);
      setRegToCancel(null);

      try {
        const res = await getEventById(id);
        const ev = res.data.data.event;
        if (cancelled) return;
        setEvent(ev);
        setActiveImage(0);

        if (ev.images && ev.images.length > 0) {
          const firstImg = ev.images[0];
          if (typeof firstImg === 'string' || (firstImg && firstImg.url)) {
            const urls = ev.images
              .map((img) => (typeof img === 'string' ? img : img?.url))
              .filter(Boolean);
            setImageUrls(urls);
          } else {
            const urls = await Promise.all(
              ev.images.map((_, index) =>
                getEventImage(id, index)
                  .then((r) => blobToObjectUrl(r.data))
                  .catch(() => null)
              )
            );
            const valid = urls.filter(Boolean);
            blobUrlsRef.current = valid;
            if (cancelled) {
              valid.forEach((u) => revokeObjectUrl(u));
              return;
            }
            setImageUrls(valid);
          }
        } else if (ev.thumbnailUrl) {
          setImageUrls([ev.thumbnailUrl]);
        }

        loadSuggestions(ev);
      } catch (err) {
        if (cancelled) return;
        toast.error('Failed to load event details');
        navigate('/events');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchEvent();

    return () => {
      cancelled = true;
      blobUrlsRef.current.forEach((url) => {
        if (url && url.startsWith('blob:')) revokeObjectUrl(url);
      });
      blobUrlsRef.current = [];
    };
  }, [id, navigate]);

  // Lock scroll while a modal is open
  useEffect(() => {
    if (!ticketModal && !regToCancel) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [ticketModal, regToCancel]);

  // Escape closes modals
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setTicketModal(null);
        setRegToCancel(null);
        setCalendarOpen(false);
        setShareOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Keep active thumbnail centred
  useEffect(() => {
    const c = thumbsRef.current;
    const el = c?.children[activeImage];
    if (c && el) {
      c.scrollTo({ left: el.offsetLeft - c.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
    }
  }, [activeImage, imageUrls.length]);

  // Arrow keys move through gallery
  useEffect(() => {
    if (imageUrls.length < 2 || ticketModal || regToCancel) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setActiveImage((p) => (p + 1) % imageUrls.length);
      if (e.key === 'ArrowLeft') setActiveImage((p) => (p - 1 + imageUrls.length) % imageUrls.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imageUrls.length, ticketModal, regToCancel]);

  // Registrations
  const fetchRegistrations = async () => {
    if (!user) {
      setUserRegistrations([]);
      return;
    }
    try {
      let regs = [];
      try {
        const res = await getMyRegistrationsForEvent(id);
        regs = res.data.data.registrations || [];
      } catch (e) {
        const res = await getMyRegistrations();
        const allRegs = res.data.data.registrations || [];
        regs = allRegs.filter((r) => r.event?._id === id || r.event === id);
      }
      setUserRegistrations(regs);
    } catch (err) {
      console.error('Failed to check registrations:', err);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Section tabs (scroll-spy)
  const sections = useMemo(() => {
    if (!event) return [];
    const list = [{ id: 'about', label: 'About' }];
    if (event.schedule?.length > 0) list.push({ id: 'schedule', label: 'Schedule' });
    if (event.performers?.length > 0) list.push({ id: 'lineup', label: 'Performers' });
    list.push({ id: 'venue', label: 'Venue' }, { id: 'faq', label: 'FAQ' });
    return list;
  }, [event]);

  useEffect(() => {
    if (!sections.length) return undefined;
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (!els.length) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-25% 0px -60% 0px' }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  const handleRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setRegistering(true);
    try {
      const res = await registerForEvent({ eventId: id, ticketsCount });
      const data = res.data.data;

      if (data.registration) {
        toast.success(`Reserved ${ticketsCount} pass${ticketsCount > 1 ? 'es' : ''}! 🎉`);
        setUserRegistrations((prev) => [data.registration, ...prev]);
        setEvent((prev) => ({
          ...prev,
          registeredCount: (prev?.registeredCount || 0) + ticketsCount,
        }));
        setTicketModal(data.registration);
        setTicketsCount(1);
        return;
      }

      if (data.orderId) {
        navigate(`/payment/${data.registrationId}`, {
          state: {
            orderId: data.orderId,
            amount: data.amount,
            currency: data.currency,
            event,
            keyId: data.keyId,
          },
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async (registration) => {
    if (!registration) return;
    try {
      await cancelRegistration(registration._id);
      toast.success('Booking cancelled successfully');
      const ticketsRefunded = registration.ticketsCount || 1;
      setUserRegistrations((prev) =>
        prev.map((r) => (r._id === registration._id ? { ...r, status: 'cancelled' } : r))
      );
      setEvent((prev) => ({
        ...prev,
        registeredCount: Math.max(0, (prev?.registeredCount || 0) - ticketsRefunded),
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setRegToCancel(null);
    }
  };

  const handleDownloadTicket = (reg) => {
    if (!reg?.qrCode) {
      toast.error('QR code not available for download');
      return;
    }
    const link = document.createElement('a');
    link.href = reg.qrCode;
    const sanitizedTitle = (event?.title || 'event').toLowerCase().replace(/[^a-z0-9]/g, '-');
    link.download = `eventverse-ticket-${sanitizedTitle}-${reg._id?.slice(-6)}.png`;
    link.click();
    toast.success('QR Ticket downloaded! 🎟️');
  };

  const handleSendEmailTicket = async (reg, customEmail) => {
    if (!reg?._id) return;
    const targetEmail = (customEmail || emailRecipient || user?.email || '').trim();
    if (!targetEmail) {
      toast.error('Please specify a valid email address');
      return;
    }
    setSendingEmailId(reg._id);
    try {
      const res = await sendTicketEmail(reg._id, targetEmail);
      toast.success(
        res.data?.message || `Ticket sent to ${targetEmail}! Please check your Inbox and Spam folder. ✉️`,
        { duration: 6000 }
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send ticket email');
    } finally {
      setSendingEmailId(null);
    }
  };

  // Calendar
  const getTimes = () => {
    const start = new Date(event.date);
    const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 4 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    return { start, end, fmt };
  };

  const handleGoogleCalendar = () => {
    if (!event) return;
    const { start, end, fmt } = getTimes();
    const dates = `${fmt(start)}/${fmt(end)}`;
    const title = encodeURIComponent(event.title || 'EventVerse Cultural Celebration');
    const details = encodeURIComponent(`${event.shortDescription || event.title}\n\nVenue: ${event.venue}, ${event.city}\nBooking: ${window.location.href}`);
    const location = encodeURIComponent(`${event.venue || ''}, ${event.city || ''}`);
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`, '_blank');
    setCalendarOpen(false);
  };

  const handleDownloadIcs = () => {
    if (!event) return;
    const { start, end, fmt } = getTimes();
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EventVerse//Cultural Festivals//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:eventverse-${event._id}@eventverse.com`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${(event.title || 'Event').replace(/,/g, '\\,')}`,
      `DESCRIPTION:${(event.shortDescription || event.title).replace(/\n/g, ' ')}`,
      `LOCATION:${(event.venue + ', ' + event.city).replace(/,/g, '\\,')}`,
      `URL:${window.location.href}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const safeName = (event.title || 'event').toLowerCase().replace(/[^a-z0-9]/g, '-');
    link.download = `${safeName}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Calendar (.ics) invite downloaded! 📅');
    setCalendarOpen(false);
  };

  // Share
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Event link copied to clipboard! 📋');
    setShareOpen(false);
  };

  const handleShareWhatsApp = () => {
    const text = `Join me at ${event.title} in ${event.city}! Check details and reserve tickets:\n${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    setShareOpen(false);
  };

  const handleShareTwitter = () => {
    const text = `Excited for ${event.title}! 🪔✨ Join the celebration:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
    setShareOpen(false);
  };

  if (loading) return <FullscreenLoader />;
  if (!event) return null;

  const isSoldOut = event.registeredCount >= event.capacity;
  const spotsLeft = Math.max(0, event.capacity - event.registeredCount);
  const spotsPercent = event.capacity ? Math.min(100, (event.registeredCount / event.capacity) * 100) : 0;
  const maxPerOrder = Math.min(5, spotsLeft);

  const activeRegistrations = userRegistrations.filter((r) => r.status !== 'cancelled');
  const totalBookedTickets = activeRegistrations.reduce((acc, r) => acc + (r.ticketsCount || 1), 0);

  const isEarlyBird =
    event.earlyBirdPrice && event.earlyBirdDeadline && new Date() < new Date(event.earlyBirdDeadline);

  const displayPrice = isEarlyBird ? event.earlyBirdPrice : event.price;
  const isFreeEvent = event.isFree || event.price === 0;
  const allImages = imageUrls;
  const safeActive = activeImage < allImages.length ? activeImage : 0;

  const isPastDate = event.date ? new Date(event.date) < new Date() : false;
  const canBook = event.status === 'upcoming' && !isSoldOut && !isPastDate;
  const go = (dir) => setActiveImage((safeActive + dir + allImages.length) % allImages.length);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const statusChip = (status) => {
    if (isPastDate && status === 'upcoming') return <span className="ev-chip past">⌛ Event ended</span>;
    switch (status) {
      case 'upcoming':
        return <span className="ev-chip live">● Upcoming</span>;
      case 'ongoing':
        return <span className="ev-chip ongoing">● Happening now</span>;
      case 'completed':
        return <span className="ev-chip done">Completed</span>;
      case 'cancelled':
        return <span className="ev-chip cancelled">Cancelled</span>;
      default:
        return null;
    }
  };

  const ctaLabel = isFreeEvent
    ? totalBookedTickets > 0
      ? `Reserve ${ticketsCount} more free pass${ticketsCount > 1 ? 'es' : ''}`
      : `Reserve ${ticketsCount} free pass${ticketsCount > 1 ? 'es' : ''}`
    : totalBookedTickets > 0
      ? `Book ${ticketsCount} more • ₹${displayPrice * ticketsCount}`
      : `Book ${ticketsCount} ticket${ticketsCount > 1 ? 's' : ''} • ₹${displayPrice * ticketsCount}`;

  const scrollToBooking = () =>
    document.getElementById('ev-book')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const jump = (e, sid) => {
    e.preventDefault();
    document.getElementById(sid)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(sid);
  };

  const faqs = [
    { q: 'Can I book multiple passes for my group or family?', a: 'Yes! You can book tickets multiple times. Each order generates individual digital passes with verified QR codes that appear right here under "Your passes".' },
    { q: 'How do I present my ticket at the entrance?', a: 'Open your digital pass from this page on your phone, or save the PNG QR code to your gallery. Entrance staff scan the QR code straight from your screen.' },
    { q: 'What is the cancellation policy?', a: 'You can cancel any booking free of charge before the event starts, directly from your passes list. Cancelled seats are released to other attendees immediately.' },
    { q: 'What are the gate timings and arrival recommendations?', a: 'Gates typically open 60 minutes before the start time. Arrive at least 30 minutes early so QR scanning goes smoothly and you can explore the grounds.' },
    { q: 'Are personal cameras, smartphones, and bags allowed?', a: 'Smartphones and small bags are permitted in all zones. Professional filming rigs and heavy tripods need prior organizer accreditation.' },
  ];

  const amenities = [
    { icon: '🅿️', title: 'Designated parking', desc: 'Secure valet and general attendee parking zones' },
    { icon: '♿', title: 'Accessible entrance', desc: 'Step-free ramp access and priority seating help' },
    { icon: '🍛', title: 'Artisan food stalls', desc: 'Authentic local cuisines, snacks, and beverages' },
    { icon: '📸', title: 'Photography allowed', desc: 'Smartphones and handheld cameras welcome' },
    { icon: '🛡️', title: 'Medical & first aid', desc: 'Trained first-aid responders on-site' },
    { icon: '🎟️', title: 'Instant QR entry', desc: 'Paperless admission straight from your phone' },
    { icon: '🧥', title: 'Cloakroom & bag drop', desc: 'Secure bag holding near the entrance' },
    { icon: '🌦️', title: 'All-weather pavilion', desc: 'Covered seating and shaded exhibits' },
  ];

  return (
    <div className="ev">
      <style>{styles}</style>

      {/* ───────── Hero: full-screen, edge to edge ───────── */}
      <header
        className="ev-hero"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current == null || allImages.length < 2) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
      >
        {allImages.map((src, i) => (
          <div key={i} className={`ev-slide${i === safeActive ? ' on' : ''}`}>
            <img src={src} alt={i === safeActive ? event.title : ''} />
          </div>
        ))}
        <div className="ev-shade" />

        <div className="ev-hero-in ev-hero-top">
          <Link to="/events" className="ev-glass">
            <HiArrowLeft size={16} />
            <span>All events</span>
          </Link>
          {statusChip(event.status)}
        </div>

        <div className="ev-hero-in ev-hero-content">
          <div className="ev-hero-body">
            <div className="ev-chips">
              <span className="ev-chip glass">{event.category}</span>
              {event.culturalOrigin && <span className="ev-chip glass">{event.culturalOrigin}</span>}
              {event.city && <span className="ev-chip glass">📍 {event.city}</span>}
            </div>
            <h1>{event.title}</h1>
            {event.shortDescription && <p className="lead">{event.shortDescription}</p>}
          </div>

          {allImages.length > 1 && (
            <div className="ev-pager">
              <div className="ev-thumbs" ref={thumbsRef}>
                {allImages.map((src, i) => (
                  <button
                    key={i}
                    className={`ev-thumb${i === safeActive ? ' on' : ''}`}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Show photo ${i + 1}`}
                    aria-current={i === safeActive}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
              <div className="ev-pager-ctl">
                <button className="ev-glass ev-round" aria-label="Previous photo" onClick={() => go(-1)}>
                  <HiChevronLeft size={22} />
                </button>
                <span className="ev-count">{safeActive + 1} / {allImages.length}</span>
                <button className="ev-glass ev-round" aria-label="Next photo" onClick={() => go(1)}>
                  <HiChevronRight size={22} />
                </button>
              </div>
            </div>
          )}

          <section className="ev-facts" aria-label="Event details" style={allImages.length > 1 ? undefined : { marginTop: 32 }}>
            <div className="ev-fact">
              <div className="ev-fact-ic"><HiOutlineCalendar size={20} /></div>
              <div style={{ minWidth: 0 }}>
                <small>Date</small>
                <b>{formatDate(event.date)}</b>
                {isPastDate && <div className="sub">This event has ended</div>}
              </div>
            </div>

            {event.time && (
              <div className="ev-fact">
                <div className="ev-fact-ic"><HiOutlineClock size={20} /></div>
                <div style={{ minWidth: 0 }}>
                  <small>Starts</small>
                  <b>{event.time}</b>
                  {event.duration && <div className="sub">{event.duration}</div>}
                </div>
              </div>
            )}

            <div className="ev-fact">
              <div className="ev-fact-ic"><HiOutlineLocationMarker size={20} /></div>
              <div style={{ minWidth: 0 }}>
                <small>Venue</small>
                <b>{event.venue}</b>
                <div className="sub">
                  {event.address ? `${event.address}, ` : ''}{event.city}{event.state ? `, ${event.state}` : ''}
                </div>
              </div>
              <a
                className="ev-maplink"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue + ' ' + event.city)}`}
                target="_blank"
                rel="noreferrer"
              >
                <HiOutlineMap size={16} />
                <span>Map</span>
              </a>
            </div>
          </section>
        </div>
      </header>

      {/* ───────── Sticky section nav ───────── */}
      <nav className="ev-nav" aria-label="Page sections">
        <div className="ev-wrap ev-nav-in">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={activeSection === s.id ? 'on' : ''}
              aria-current={activeSection === s.id ? 'true' : undefined}
              onClick={(e) => jump(e, s.id)}
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="ev-wrap">
        <div className="ev-grid">
          <main className="ev-main">

            {/* Your passes */}
            {activeRegistrations.length > 0 && (
              <section className="ev-passes" id="ev-passes">
                <h2 className="ev-h2">
                  Your passes
                  <span>{totalBookedTickets} {totalBookedTickets === 1 ? 'ticket' : 'tickets'} confirmed</span>
                </h2>
                <div className="ev-stubs">
                  {activeRegistrations.map((reg) => {
                    const ok = reg.paymentStatus === 'paid' || reg.paymentStatus === 'free';
                    const count = reg.ticketsCount || 1;
                    return (
                      <article key={reg._id} className="ev-stubcard">
                        <div className="ev-stub-main">
                          <div className="ev-stub-id">Pass #{reg._id?.slice(-6).toUpperCase()}</div>
                          <div className="ev-stub-title">
                            {count} {count === 1 ? 'ticket' : 'tickets'} ·{' '}
                            {reg.ticketType === 'early-bird' ? 'Early bird' : reg.ticketType === 'vip' ? 'VIP' : 'General entry'}
                          </div>
                          <div className="ev-stub-meta">
                            Booked {new Date(reg.createdAt || reg.registeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {reg.totalAmount > 0 ? ` · ₹${reg.totalAmount}` : ''}
                          </div>
                          <span className={`ev-paid${ok ? '' : ' pending'}`}>
                            {reg.paymentStatus === 'free' ? 'Free pass' : reg.paymentStatus === 'paid' ? 'Paid' : reg.paymentStatus}
                          </span>
                        </div>
                        <div className="ev-stub-side">
                          <button className="ev-mini primary" onClick={() => setTicketModal(reg)}>
                            <HiOutlineQrcode size={16} /> Show QR
                          </button>
                          {reg.qrCode && (
                            <button className="ev-mini icon" onClick={() => handleDownloadTicket(reg)} aria-label="Download ticket" title="Download ticket (PNG)">
                              <HiOutlineDownload size={16} />
                            </button>
                          )}
                          <button
                            className="ev-mini icon"
                            onClick={() => handleSendEmailTicket(reg)}
                            disabled={sendingEmailId === reg._id}
                            aria-label="Email ticket"
                            title="Send ticket to your email"
                          >
                            <HiOutlineMail size={16} />
                          </button>
                          <button className="ev-mini ghost" onClick={() => setRegToCancel(reg)}>Cancel</button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* About */}
            <section id="about">
              <h2 className="ev-h2">About this event</h2>
              <p className="ev-prose">
                {showFullDesc || (event.description?.length || 0) <= 350
                  ? event.description
                  : `${event.description?.substring(0, 350)}…`}
              </p>
              {event.description?.length > 350 && (
                <button className="ev-link" onClick={() => setShowFullDesc(!showFullDesc)}>
                  {showFullDesc ? 'Show less' : 'Read the full description'}
                </button>
              )}

              <h2 className="ev-h2" style={{ marginTop: 44 }}>
                Cultural context
                <span>Heritage &amp; traditions</span>
              </h2>
              <div className="ev-culture">
                <div>
                  <small>Cultural origin</small>
                  <b>{event.culturalOrigin || 'Traditional heritage'}</b>
                </div>
                <div>
                  <small>Category</small>
                  <b>{event.category}</b>
                </div>
                <div>
                  <small>Primary language</small>
                  <b>{event.language || 'English & regional'}</b>
                </div>
              </div>
              <div className="ev-tip">
                <HiOutlineInformationCircle size={22} />
                <div>
                  <strong>What to wear:</strong> Festive Indian or comfortable semi-formal ethnic attire is warmly encouraged. Bring comfortable footwear for exploring the open grounds.
                </div>
              </div>
            </section>

            {/* Schedule */}
            {event.schedule?.length > 0 && (
              <section id="schedule">
                <h2 className="ev-h2">Schedule</h2>
                <ol className="ev-timeline">
                  {event.schedule.map((s, i) => (
                    <li key={i} className="ev-tl">
                      <time>{s.time}</time>
                      <i className="ev-tl-dot" />
                      <div>
                        <b>{s.activity}</b>
                        {s.performer && <span>{s.performer}</span>}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Lineup */}
            {event.performers?.length > 0 && (
              <section id="lineup">
                <h2 className="ev-h2">
                  Artists &amp; performers
                  <span>{event.performers.length} featured</span>
                </h2>
                <div className="ev-lineup">
                  {event.performers.map((p, i) => (
                    <div key={i} className="ev-artist">
                      {p.image ? (
                        <img className="ev-avatar" src={p.image} alt={p.name} />
                      ) : (
                        <div className="ev-avatar">{p.name?.charAt(0)}</div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <b>{p.name}</b>
                        {p.role && <span className="role">{p.role}</span>}
                        {p.bio && <div className="bio">{p.bio}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Venue */}
            <section id="venue">
              <h2 className="ev-h2">
                Venue amenities
                <span>What to expect on the ground</span>
              </h2>
              <div className="ev-amenities-grid">
                {amenities.map((item, index) => (
                  <div key={index} className="ev-amenity-card">
                    <div className="ev-amenity-icon">{item.icon}</div>
                    <div>
                      <b>{item.title}</b>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section id="faq">
              <h2 className="ev-h2">
                Frequently asked questions
              </h2>
              <div className="ev-faq-list">
                {faqs.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div key={index} className={`ev-faq-item${isOpen ? ' open' : ''}`}>
                      <button
                        className="ev-faq-q"
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        aria-expanded={isOpen}
                      >
                        <span>{faq.q}</span>
                        <HiChevronDown size={20} className="ev-faq-chevron" />
                      </button>
                      {isOpen && <div className="ev-faq-a">{faq.a}</div>}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Tags */}
            {event.tags?.length > 0 && (
              <div className="ev-tags">
                {event.tags.map((tag, i) => (
                  <span key={i} className="ev-tag">#{tag}</span>
                ))}
              </div>
            )}
          </main>

          {/* ───────── Sidebar ───────── */}
          <aside className="ev-side">
            <div className="ev-book" id="ev-book">
              <div className="ev-book-head">
                <small>{isFreeEvent ? 'Entry' : 'Price per ticket'}</small>
                {isFreeEvent ? (
                  <div className="ev-price free">Free</div>
                ) : (
                  <>
                    <div className="ev-price">₹{displayPrice}</div>
                    {isEarlyBird && (
                      <div className="ev-early">
                        <s>₹{event.price}</s>
                        <span>Early bird</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="ev-cd">
                {isPastDate ? (
                  <div className="ev-past-banner">
                    <HiOutlineCalendar size={18} />
                    <span>This event took place on {formatDate(event.date)}</span>
                  </div>
                ) : (
                  <>
                    <div className="ev-cd-label">
                      {timeLeft.isPast ? '🟠 The festival is underway' : 'Starts in'}
                    </div>
                    <div className="ev-cd-digits">
                      {[
                        ['Days', timeLeft.days],
                        ['Hours', timeLeft.hours],
                        ['Mins', timeLeft.minutes],
                        ['Secs', timeLeft.seconds],
                      ].map(([label, val]) => (
                        <div className="ev-cd-box" key={label}>
                          <span className="ev-cd-num">{timeLeft.isPast ? '00' : String(val).padStart(2, '0')}</span>
                          <span className="ev-cd-lbl">{label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="ev-book-body">
                <div>
                  <div className="ev-cap-row">
                    <span style={{ color: isSoldOut ? 'var(--danger)' : undefined }}>
                      {isSoldOut ? 'Sold out' : `${spotsLeft} spots left`}
                    </span>
                    <span>of {event.capacity}</span>
                  </div>
                  <div
                    className="ev-bar"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(spotsPercent)}
                    aria-label="Capacity filled"
                  >
                    <i
                      style={{
                        width: `${spotsPercent}%`,
                        background: spotsPercent > 85 ? 'var(--rose)' : spotsPercent > 60 ? 'var(--amber)' : 'var(--mint)',
                      }}
                    />
                  </div>
                </div>

                {canBook && (
                  <div>
                    <div className="ev-qty-label">
                      {totalBookedTickets > 0 ? 'Add more tickets' : 'Tickets'}
                      <span>Up to {maxPerOrder} per order</span>
                    </div>
                    <div className="ev-qty">
                      <button
                        onClick={() => setTicketsCount((p) => Math.max(1, p - 1))}
                        disabled={ticketsCount <= 1}
                        aria-label="Decrease tickets"
                      >
                        −
                      </button>
                      <div>
                        <b>{ticketsCount}</b>
                        <span>{ticketsCount === 1 ? 'ticket' : 'tickets'}</span>
                      </div>
                      <button
                        onClick={() => setTicketsCount((p) => Math.min(maxPerOrder, p + 1))}
                        disabled={ticketsCount >= maxPerOrder}
                        aria-label="Increase tickets"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {canBook && !isFreeEvent && event.price > 0 && (
                  <div className="ev-total">
                    <span>Total</span>
                    <b>₹{displayPrice * ticketsCount}</b>
                  </div>
                )}

                {isPastDate ? (
                  <button disabled className="ev-btn muted">⌛ Booking closed</button>
                ) : event.status !== 'upcoming' ? (
                  <button disabled className="ev-btn muted">Registration closed</button>
                ) : isSoldOut ? (
                  <button disabled className="ev-btn muted">Sold out</button>
                ) : authLoading ? (
                  <button disabled className="ev-btn"><span className="ev-spin" /> Loading…</button>
                ) : !user ? (
                  <Link to="/login" className="ev-btn"><HiOutlineTicket size={20} /> Log in to book</Link>
                ) : (
                  <button onClick={handleRegister} disabled={registering} className="ev-btn">
                    {registering ? (<><span className="ev-spin" /> Processing…</>) : (<><HiOutlineTicket size={20} /> {ctaLabel}</>)}
                  </button>
                )}

                {totalBookedTickets > 0 && (
                  <div className="ev-holding">
                    <HiCheckCircle size={18} />
                    <span>
                      You have {totalBookedTickets} {totalBookedTickets === 1 ? 'ticket' : 'tickets'} ·{' '}
                      <a href="#ev-passes">view passes</a>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="ev-side-actions" ref={actionsRef}>
              <button
                className="ev-action-btn"
                onClick={() => { setCalendarOpen(!calendarOpen); setShareOpen(false); }}
                aria-label="Add to calendar"
                aria-expanded={calendarOpen}
              >
                <HiOutlineCalendar size={17} />
                <span>Calendar</span>
                <HiChevronDown size={14} />
              </button>

              <button
                className="ev-action-btn"
                onClick={() => { setShareOpen(!shareOpen); setCalendarOpen(false); }}
                aria-label="Share event"
                aria-expanded={shareOpen}
              >
                <HiOutlineShare size={17} />
                <span>Share</span>
                <HiChevronDown size={14} />
              </button>

              {calendarOpen && (
                <div className="ev-dropdown-menu">
                  <button className="ev-dropdown-item" onClick={handleGoogleCalendar}>
                    <HiOutlineCalendar size={16} /> Google Calendar
                  </button>
                  <button className="ev-dropdown-item" onClick={handleDownloadIcs}>
                    <HiOutlineDownload size={16} /> Download .ics (Apple / Outlook)
                  </button>
                </div>
              )}

              {shareOpen && (
                <div className="ev-dropdown-menu">
                  <button className="ev-dropdown-item" onClick={handleCopyLink}>
                    <HiOutlineClipboardCopy size={16} /> Copy event link
                  </button>
                  <button className="ev-dropdown-item" onClick={handleShareWhatsApp}>
                    <span>💬</span> Share to WhatsApp
                  </button>
                  <button className="ev-dropdown-item" onClick={handleShareTwitter}>
                    <span>🐦</span> Share to X / Twitter
                  </button>
                </div>
              )}
            </div>

            {/* Host */}
            {event.organizer && (
              <div className="ev-host">
                {event.organizer.avatar ? (
                  <img className="ev-avatar" src={event.organizer.avatar} alt={event.organizer.name} />
                ) : (
                  <div className="ev-avatar">{event.organizer.name?.charAt(0)}</div>
                )}
                <div style={{ minWidth: 0 }}>
                  <small>Hosted by</small>
                  <b>{event.organizer.name}</b>
                  <span className="ver"><HiOutlineShieldCheck size={15} /> Verified host</span>
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* ───────── You may also like ───────── */}
        <section className="ev-suggestions" aria-label="Related events">
          <div className="ev-suggestions-head">
            <div>
              <span className="ev-chip accent">More like this</span>
              <h2 className="ev-suggestions-title">You may also like</h2>
              <p className="ev-suggestions-sub">
                Festivals and cultural celebrations similar to {event.title}
              </p>
            </div>
            <Link to={`/events?category=${encodeURIComponent(event.category)}`} className="ev-more-link">
              <span>Explore all {event.category}</span>
              <HiChevronRight size={16} />
            </Link>
          </div>

          {relatedLoading ? (
            <div className="ev-suggestions-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="ev-skeleton-card" />
              ))}
            </div>
          ) : relatedEvents.length > 0 ? (
            <div className="ev-suggestions-grid">
              {relatedEvents.map((item) => (
                <EventCard key={item._id} event={item} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
              No related events yet. Browse all events to find your next celebration.
            </div>
          )}
        </section>
      </div>

      {/* Mobile booking bar */}
      {canBook && !authLoading && (
        <div className="ev-mbar">
          <div>
            <small>{isFreeEvent ? 'Entry' : 'From'}</small>
            <strong>{isFreeEvent ? 'Free' : `₹${displayPrice}`}</strong>
          </div>
          <button className="ev-btn" onClick={scrollToBooking}>Select tickets</button>
        </div>
      )}

      {/* ───────── Ticket modal ───────── */}
      {ticketModal && (
        <div
          className="ev-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Digital event pass"
          onClick={(e) => { if (e.target === e.currentTarget) setTicketModal(null); }}
        >
          <div className="ev-ticket">
            <div className="ev-ticket-top">
              <button className="ev-ticket-close" onClick={() => setTicketModal(null)} aria-label="Close pass">
                <HiOutlineX size={16} />
              </button>
              <span className="ev-chip glass"><HiOutlineSparkles size={14} /> EventVerse entry pass</span>
              <h3>Digital event pass</h3>
              <p>#{ticketModal._id?.slice(-8).toUpperCase()}</p>
            </div>

            <div className="ev-ticket-bottom">
              <div>
                <h4>{event.title}</h4>
                <div className="ev-tline"><HiOutlineCalendar size={16} /> {formatDate(event.date)}</div>
                <div className="ev-tline"><HiOutlineLocationMarker size={16} /> {event.venue}, {event.city}</div>
              </div>

              <div className="ev-pills">
                <span className="ev-pill ok">
                  ✓ {ticketModal.paymentStatus === 'free' ? 'Free pass' : 'Payment confirmed'}
                </span>
                <span className="ev-pill">
                  {ticketModal.ticketsCount || 1} {ticketModal.ticketsCount === 1 ? 'ticket' : 'tickets'}
                </span>
              </div>

              {ticketModal.qrCode ? (
                <>
                  <div className="ev-qr"><img src={ticketModal.qrCode} alt="Entry QR code" /></div>
                  <div className="ev-valid"><i /> Valid entry pass · scan at the entrance</div>
                </>
              ) : (
                <div className="ev-pending">Your QR code appears here once payment is confirmed.</div>
              )}

              {(ticketModal.attendeeName || user?.name) && (
                <p className="ev-attendee">Attendee: <strong>{ticketModal.attendeeName || user?.name}</strong></p>
              )}

              {ticketModal.qrCode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '6px' }}>
                  <button className="ev-btn" style={{ minHeight: 46, fontSize: 15 }} onClick={() => handleDownloadTicket(ticketModal)}>
                    <HiOutlineDownload size={17} /> Download pass (PNG)
                  </button>

                  <div style={{
                    background: 'rgba(122, 42, 155, 0.04)',
                    border: '1px solid rgba(122, 42, 155, 0.16)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    textAlign: 'left',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text)' }}>
                        <HiOutlineMail size={15} style={{ verticalAlign: '-2px', marginRight: '4px', color: 'var(--accent)' }} />
                        Send ticket to email:
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                        Check Spam folder too
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="email"
                        value={emailRecipient || user?.email || ''}
                        onChange={(e) => setEmailRecipient(e.target.value)}
                        placeholder="your-email@example.com"
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          fontSize: '13px',
                          fontFamily: 'inherit',
                          background: 'white',
                          color: 'var(--text)',
                          outline: 'none',
                        }}
                      />
                      <button
                        className="ev-btn"
                        style={{
                          minHeight: '36px',
                          padding: '0 16px',
                          fontSize: '13px',
                          whiteSpace: 'nowrap',
                          background: 'var(--accent)',
                          color: 'white',
                        }}
                        onClick={() => handleSendEmailTicket(ticketModal, emailRecipient || user?.email)}
                        disabled={sendingEmailId === ticketModal._id}
                      >
                        {sendingEmailId === ticketModal._id ? 'Sending…' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────── Cancel modal ───────── */}
      {regToCancel && (
        <div
          className="ev-overlay"
          style={{ zIndex: 1100 }}
          role="dialog"
          aria-modal="true"
          aria-label="Cancel booking"
          onClick={(e) => { if (e.target === e.currentTarget) setRegToCancel(null); }}
        >
          <div className="ev-confirm">
            <div className="ev-confirm-ic">⚠️</div>
            <h3>Cancel this booking?</h3>
            <p>
              Pass <strong>#{regToCancel._id?.slice(-6).toUpperCase()}</strong> ({regToCancel.ticketsCount || 1}{' '}
              {regToCancel.ticketsCount === 1 ? 'ticket' : 'tickets'}) will be cancelled and the spots released to other attendees.
            </p>
            <div className="ev-confirm-row">
              <button className="ev-keep" onClick={() => setRegToCancel(null)}>Keep booking</button>
              <button className="ev-danger" onClick={() => handleCancelRegistration(regToCancel)}>Cancel booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;