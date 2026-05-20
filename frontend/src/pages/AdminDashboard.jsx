import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FullscreenLoader } from '../components/Loader';
import {
  getAdminStats,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleFeatured,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllAdminRegistrations,
} from '../services/eventService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  HiOutlineChartBar,
  HiOutlineCollection,
  HiOutlineUsers,
  HiOutlineTicket,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineStar,
  HiStar,
  HiOutlineX,
} from 'react-icons/hi';

const CATEGORIES = [
  'Classical Music', 'Folk Dance', 'Classical Dance',
  'Art Exhibition', 'Food Festival', 'Theater & Drama',
  'Craft Fair', 'Cultural Parade', 'Literary Festival',
  'Film Festival', 'Spiritual & Religious', 'Other',
];

const COLORS = ['#E8A838', '#D4623A', '#7B9E5A', '#5A7DB5', '#9B6BB5', '#5ABDB5', '#B55A7D', '#7DB55A', '#B5935A', '#5A95B5', '#B55A5A', '#7D7DB5'];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Syne:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0D0D0E;
    --bg-2:      #121214;
    --bg-3:      #161618;
    --bg-4:      #1C1C1F;
    --border:    rgba(255,255,255,0.07);
    --border-md: rgba(255,255,255,0.12);
    --border-lg: rgba(255,255,255,0.18);
    --amber:     #E8A838;
    --amber-dim: rgba(232,168,56,0.12);
    --amber-glow:rgba(232,168,56,0.06);
    --text-1:    #F0EDE8;
    --text-2:    #9B998F;
    --text-3:    #5C5A54;
    --red:       #D4523A;
    --red-dim:   rgba(212,82,58,0.12);
    --green:     #5A9E6A;
    --green-dim: rgba(90,158,106,0.12);
    --blue:      #5A8DB5;
    --blue-dim:  rgba(90,141,181,0.12);
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    font-family: 'Syne', sans-serif;
  }

  .adm-root {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    padding-top: 70px;
  }

  @media (min-width: 768px) {
    .adm-root { flex-direction: row; }
  }

  /* ── SIDEBAR ── */
  .adm-sidebar {
    width: 100%;
    background: var(--bg-2);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    z-index: 20;
    position: relative;
  }

  @media (min-width: 768px) {
    .adm-sidebar {
      width: 220px;
      height: calc(100vh - 70px);
      position: sticky;
      top: 70px;
    }
  }

  .adm-sidebar-mark {
    display: none;
    padding: 28px 24px 16px;
    border-bottom: 1px solid var(--border);
  }

  @media (min-width: 768px) {
    .adm-sidebar-mark { display: block; }
  }

  .adm-sidebar-label {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text-3);
    margin-bottom: 4px;
  }

  .adm-sidebar-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-1);
    letter-spacing: 0.02em;
  }

  .adm-nav {
    display: flex;
    flex-direction: row;
    padding: 12px;
    gap: 4px;
    overflow-x: auto;
    scrollbar-width: none;
    flex-shrink: 0;
  }

  .adm-nav::-webkit-scrollbar { display: none; }

  @media (min-width: 768px) {
    .adm-nav {
      flex-direction: column;
      padding: 16px 12px;
      overflow-x: visible;
      overflow-y: auto;
      flex: 1;
    }
  }

  .adm-nav-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-3);
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    flex-shrink: 0;
    letter-spacing: 0.02em;
  }

  .adm-nav-btn svg { width: 16px; height: 16px; flex-shrink: 0; }

  .adm-nav-btn:hover {
    background: var(--bg-4);
    color: var(--text-1);
    border-color: var(--border);
  }

  .adm-nav-btn.active {
    background: var(--amber-dim);
    color: var(--amber);
    border-color: rgba(232,168,56,0.2);
  }

  .adm-nav-btn.active svg { color: var(--amber); }

  /* ── MAIN ── */
  .adm-main {
    flex: 1;
    padding: 32px 24px;
    overflow-y: auto;
    position: relative;
  }

  @media (min-width: 1024px) {
    .adm-main { padding: 40px 48px; }
  }

  @media (min-width: 768px) {
    .adm-main { height: calc(100vh - 70px); }
  }

  /* ── PAGE HEADER ── */
  .adm-page-header {
    margin-bottom: 36px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .adm-page-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--amber);
    margin-bottom: 6px;
  }

  .adm-page-title {
    font-size: clamp(22px, 3vw, 30px);
    font-weight: 800;
    color: var(--text-1);
    letter-spacing: -0.02em;
    line-height: 1.1;
  }

  .adm-page-sub {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--text-3);
    margin-top: 4px;
  }

  /* ── METRIC CARDS ── */
  .adm-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 28px;
  }

  .adm-metric-card {
    background: var(--bg-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s;
  }

  .adm-metric-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--accent-line, var(--amber));
    opacity: 0.6;
  }

  .adm-metric-card:hover { border-color: var(--border-md); }

  .adm-metric-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    font-size: 16px;
  }

  .adm-metric-label {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-3);
    margin-bottom: 4px;
  }

  .adm-metric-value {
    font-family: 'DM Mono', monospace;
    font-size: 28px;
    font-weight: 500;
    color: var(--text-1);
    letter-spacing: -0.02em;
    line-height: 1;
  }

  /* ── CHARTS ── */
  .adm-charts {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 28px;
  }

  @media (min-width: 1024px) {
    .adm-charts { grid-template-columns: 1fr 1fr; }
  }

  .adm-chart-card {
    background: var(--bg-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 24px;
  }

  .adm-chart-title {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-3);
    margin-bottom: 20px;
  }

  /* ── DATA TABLE CARD ── */
  .adm-table-card {
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .adm-table-head {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .adm-table-head-text { }

  .adm-table-head-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-1);
    letter-spacing: -0.01em;
  }

  .adm-table-head-sub {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--text-3);
    margin-top: 2px;
  }

  .adm-table-wrap { overflow-x: auto; }

  table.adm-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
  }

  table.adm-table th {
    padding: 10px 20px;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-3);
    border-bottom: 1px solid var(--border);
    background: var(--bg-3);
    text-align: left;
    font-weight: 400;
  }

  table.adm-table th.right { text-align: right; }
  table.adm-table th.center { text-align: center; }

  table.adm-table td {
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
    color: var(--text-2);
    vertical-align: middle;
  }

  table.adm-table tr:last-child td { border-bottom: none; }

  table.adm-table tr:hover td { background: rgba(255,255,255,0.015); }

  table.adm-table .td-right { text-align: right; }
  table.adm-table .td-center { text-align: center; }

  /* ── BADGE ── */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 3px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 500;
    border: 1px solid;
  }

  .badge-green {
    color: var(--green);
    background: var(--green-dim);
    border-color: rgba(90,158,106,0.2);
  }

  .badge-amber {
    color: var(--amber);
    background: var(--amber-dim);
    border-color: rgba(232,168,56,0.2);
  }

  .badge-red {
    color: var(--red);
    background: var(--red-dim);
    border-color: rgba(212,82,58,0.2);
  }

  .badge-gray {
    color: var(--text-3);
    background: rgba(255,255,255,0.04);
    border-color: var(--border);
  }

  .badge-blue {
    color: var(--blue);
    background: var(--blue-dim);
    border-color: rgba(90,141,181,0.2);
  }

  /* ── BUTTONS ── */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 38px;
    padding: 0 18px;
    background: var(--amber);
    color: #0D0D0E;
    border: none;
    border-radius: var(--radius-md);
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    letter-spacing: 0.02em;
  }

  .btn-primary svg { width: 16px; height: 16px; flex-shrink: 0; }

  .btn-primary:hover { background: #F0B84A; }
  .btn-primary:active { transform: scale(0.97); }

  .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 14px;
    background: transparent;
    color: var(--text-2);
    border: 1px solid var(--border-md);
    border-radius: var(--radius-md);
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .btn-ghost:hover {
    background: var(--bg-4);
    color: var(--text-1);
    border-color: var(--border-lg);
  }

  .btn-ghost:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .btn-icon {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-3);
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .btn-icon svg { width: 15px; height: 15px; }

  .btn-icon:hover { border-color: var(--border-md); color: var(--text-1); background: var(--bg-4); }

  .btn-icon.danger:hover {
    border-color: rgba(212,82,58,0.4);
    color: var(--red);
    background: var(--red-dim);
  }

  .btn-icon.edit:hover {
    border-color: rgba(232,168,56,0.4);
    color: var(--amber);
    background: var(--amber-dim);
  }

  .btn-icon.star-active {
    border-color: rgba(232,168,56,0.4);
    color: var(--amber);
    background: var(--amber-dim);
  }

  /* ── SEARCH INPUT ── */
  .adm-search-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .adm-search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-3);
    pointer-events: none;
    width: 14px;
    height: 14px;
  }

  .adm-search-input {
    height: 36px;
    width: 220px;
    padding: 0 12px 0 32px;
    background: var(--bg-4);
    border: 1px solid var(--border-md);
    border-radius: var(--radius-md);
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--text-1);
    outline: none;
    transition: border-color 0.15s;
  }

  .adm-search-input::placeholder { color: var(--text-3); }

  .adm-search-input:focus {
    border-color: rgba(232,168,56,0.4);
    box-shadow: 0 0 0 3px rgba(232,168,56,0.06);
  }

  /* ── PAGINATION ── */
  .adm-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-top: 1px solid var(--border);
  }

  .adm-page-nums {
    display: flex;
    gap: 4px;
  }

  .adm-page-num {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    background: transparent;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--text-3);
    cursor: pointer;
    transition: all 0.12s;
  }

  .adm-page-num:hover { color: var(--text-1); background: var(--bg-4); }

  .adm-page-num.active {
    background: var(--amber-dim);
    color: var(--amber);
    border-color: rgba(232,168,56,0.25);
  }

  /* ── PROGRESS BAR ── */
  .adm-progress-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .adm-progress-bar {
    flex: 1;
    height: 3px;
    background: rgba(255,255,255,0.08);
    border-radius: 99px;
    overflow: hidden;
    min-width: 60px;
    max-width: 80px;
  }

  .adm-progress-fill {
    height: 100%;
    background: var(--amber);
    border-radius: 99px;
    transition: width 0.3s;
  }

  .adm-progress-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--text-3);
    white-space: nowrap;
    min-width: 48px;
  }

  /* ── EVENT ROW IMAGE ── */
  .adm-event-img {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid var(--border);
  }

  .adm-event-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
  }

  .adm-user-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--bg-4);
    border: 1px solid var(--border-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-2);
    flex-shrink: 0;
  }

  /* ── RECENT TABLES (stats tab) ── */
  .adm-recent-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    padding-bottom: 40px;
  }

  @media (min-width: 1024px) {
    .adm-recent-grid { grid-template-columns: 1fr 1fr; }
  }

  .adm-upcoming-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    transition: all 0.15s;
  }

  .adm-upcoming-item:hover {
    background: var(--bg-4);
    border-color: var(--border);
  }

  .adm-upcoming-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
    margin-bottom: 2px;
  }

  .adm-upcoming-date {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--text-3);
  }

  /* ── MODAL ── */
  .adm-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: stretch;
    justify-content: flex-end;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .adm-modal-panel {
    background: var(--bg-2);
    border-left: 1px solid var(--border-md);
    width: 100%;
    max-width: 600px;
    height: 100%;
    overflow-y: auto;
    padding: 32px;
    animation: slideLeft 0.25s ease;
    display: flex;
    flex-direction: column;
  }

  @keyframes slideLeft {
    from { transform: translateX(40px); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }

  .adm-modal-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }

  .adm-modal-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--amber);
    margin-bottom: 4px;
  }

  .adm-modal-title {
    font-size: 20px;
    font-weight: 800;
    color: var(--text-1);
    letter-spacing: -0.02em;
  }

  /* ── FORM ── */
  .adm-form-section {
    margin-bottom: 28px;
  }

  .adm-form-section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
  }

  .adm-form-section-num {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--amber);
    background: var(--amber-dim);
    border: 1px solid rgba(232,168,56,0.2);
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .adm-form-section-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-1);
    letter-spacing: 0.02em;
  }

  .adm-form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }

  @media (min-width: 480px) {
    .adm-form-grid { grid-template-columns: 1fr 1fr; }
  }

  .adm-form-grid .span2 { grid-column: 1 / -1; }

  .adm-field-label {
    display: block;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-3);
    margin-bottom: 6px;
  }

  .adm-input, .adm-select, .adm-textarea {
    width: 100%;
    background: var(--bg-4);
    border: 1px solid var(--border-md);
    border-radius: var(--radius-md);
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    color: var(--text-1);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .adm-input, .adm-select {
    height: 40px;
    padding: 0 12px;
  }

  .adm-textarea {
    padding: 10px 12px;
    resize: vertical;
    line-height: 1.5;
  }

  .adm-select { color-scheme: dark; }
  .adm-select option { background: var(--bg-3); }

  .adm-input:focus, .adm-select:focus, .adm-textarea:focus {
    border-color: rgba(232,168,56,0.5);
    box-shadow: 0 0 0 3px rgba(232,168,56,0.07);
  }

  .adm-input::placeholder, .adm-textarea::placeholder { color: var(--text-3); }

  /* toggle */
  .adm-toggle-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }

  .adm-toggle-track {
    width: 36px;
    height: 20px;
    border-radius: 99px;
    background: var(--bg-4);
    border: 1px solid var(--border-md);
    position: relative;
    transition: background 0.2s, border-color 0.2s;
    flex-shrink: 0;
  }

  .adm-toggle-track.on {
    background: var(--amber-dim);
    border-color: rgba(232,168,56,0.35);
  }

  .adm-toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--text-3);
    transition: transform 0.2s, background 0.2s;
  }

  .adm-toggle-track.on .adm-toggle-thumb {
    transform: translateX(16px);
    background: var(--amber);
  }

  .adm-toggle-label {
    font-size: 13px;
    color: var(--text-2);
    font-weight: 500;
    user-select: none;
  }

  /* upload zone */
  .adm-upload-zone {
    border: 1px dashed var(--border-md);
    border-radius: var(--radius-lg);
    padding: 28px 20px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }

  .adm-upload-zone:hover {
    border-color: rgba(232,168,56,0.35);
    background: var(--amber-glow);
  }

  .adm-upload-zone label { cursor: pointer; display: block; }

  .adm-upload-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-md);
    background: var(--bg-4);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
    color: var(--text-3);
    transition: color 0.2s, border-color 0.2s, background 0.2s;
  }

  .adm-upload-zone:hover .adm-upload-icon {
    border-color: rgba(232,168,56,0.35);
    color: var(--amber);
    background: var(--amber-dim);
  }

  .adm-upload-zone svg { width: 18px; height: 18px; }

  .adm-upload-main-text {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-1);
    margin-bottom: 3px;
  }

  .adm-upload-sub-text {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--text-3);
    margin-bottom: 12px;
  }

  .adm-upload-chip {
    display: inline-block;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    padding: 4px 12px;
    background: var(--amber-dim);
    color: var(--amber);
    border: 1px solid rgba(232,168,56,0.2);
    border-radius: 99px;
    margin-top: 10px;
  }

  /* modal footer */
  .adm-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 24px;
    margin-top: 28px;
    border-top: 1px solid var(--border);
    position: sticky;
    bottom: 0;
    background: var(--bg-2);
    padding-bottom: 4px;
  }

  .btn-cancel {
    height: 42px;
    padding: 0 20px;
    background: transparent;
    border: 1px solid var(--border-md);
    border-radius: var(--radius-md);
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-2);
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-cancel:hover { background: var(--bg-4); color: var(--text-1); }

  .btn-submit {
    height: 42px;
    padding: 0 24px;
    background: var(--amber);
    border: none;
    border-radius: var(--radius-md);
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #0D0D0E;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-submit:hover { background: #F0B84A; }
  .btn-submit:active { transform: scale(0.97); }
  .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  .spin {
    width: 14px; height: 14px;
    border: 2px solid rgba(13,13,14,0.25);
    border-top-color: #0D0D0E;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── RECHARTS CUSTOM TOOLTIP ── */
  .adm-tooltip {
    background: var(--bg-2);
    border: 1px solid var(--border-md);
    border-radius: var(--radius-md);
    padding: 10px 14px;
  }

  .adm-tooltip-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--text-3);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .adm-tooltip-val {
    font-family: 'DM Mono', monospace;
    font-size: 18px;
    font-weight: 500;
    color: var(--amber);
  }

  /* ── PRICING BOX ── */
  .adm-pricing-box {
    background: var(--bg-4);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 18px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }

  @media (min-width: 480px) {
    .adm-pricing-box { grid-template-columns: 1fr 1fr; }
  }

  .adm-pricing-box .span2 { grid-column: 1 / -1; }

  /* ── SLIDE UP ── */
  .slide-up {
    animation: slideUp 0.22s ease both;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
`;

/* ─────────────────────────────────────────── */
/* SUB-COMPONENTS */

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="adm-tooltip">
      <p className="adm-tooltip-label">{label}</p>
      <p className="adm-tooltip-val">{payload[0].value}</p>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="adm-toggle-wrap" onClick={() => onChange(!checked)}>
      <div className={`adm-toggle-track ${checked ? 'on' : ''}`}>
        <div className="adm-toggle-thumb" />
      </div>
      <span className="adm-toggle-label">{label}</span>
    </label>
  );
}

function Pagination({ page, total, setPage }) {
  if (total <= 1) return null;
  return (
    <div className="adm-pagination">
      <button className="btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
      <div className="adm-page-nums">
        {Array.from({ length: total }, (_, i) => i + 1).map(p => (
          <button key={p} className={`adm-page-num ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
        ))}
      </div>
      <button className="btn-ghost" disabled={page === total} onClick={() => setPage(p => p + 1)}>Next →</button>
    </div>
  );
}

/* ─────────────────────────────────────────── */

function initialEventForm() {
  return {
    title: '', description: '', shortDescription: '', category: 'Classical Music',
    culturalOrigin: '', language: '', date: '', endDate: '', time: '', duration: '',
    venue: '', address: '', city: '', state: '', price: 0, isFree: false,
    earlyBirdPrice: '', earlyBirdDeadline: '', capacity: 100, waitlistEnabled: false,
    videoUrl: '', tags: '', highlights: '', organizerNote: '', status: 'upcoming',
    performers: [], schedule: [], images: [],
  };
}

/* ─────────────────────────────────────────── */

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState(null);

  const [events, setEvents] = useState([]);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsTotal, setEventsTotal] = useState(1);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventFormData, setEventFormData] = useState(initialEventForm());
  const [eventSaving, setEventSaving] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(1);
  const [userSearch, setUserSearch] = useState('');

  const [registrations, setRegistrations] = useState([]);
  const [regsPage, setRegsPage] = useState(1);
  const [regsTotal, setRegsTotal] = useState(1);
  const [regEventFilter, setRegEventFilter] = useState('');

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
    else if (activeTab === 'events') fetchEvents();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'registrations') fetchRegistrations();
  }, [activeTab, eventsPage, usersPage, regsPage, userSearch, regEventFilter]);

  const fetchStats = async () => {
    setLoading(true);
    try { const res = await getAdminStats(); setStats(res.data.data); }
    catch { toast.error('Failed to load stats'); }
    finally { setLoading(false); }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await getAllEvents({ page: eventsPage, limit: 10 });
      setEvents(res.data.data.events);
      setEventsTotal(res.data.data.totalPages);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers({ page: usersPage, limit: 10, search: userSearch });
      setUsers(res.data.data.users);
      setUsersTotal(res.data.data.totalPages);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await getAllAdminRegistrations({ page: regsPage, limit: 10, eventId: regEventFilter });
      setRegistrations(res.data.data.registrations);
      setRegsTotal(res.data.data.totalPages);
    } catch { toast.error('Failed to load registrations'); }
    finally { setLoading(false); }
  };

  const handleEventDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try { await deleteEvent(id); toast.success('Event deleted'); fetchEvents(); }
    catch { toast.error('Failed to delete event'); }
  };

  const handleToggleFeatured = async (id) => {
    try { await toggleFeatured(id); toast.success('Featured status updated'); fetchEvents(); }
    catch { toast.error('Failed to update status'); }
  };

  const openEventModal = (event = null) => {
    setCurrentEvent(event);
    if (event) {
      setEventFormData({
        ...event,
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
        earlyBirdDeadline: event.earlyBirdDeadline ? new Date(event.earlyBirdDeadline).toISOString().split('T')[0] : '',
        tags: event.tags ? event.tags.join(', ') : '',
        highlights: event.highlights ? event.highlights.join('\n') : '',
        images: [],
      });
    } else {
      setEventFormData(initialEventForm());
    }
    setEventModalOpen(true);
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setEventSaving(true);
    try {
      const formData = new FormData();
      Object.keys(eventFormData).forEach(key => {
        if (key === 'performers' || key === 'schedule') {
          formData.append(key, JSON.stringify(eventFormData[key]));
        } else if (key === 'tags') {
          formData.append(key, JSON.stringify(eventFormData.tags.split(',').map(t => t.trim()).filter(t => t)));
        } else if (key === 'highlights') {
          formData.append(key, JSON.stringify(eventFormData.highlights.split('\n').filter(h => h.trim())));
        } else if (key === 'images') {
          Array.from(eventFormData.images).forEach(file => formData.append('images', file));
        } else if (eventFormData[key] !== null && eventFormData[key] !== '') {
          formData.append(key, eventFormData[key]);
        }
      });
      if (currentEvent) {
        await updateEvent(currentEvent._id, formData);
        toast.success('Event updated');
      } else {
        await createEvent(formData);
        toast.success('Event created');
      }
      setEventModalOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    } finally {
      setEventSaving(false);
    }
  };

  const handleRoleToggle = async (id) => {
    if (id === user._id) return toast.error('Cannot change your own role');
    try { await updateUserRole(id); toast.success('User role updated'); fetchUsers(); }
    catch { toast.error('Failed to update role'); }
  };

  const handleUserDelete = async (id) => {
    if (id === user._id) return toast.error('Cannot delete yourself');
    if (!window.confirm('Delete this user?')) return;
    try { await deleteUser(id); toast.success('User deleted'); fetchUsers(); }
    catch { toast.error('Failed to delete user'); }
  };

  const tabs = [
    { id: 'stats',         label: 'Overview',       icon: <HiOutlineChartBar /> },
    { id: 'events',        label: 'Events',          icon: <HiOutlineCollection /> },
    { id: 'users',         label: 'Users',           icon: <HiOutlineUsers /> },
    { id: 'registrations', label: 'Registrations',   icon: <HiOutlineTicket /> },
  ];

  return (
    <>
      <style>{styles}</style>

      <div className="adm-root">

        {/* ── SIDEBAR ── */}
        <aside className="adm-sidebar">
          <div className="adm-sidebar-mark">
            <div className="adm-sidebar-label">Control</div>
            <div className="adm-sidebar-title">Admin Panel</div>
          </div>
          <nav className="adm-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`adm-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── MAIN ── */}
        <main className="adm-main">
          {loading && <FullscreenLoader />}

          {/* ── STATS TAB ── */}
          {!loading && activeTab === 'stats' && stats && (
            <div className="slide-up">
              <div className="adm-page-header">
                <div>
                  <div className="adm-page-eyebrow">Dashboard</div>
                  <div className="adm-page-title">Overview</div>
                  <div className="adm-page-sub">Platform-wide metrics</div>
                </div>
              </div>

              {/* Metrics */}
              <div className="adm-metrics">
                {[
                  { label: 'Total Users',    value: stats.totalUsers,          color: '#5A8DB5', accentLine: '#5A8DB5', icon: <HiOutlineUsers />,      bg: 'rgba(90,141,181,0.1)' },
                  { label: 'Total Events',   value: stats.totalEvents,         color: '#E8A838', accentLine: '#E8A838', icon: <HiOutlineCollection />,  bg: 'rgba(232,168,56,0.1)' },
                  { label: 'Registrations',  value: stats.totalRegistrations,  color: '#9B6BB5', accentLine: '#9B6BB5', icon: <HiOutlineTicket />,      bg: 'rgba(155,107,181,0.1)' },
                  { label: 'Revenue',        value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, color: '#5A9E6A', accentLine: '#5A9E6A', icon: <HiOutlineChartBar />, bg: 'rgba(90,158,106,0.1)' },
                ].map((m, i) => (
                  <div className="adm-metric-card" key={i} style={{ '--accent-line': m.accentLine }}>
                    <div className="adm-metric-icon" style={{ background: m.bg, color: m.color }}>
                      {m.icon}
                    </div>
                    <div className="adm-metric-label">{m.label}</div>
                    <div className="adm-metric-value" style={{ color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="adm-charts">
                <div className="adm-chart-card" style={{ height: 320 }}>
                  <div className="adm-chart-title">Monthly Registrations</div>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={stats.monthlyRegistrations} margin={{ top: 0, right: 0, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="_id" stroke="#5C5A54" tick={{ fontSize: 10, fontFamily: 'DM Mono' }} tickLine={false} axisLine={false} dy={8} />
                      <YAxis stroke="#5C5A54" tick={{ fontSize: 10, fontFamily: 'DM Mono' }} tickLine={false} axisLine={false} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.025)' }} />
                      <Bar dataKey="count" fill="#E8A838" radius={[3, 3, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="adm-chart-card" style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
                  <div className="adm-chart-title">Events by Category</div>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.categoryBreakdown}
                          dataKey="count"
                          nameKey="_id"
                          cx="50%" cy="50%"
                          innerRadius={72}
                          outerRadius={98}
                          stroke="rgba(13,13,14,0.9)"
                          strokeWidth={2}
                        >
                          {stats.categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 26, fontWeight: 500, color: '#F0EDE8', lineHeight: 1 }}>{stats.totalEvents}</div>
                        <div style={{ fontFamily: 'DM Mono', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5C5A54', marginTop: 4 }}>events</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent */}
              <div className="adm-recent-grid">
                <div className="adm-chart-card">
                  <div className="adm-chart-title">Recent Registrations</div>
                  <table className="adm-table" style={{ minWidth: 'unset', width: '100%' }}>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Event</th>
                        <th className="right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentRegistrations.map(reg => (
                        <tr key={reg._id}>
                          <td style={{ color: '#F0EDE8', fontWeight: 600, fontSize: 13 }}>{reg.user?.name}</td>
                          <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reg.event?.title}</td>
                          <td className="td-right">
                            <span className={`badge ${reg.status === 'confirmed' ? 'badge-green' : 'badge-gray'}`}>{reg.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="adm-chart-card">
                  <div className="adm-chart-title">Upcoming Events</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {stats.upcomingEvents.map(event => {
                      const fill = Math.min((event.registeredCount / event.capacity) * 100, 100);
                      return (
                        <div key={event._id} className="adm-upcoming-item">
                          <div style={{ minWidth: 0, flex: 1, paddingRight: 16 }}>
                            <div className="adm-upcoming-title">{event.title}</div>
                            <div className="adm-upcoming-date">{new Date(event.date).toLocaleDateString()}</div>
                          </div>
                          <div style={{ flexShrink: 0, textAlign: 'right' }}>
                            <div className="adm-progress-wrap">
                              <div className="adm-progress-bar">
                                <div className="adm-progress-fill" style={{ width: `${fill}%` }} />
                              </div>
                              <span className="adm-progress-label">{event.registeredCount}/{event.capacity}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── EVENTS TAB ── */}
          {!loading && activeTab === 'events' && (
            <div className="slide-up">
              <div className="adm-page-header">
                <div>
                  <div className="adm-page-eyebrow">Management</div>
                  <div className="adm-page-title">Events</div>
                  <div className="adm-page-sub">Create and manage festival listings</div>
                </div>
                <button className="btn-primary" onClick={() => openEventModal()}>
                  <HiOutlinePlus /> New Festival
                </button>
              </div>

              <div className="adm-table-card">
                <div className="adm-table-wrap">
                  <table className="adm-table" style={{ minWidth: 820 }}>
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Date & City</th>
                        <th>Price</th>
                        <th>Capacity</th>
                        <th className="center">Featured</th>
                        <th className="right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(event => {
                        const fill = Math.min((event.registeredCount / event.capacity) * 100, 100);
                        return (
                          <tr key={event._id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <img
                                  src={event.thumbnail || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=100&q=80'}
                                  alt={event.title}
                                  className="adm-event-img"
                                />
                                <div>
                                  <div className="adm-event-name">{event.title}</div>
                                  <span className="badge badge-gray" style={{ marginTop: 4 }}>{event.category}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: '#F0EDE8' }}>{new Date(event.date).toLocaleDateString()}</div>
                              <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: '#5C5A54', marginTop: 2 }}>{event.city}</div>
                            </td>
                            <td>
                              <span style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 500, color: event.isFree ? '#5A9E6A' : '#F0EDE8' }}>
                                {event.isFree ? 'Free' : `₹${event.price}`}
                              </span>
                            </td>
                            <td>
                              <div className="adm-progress-wrap">
                                <div className="adm-progress-bar">
                                  <div className="adm-progress-fill" style={{ width: `${fill}%` }} />
                                </div>
                                <span className="adm-progress-label">{event.registeredCount}/{event.capacity}</span>
                              </div>
                            </td>
                            <td className="td-center">
                              <button
                                onClick={() => handleToggleFeatured(event._id)}
                                className={`btn-icon ${event.isFeatured ? 'star-active' : ''}`}
                                title="Toggle Featured"
                              >
                                {event.isFeatured ? <HiStar style={{ width: 15, height: 15 }} /> : <HiOutlineStar style={{ width: 15, height: 15 }} />}
                              </button>
                            </td>
                            <td className="td-right">
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button onClick={() => openEventModal(event)} className="btn-icon edit" title="Edit">
                                  <HiOutlinePencilAlt />
                                </button>
                                <button onClick={() => handleEventDelete(event._id)} className="btn-icon danger" title="Delete">
                                  <HiOutlineTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination page={eventsPage} total={eventsTotal} setPage={setEventsPage} />
              </div>
            </div>
          )}

          {/* ── USERS TAB ── */}
          {!loading && activeTab === 'users' && (
            <div className="slide-up">
              <div className="adm-page-header">
                <div>
                  <div className="adm-page-eyebrow">Management</div>
                  <div className="adm-page-title">Users</div>
                  <div className="adm-page-sub">View and manage user roles</div>
                </div>
                <div className="adm-search-wrap">
                  <HiOutlineSearch className="adm-search-icon" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="adm-search-input"
                  />
                </div>
              </div>

              <div className="adm-table-card">
                <div className="adm-table-wrap">
                  <table className="adm-table" style={{ minWidth: 600 }}>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th className="right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="adm-user-avatar">{u.name.charAt(0)}</div>
                              <span style={{ fontWeight: 600, fontSize: 13, color: '#F0EDE8' }}>{u.name}</span>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{u.email}</td>
                          <td>
                            <span className={`badge ${u.role === 'admin' ? 'badge-amber' : 'badge-gray'}`}>{u.role}</span>
                          </td>
                          <td style={{ fontFamily: 'DM Mono', fontSize: 11 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="td-right">
                            {u._id !== user._id && (
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button className="btn-ghost" onClick={() => handleRoleToggle(u._id)}>Toggle Role</button>
                                <button className="btn-icon danger" onClick={() => handleUserDelete(u._id)} title="Delete">
                                  <HiOutlineTrash />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={usersPage} total={usersTotal} setPage={setUsersPage} />
              </div>
            </div>
          )}

          {/* ── REGISTRATIONS TAB ── */}
          {!loading && activeTab === 'registrations' && (
            <div className="slide-up">
              <div className="adm-page-header">
                <div>
                  <div className="adm-page-eyebrow">Data</div>
                  <div className="adm-page-title">Registrations</div>
                  <div className="adm-page-sub">All ticket sales</div>
                </div>
                <div className="adm-search-wrap">
                  <HiOutlineSearch className="adm-search-icon" />
                  <input
                    type="text"
                    placeholder="Filter by Event ID..."
                    value={regEventFilter}
                    onChange={e => setRegEventFilter(e.target.value)}
                    className="adm-search-input"
                  />
                </div>
              </div>

              <div className="adm-table-card">
                <div className="adm-table-wrap">
                  <table className="adm-table" style={{ minWidth: 700 }}>
                    <thead>
                      <tr>
                        <th>Registrant</th>
                        <th>Event</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th className="right">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map(r => (
                        <tr key={r._id}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#F0EDE8' }}>{r.user?.name}</div>
                            <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: '#5C5A54', marginTop: 2 }}>{r.user?.email}</div>
                          </td>
                          <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.event?.title || r.event}</td>
                          <td>
                            <span style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 500, color: '#F0EDE8' }}>₹{r.totalAmount}</span>
                          </td>
                          <td>
                            <span className={`badge ${r.status === 'confirmed' ? 'badge-green' : 'badge-red'}`}>{r.status}</span>
                          </td>
                          <td className="td-right" style={{ fontFamily: 'DM Mono', fontSize: 11 }}>
                            {new Date(r.registeredAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={regsPage} total={regsTotal} setPage={setRegsPage} />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── EVENT MODAL ── */}
      {eventModalOpen && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && setEventModalOpen(false)}>
          <div className="adm-modal-panel">
            <div className="adm-modal-top">
              <div>
                <div className="adm-modal-eyebrow">{currentEvent ? 'Editing' : 'New Festival'}</div>
                <div className="adm-modal-title">{currentEvent ? currentEvent.title : 'Create Festival'}</div>
              </div>
              <button className="btn-icon" onClick={() => setEventModalOpen(false)} style={{ flexShrink: 0 }}>
                <HiOutlineX style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleEventSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>

              {/* Section 1 */}
              <div className="adm-form-section">
                <div className="adm-form-section-header">
                  <div className="adm-form-section-num">1</div>
                  <div className="adm-form-section-title">Basic Details</div>
                </div>
                <div className="adm-form-grid">
                  <div className="span2">
                    <label className="adm-field-label">Title</label>
                    <input required type="text" className="adm-input" value={eventFormData.title} onChange={e => setEventFormData({ ...eventFormData, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="adm-field-label">Category</label>
                    <select className="adm-select" value={eventFormData.category} onChange={e => setEventFormData({ ...eventFormData, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="adm-field-label">Cultural Origin</label>
                    <input type="text" className="adm-input" value={eventFormData.culturalOrigin} onChange={e => setEventFormData({ ...eventFormData, culturalOrigin: e.target.value })} />
                  </div>
                  <div>
                    <label className="adm-field-label">Date</label>
                    <input required type="date" className="adm-input" value={eventFormData.date} onChange={e => setEventFormData({ ...eventFormData, date: e.target.value })} />
                  </div>
                  <div>
                    <label className="adm-field-label">City</label>
                    <input required type="text" className="adm-input" value={eventFormData.city} onChange={e => setEventFormData({ ...eventFormData, city: e.target.value })} />
                  </div>
                  <div>
                    <label className="adm-field-label">Venue</label>
                    <input required type="text" className="adm-input" value={eventFormData.venue} onChange={e => setEventFormData({ ...eventFormData, venue: e.target.value })} />
                  </div>
                  <div>
                    <label className="adm-field-label">State</label>
                    <input type="text" className="adm-input" value={eventFormData.state} onChange={e => setEventFormData({ ...eventFormData, state: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="adm-form-section">
                <div className="adm-form-section-header">
                  <div className="adm-form-section-num">2</div>
                  <div className="adm-form-section-title">Descriptions</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="adm-field-label">Short Description</label>
                    <textarea maxLength="200" rows="2" className="adm-textarea" value={eventFormData.shortDescription} onChange={e => setEventFormData({ ...eventFormData, shortDescription: e.target.value })} />
                  </div>
                  <div>
                    <label className="adm-field-label">Full Description</label>
                    <textarea required rows="4" className="adm-textarea" value={eventFormData.description} onChange={e => setEventFormData({ ...eventFormData, description: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div className="adm-form-section">
                <div className="adm-form-section-header">
                  <div className="adm-form-section-num">3</div>
                  <div className="adm-form-section-title">Pricing & Capacity</div>
                </div>
                <div className="adm-pricing-box">
                  <div className="span2">
                    <Toggle
                      checked={eventFormData.isFree}
                      onChange={v => setEventFormData({ ...eventFormData, isFree: v, price: v ? 0 : eventFormData.price })}
                      label="This is a free event"
                    />
                  </div>
                  {!eventFormData.isFree && (
                    <div>
                      <label className="adm-field-label">Regular Price (₹)</label>
                      <input type="number" min="0" className="adm-input" value={eventFormData.price} onChange={e => setEventFormData({ ...eventFormData, price: e.target.value })} />
                    </div>
                  )}
                  <div className={eventFormData.isFree ? 'span2' : ''}>
                    <label className="adm-field-label">Capacity</label>
                    <input required type="number" min="1" className="adm-input" value={eventFormData.capacity} onChange={e => setEventFormData({ ...eventFormData, capacity: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Section 4 */}
              <div className="adm-form-section">
                <div className="adm-form-section-header">
                  <div className="adm-form-section-num">4</div>
                  <div className="adm-form-section-title">Media</div>
                </div>
                <div className="adm-upload-zone">
                  <label>
                    <div className="adm-upload-icon">
                      <HiOutlinePlus />
                    </div>
                    <div className="adm-upload-main-text">Upload images</div>
                    <div className="adm-upload-sub-text">Max 8 images — JPG or PNG</div>
                    <input type="file" multiple accept="image/*" onChange={e => setEventFormData({ ...eventFormData, images: e.target.files })} style={{ display: 'none' }} />
                    <span className="btn-ghost" style={{ display: 'inline-flex' }}>Browse files</span>
                  </label>
                  {eventFormData.images?.length > 0 && (
                    <div className="adm-upload-chip">{eventFormData.images.length} files selected</div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="adm-modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setEventModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={eventSaving}>
                  {eventSaving && <div className="spin" />}
                  {currentEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;