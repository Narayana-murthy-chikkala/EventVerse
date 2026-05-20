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
  LineChart,
  Line,
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
  HiOutlineArrowRight,
  HiOutlineClock,
  HiOutlineLocationMarker,
} from 'react-icons/hi';

const CATEGORIES = [
  'Classical Music', 'Folk Dance', 'Classical Dance',
  'Art Exhibition', 'Food Festival', 'Theater & Drama',
  'Craft Fair', 'Cultural Parade', 'Literary Festival',
  'Film Festival', 'Spiritual & Religious', 'Other',
];

const COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#F97316', '#06B6D4', '#14B8A6', '#EF4444', '#6B7280', '#9333EA'];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .adm-root {
    --bg-primary: #0F172A;
    --bg-secondary: #1E293B;
    --bg-tertiary: #334155;
    --bg-hover: #475569;
    --bg-light: #1F2937;
    
    --border-color: rgba(255, 255, 255, 0.08);
    --border-light: rgba(255, 255, 255, 0.12);
    --border-heavy: rgba(255, 255, 255, 0.18);
    
    --text-primary: #F8FAFC;
    --text-secondary: #CBD5E1;
    --text-tertiary: #94A3B8;
    --text-muted: #64748B;
    
    --accent-primary: #6366F1;
    --accent-primary-light: rgba(99, 102, 241, 0.1);
    --accent-primary-lighter: rgba(99, 102, 241, 0.05);
    --accent-secondary: #EC4899;
    --accent-warm: #F59E0B;
    --accent-success: #10B981;
    --accent-danger: #EF4444;
    --accent-info: #3B82F6;
    
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;
    --radius-xl: 18px;
    
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
    --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
    
    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);

    font-family: 'DM Sans', sans-serif;
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    min-height: 100vh;
    padding-top: 72px;
    background: linear-gradient(135deg, var(--bg-primary) 0%, #0D1929 100%);
    display: flex;
    flex-direction: column;
  }

  @media (min-width: 1024px) {
    .adm-root {
      flex-direction: row;
    }
  }

  /* ═══════════════════════════════════════════════════════ */
  /* SIDEBAR */
  /* ═══════════════════════════════════════════════════════ */

  .adm-sidebar {
    width: 100%;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    z-index: 20;
    position: relative;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  @media (min-width: 1024px) {
    .adm-sidebar {
      width: 260px;
      height: calc(100vh - 72px);
      position: sticky;
      top: 72px;
      border-top: none;
    }
  }

  .adm-sidebar-mark {
    display: none;
    padding: 32px 24px 20px;
    border-bottom: 1px solid var(--border-color);
  }

  @media (min-width: 1024px) {
    .adm-sidebar-mark {
      display: block;
    }
  }

  .adm-sidebar-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-tertiary);
    margin-bottom: 6px;
  }

  .adm-sidebar-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }

  .adm-nav {
    display: flex;
    flex-direction: row;
    padding: 12px;
    gap: 6px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--border-light) transparent;
    flex-shrink: 0;
  }

  .adm-nav::-webkit-scrollbar {
    height: 6px;
  }

  .adm-nav::-webkit-scrollbar-track {
    background: transparent;
  }

  .adm-nav::-webkit-scrollbar-thumb {
    background: var(--border-light);
    border-radius: 3px;
  }

  @media (min-width: 1024px) {
    .adm-nav {
      flex-direction: column;
      padding: 16px 12px;
      overflow: auto;
      flex: 1;
    }
  }

  .adm-nav-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 16px;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-tertiary);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
    flex-shrink: 0;
    position: relative;
  }

  .adm-nav-btn svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .adm-nav-btn:hover {
    background: rgba(99, 102, 241, 0.08);
    color: var(--text-secondary);
    transform: translateX(2px);
  }

  .adm-nav-btn.active {
    background: var(--accent-primary-light);
    color: var(--accent-primary);
    border-color: var(--accent-primary);
  }

  .adm-nav-btn.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 24px;
    background: var(--accent-primary);
    border-radius: 0 2px 2px 0;
  }

  /* ═══════════════════════════════════════════════════════ */
  /* MAIN CONTENT */
  /* ═══════════════════════════════════════════════════════ */

  .adm-main {
    flex: 1;
    padding: 32px 20px;
    overflow-y: auto;
    position: relative;
    scrollbar-width: thin;
    scrollbar-color: var(--border-light) transparent;
  }

  .adm-main::-webkit-scrollbar {
    width: 8px;
  }

  .adm-main::-webkit-scrollbar-track {
    background: transparent;
  }

  .adm-main::-webkit-scrollbar-thumb {
    background: var(--border-light);
    border-radius: 4px;
  }

  @media (min-width: 1024px) {
    .adm-main {
      padding: 40px 48px;
      height: calc(100vh - 72px);
    }
  }

  @media (min-width: 1400px) {
    .adm-main {
      padding: 48px 56px;
    }
  }

  /* ═══════════════════════════════════════════════════════ */
  /* PAGE HEADER */
  /* ═══════════════════════════════════════════════════════ */

  .adm-page-header {
    margin-bottom: 40px;
    padding-bottom: 28px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
  }

  .adm-page-eyebrow {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--accent-primary);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .adm-page-title {
    font-size: clamp(28px, 5vw, 40px);
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.025em;
    line-height: 1.2;
  }

  .adm-page-sub {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: var(--text-tertiary);
    margin-top: 4px;
    font-weight: 400;
  }

  /* ═══════════════════════════════════════════════════════ */
  /* METRIC CARDS */
  /* ═══════════════════════════════════════════════════════ */

  .adm-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 36px;
  }

  @media (min-width: 1400px) {
    .adm-metrics {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .adm-metric-card {
    background: linear-gradient(135deg, var(--bg-light) 0%, var(--bg-secondary) 100%);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 24px;
    position: relative;
    overflow: hidden;
    transition: all var(--transition-base);
    display: flex;
    flex-direction: column;
  }

  .adm-metric-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, var(--accent-primary) 0%, transparent 100%);
    opacity: 0.5;
  }

  .adm-metric-card::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, var(--accent-primary) 0%, transparent 70%);
    opacity: 0.04;
  }

  .adm-metric-card:hover {
    border-color: var(--border-light);
    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-light) 100%);
    transform: translateY(-4px);
  }

  .adm-metric-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    font-size: 20px;
    background: var(--accent-primary-light);
  }

  .adm-metric-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-tertiary);
    margin-bottom: 8px;
  }

  .adm-metric-value {
    font-family: 'DM Sans', sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .adm-metric-change {
    font-size: 12px;
    color: var(--text-tertiary);
    margin-top: 8px;
    font-weight: 500;
  }

  /* ═══════════════════════════════════════════════════════ */
  /* CHARTS */
  /* ═══════════════════════════════════════════════════════ */

  .adm-charts {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    margin-bottom: 36px;
  }

  @media (min-width: 1200px) {
    .adm-charts {
      grid-template-columns: 1fr 1fr;
    }
  }

  .adm-chart-card {
    background: linear-gradient(135deg, var(--bg-light) 0%, var(--bg-secondary) 100%);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 28px;
    transition: all var(--transition-base);
    position: relative;
    overflow: hidden;
  }

  .adm-chart-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, var(--accent-primary) 0%, transparent 100%);
    opacity: 0.3;
  }

  .adm-chart-card:hover {
    border-color: var(--border-light);
    transform: translateY(-2px);
  }

  .adm-chart-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-tertiary);
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ═══════════════════════════════════════════════════════ */
  /* DATA TABLES */
  /* ═══════════════════════════════════════════════════════ */

  .adm-table-card {
    background: linear-gradient(135deg, var(--bg-light) 0%, var(--bg-secondary) 100%);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all var(--transition-base);
  }

  .adm-table-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, var(--accent-primary) 0%, transparent 100%);
    opacity: 0.3;
  }

  .adm-table-head {
    padding: 24px 28px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    background: rgba(99, 102, 241, 0.02);
  }

  .adm-table-head-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }

  .adm-table-head-sub {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    color: var(--text-tertiary);
    margin-top: 4px;
  }

  .adm-table-wrap {
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border-light) transparent;
  }

  .adm-table-wrap::-webkit-scrollbar {
    height: 6px;
  }

  .adm-table-wrap::-webkit-scrollbar-track {
    background: transparent;
  }

  .adm-table-wrap::-webkit-scrollbar-thumb {
    background: var(--border-light);
    border-radius: 3px;
  }

  table.adm-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 650px;
    background: transparent;
  }

  table.adm-table th {
    padding: 14px 28px;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border-color);
    background: transparent;
    text-align: left;
  }

  table.adm-table th.right {
    text-align: right;
  }

  table.adm-table th.center {
    text-align: center;
  }

  table.adm-table td {
    padding: 16px 28px;
    border-bottom: 1px solid var(--border-color);
    font-size: 14px;
    color: var(--text-secondary);
    vertical-align: middle;
    transition: background var(--transition-fast);
  }

  table.adm-table tr:last-child td {
    border-bottom: none;
  }

  table.adm-table tbody tr:hover {
    background: rgba(99, 102, 241, 0.04);
  }

  table.adm-table tbody tr:hover td {
    background: transparent;
  }

  table.adm-table .td-right {
    text-align: right;
  }

  table.adm-table .td-center {
    text-align: center;
  }

  /* ═══════════════════════════════════════════════════════ */
  /* BADGES */
  /* ═══════════════════════════════════════════════════════ */

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 5px;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border: 1px solid;
  }

  .badge-green {
    color: var(--accent-success);
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.25);
  }

  .badge-amber {
    color: var(--accent-warm);
    background: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.25);
  }

  .badge-red {
    color: var(--accent-danger);
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.25);
  }

  .badge-gray {
    color: var(--text-tertiary);
    background: rgba(255, 255, 255, 0.04);
    border-color: var(--border-color);
  }

  .badge-blue {
    color: var(--accent-info);
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.25);
  }

  /* ═══════════════════════════════════════════════════════ */
  /* BUTTONS */
  /* ═══════════════════════════════════════════════════════ */

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 42px;
    padding: 0 20px;
    background: var(--accent-primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
    letter-spacing: -0.01em;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  }

  .btn-primary svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .btn-primary:hover {
    background: #5558E3;
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
    transform: translateY(-2px);
  }

  .btn-primary:active {
    transform: translateY(0);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 38px;
    padding: 0 16px;
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
  }

  .btn-ghost:hover {
    background: rgba(99, 102, 241, 0.08);
    color: var(--text-primary);
    border-color: var(--border-heavy);
  }

  .btn-ghost:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-icon {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    background: transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }

  .btn-icon svg {
    width: 16px;
    height: 16px;
  }

  .btn-icon:hover {
    border-color: var(--border-light);
    color: var(--text-primary);
    background: rgba(99, 102, 241, 0.08);
  }

  .btn-icon.danger:hover {
    border-color: rgba(239, 68, 68, 0.4);
    color: var(--accent-danger);
    background: rgba(239, 68, 68, 0.1);
  }

  .btn-icon.edit:hover {
    border-color: rgba(99, 102, 241, 0.4);
    color: var(--accent-primary);
    background: var(--accent-primary-light);
  }

  .btn-icon.star-active {
    border-color: rgba(245, 158, 11, 0.4);
    color: var(--accent-warm);
    background: rgba(245, 158, 11, 0.1);
  }

  /* ═══════════════════════════════════════════════════════ */
  /* SEARCH INPUT */
  /* ═══════════════════════════════════════════════════════ */

  .adm-search-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .adm-search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-tertiary);
    pointer-events: none;
    width: 16px;
    height: 16px;
  }

  .adm-search-input {
    height: 40px;
    min-width: 240px;
    padding: 0 12px 0 38px;
    background: var(--bg-light);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: var(--text-primary);
    outline: none;
    transition: all var(--transition-fast);
  }

  .adm-search-input::placeholder {
    color: var(--text-muted);
  }

  .adm-search-input:focus {
    border-color: var(--accent-primary);
    background: var(--bg-secondary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
  }

  /* ═══════════════════════════════════════════════════════ */
  /* PAGINATION */
  /* ═══════════════════════════════════════════════════════ */

  .adm-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 28px;
    border-top: 1px solid var(--border-color);
    background: rgba(99, 102, 241, 0.02);
  }

  .adm-page-nums {
    display: flex;
    gap: 6px;
  }

  .adm-page-num {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .adm-page-num:hover {
    color: var(--text-primary);
    background: rgba(99, 102, 241, 0.08);
  }

  .adm-page-num.active {
    background: var(--accent-primary-light);
    color: var(--accent-primary);
    border-color: var(--accent-primary);
  }

  /* ═══════════════════════════════════════════════════════ */
  /* PROGRESS BAR */
  /* ═══════════════════════════════════════════════════════ */

  .adm-progress-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .adm-progress-bar {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 99px;
    overflow: hidden;
    min-width: 60px;
    max-width: 100px;
  }

  .adm-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
    border-radius: 99px;
    transition: width var(--transition-base);
  }

  .adm-progress-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-tertiary);
    white-space: nowrap;
    min-width: 56px;
  }

  /* ═══════════════════════════════════════════════════════ */
  /* EVENT ROW STYLES */
  /* ═══════════════════════════════════════════════════════ */

  .adm-event-img {
    width: 42px;
    height: 42px;
    border-radius: var(--radius-md);
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid var(--border-color);
  }

  .adm-event-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  .adm-user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    border: 1px solid var(--border-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
  }

  /* ═══════════════════════════════════════════════════════ */
  /* RECENT GRIDS */
  /* ═══════════════════════════════════════════════════════ */

  .adm-recent-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    padding-bottom: 40px;
  }

  @media (min-width: 1200px) {
    .adm-recent-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .adm-upcoming-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    transition: all var(--transition-fast);
  }

  .adm-upcoming-item:hover {
    background: rgba(99, 102, 241, 0.05);
    border-color: var(--border-color);
  }

  .adm-upcoming-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
    margin-bottom: 4px;
  }

  .adm-upcoming-date {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    color: var(--text-tertiary);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* ═══════════════════════════════════════════════════════ */
  /* MODAL */
  /* ═══════════════════════════════════════════════════════ */

  .adm-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: stretch;
    justify-content: flex-end;
    animation: fadeIn var(--transition-base) ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .adm-modal-panel {
    background: var(--bg-secondary);
    border-left: 1px solid var(--border-light);
    width: 100%;
    max-width: 620px;
    height: 100%;
    overflow-y: auto;
    padding: 36px;
    animation: slideLeft var(--transition-base) ease;
    display: flex;
    flex-direction: column;
    scrollbar-width: thin;
    scrollbar-color: var(--border-light) transparent;
  }

  .adm-modal-panel::-webkit-scrollbar {
    width: 8px;
  }

  .adm-modal-panel::-webkit-scrollbar-track {
    background: transparent;
  }

  .adm-modal-panel::-webkit-scrollbar-thumb {
    background: var(--border-light);
    border-radius: 4px;
  }

  @keyframes slideLeft {
    from {
      transform: translateX(40px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .adm-modal-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border-color);
  }

  .adm-modal-eyebrow {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--accent-primary);
    margin-bottom: 6px;
  }

  .adm-modal-title {
    font-size: 22px;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.025em;
  }

  /* ═══════════════════════════════════════════════════════ */
  /* FORMS */
  /* ═══════════════════════════════════════════════════════ */

  .adm-form-section {
    margin-bottom: 32px;
  }

  .adm-form-section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
  }

  .adm-form-section-num {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .adm-form-section-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }

  .adm-form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @media (min-width: 480px) {
    .adm-form-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .adm-form-grid .span2 {
    grid-column: 1 / -1;
  }

  .adm-field-label {
    display: block;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-tertiary);
    margin-bottom: 8px;
  }

  .adm-input,
  .adm-select,
  .adm-textarea {
    width: 100%;
    background: var(--bg-light);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: var(--text-primary);
    outline: none;
    transition: all var(--transition-fast);
  }

  .adm-input,
  .adm-select {
    height: 42px;
    padding: 0 14px;
  }

  .adm-textarea {
    padding: 12px 14px;
    resize: vertical;
    line-height: 1.6;
    min-height: 100px;
  }

  .adm-select {
    color-scheme: dark;
  }

  .adm-select option {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .adm-input:focus,
  .adm-select:focus,
  .adm-textarea:focus {
    border-color: var(--accent-primary);
    background: var(--bg-secondary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .adm-input::placeholder,
  .adm-textarea::placeholder {
    color: var(--text-muted);
  }

  /* ═══════════════════════════════════════════════════════ */
  /* TOGGLE */
  /* ═══════════════════════════════════════════════════════ */

  .adm-toggle-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
  }

  .adm-toggle-track {
    width: 40px;
    height: 22px;
    border-radius: 99px;
    background: var(--bg-light);
    border: 1px solid var(--border-light);
    position: relative;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }

  .adm-toggle-track.on {
    background: var(--accent-primary-light);
    border-color: var(--accent-primary);
  }

  .adm-toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--text-tertiary);
    transition: all var(--transition-fast);
  }

  .adm-toggle-track.on .adm-toggle-thumb {
    transform: translateX(18px);
    background: var(--accent-primary);
  }

  .adm-toggle-label {
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 500;
    user-select: none;
  }

  /* ═══════════════════════════════════════════════════════ */
  /* UPLOAD ZONE */
  /* ═══════════════════════════════════════════════════════ */

  .adm-upload-zone {
    border: 2px dashed var(--border-light);
    border-radius: var(--radius-lg);
    padding: 32px 24px;
    text-align: center;
    cursor: pointer;
    transition: all var(--transition-fast);
    background: rgba(99, 102, 241, 0.02);
  }

  .adm-upload-zone:hover {
    border-color: var(--accent-primary);
    background: var(--accent-primary-lighter);
  }

  .adm-upload-zone label {
    cursor: pointer;
    display: block;
  }

  .adm-upload-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-light);
    background: var(--bg-light);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 14px;
    color: var(--text-tertiary);
    transition: all var(--transition-fast);
  }

  .adm-upload-zone:hover .adm-upload-icon {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
    background: var(--accent-primary-light);
  }

  .adm-upload-zone svg {
    width: 20px;
    height: 20px;
  }

  .adm-upload-main-text {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .adm-upload-sub-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    color: var(--text-tertiary);
    margin-bottom: 14px;
  }

  .adm-upload-chip {
    display: inline-block;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 14px;
    background: var(--accent-primary-light);
    color: var(--accent-primary);
    border: 1px solid var(--accent-primary);
    border-radius: 6px;
    margin-top: 12px;
  }

  /* ═══════════════════════════════════════════════════════ */
  /* MODAL FOOTER */
  /* ═══════════════════════════════════════════════════════ */

  .adm-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 24px;
    margin-top: 32px;
    border-top: 1px solid var(--border-color);
    position: sticky;
    bottom: 0;
    background: var(--bg-secondary);
    padding-bottom: 0;
  }

  .btn-cancel {
    height: 42px;
    padding: 0 22px;
    background: transparent;
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-cancel:hover {
    background: var(--bg-light);
    color: var(--text-primary);
    border-color: var(--border-heavy);
  }

  .btn-submit {
    height: 42px;
    padding: 0 28px;
    background: var(--accent-primary);
    border: none;
    border-radius: var(--radius-md);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: white;
    cursor: pointer;
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  }

  .btn-submit:hover {
    background: #5558E3;
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
    transform: translateY(-2px);
  }

  .btn-submit:active {
    transform: translateY(0);
  }

  .btn-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .spin {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.25);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ═══════════════════════════════════════════════════════ */
  /* RECHARTS CUSTOM TOOLTIP */
  /* ═══════════════════════════════════════════════════════ */

  .adm-tooltip {
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }

  .adm-tooltip-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-tertiary);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .adm-tooltip-val {
    font-family: 'DM Sans', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--accent-primary);
  }

  /* ═══════════════════════════════════════════════════════ */
  /* PRICING BOX */
  /* ═══════════════════════════════════════════════════════ */

  .adm-pricing-box {
    background: var(--bg-light);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 20px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @media (min-width: 480px) {
    .adm-pricing-box {
      grid-template-columns: 1fr 1fr;
    }
  }

  .adm-pricing-box .span2 {
    grid-column: 1 / -1;
  }

  /* ═══════════════════════════════════════════════════════ */
  /* ANIMATIONS */
  /* ═══════════════════════════════════════════════════════ */

  .slide-up {
    animation: slideUp var(--transition-base) ease both;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .stagger-in-1 {
    animation-delay: 100ms;
  }
  .stagger-in-2 {
    animation-delay: 200ms;
  }
  .stagger-in-3 {
    animation-delay: 300ms;
  }
  .stagger-in-4 {
    animation-delay: 400ms;
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
  const [regSearch, setRegSearch] = useState('');

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
    else if (activeTab === 'events') fetchEvents();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'registrations') fetchRegistrations();
  }, [activeTab, eventsPage, usersPage, regsPage, userSearch, regSearch]);

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
      const res = await getAllAdminRegistrations({ page: regsPage, limit: 10, search: regSearch });
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
        } else if (['thumbnail', 'organizer', '_id', '__v', 'createdAt', 'updatedAt', 'id'].includes(key)) {
          // Ignore system fields and populated objects
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
    { id: 'stats', label: 'Overview', icon: <HiOutlineChartBar /> },
    { id: 'events', label: 'Events', icon: <HiOutlineCollection /> },
    { id: 'users', label: 'Users', icon: <HiOutlineUsers /> },
    { id: 'registrations', label: 'Registrations', icon: <HiOutlineTicket /> },
  ];

  return (
    <>
      <style>{styles}</style>

      <div className="adm-root">

        {/* ── SIDEBAR ── */}
        <aside className="adm-sidebar">
          <div className="adm-sidebar-mark">
            <div className="adm-sidebar-label">Admin Control</div>
            <div className="adm-sidebar-title">Dashboard</div>
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
                  <div className="adm-page-eyebrow">📊 Analytics & Insights</div>
                  <div className="adm-page-title">Overview</div>
                  <div className="adm-page-sub">Real-time platform metrics and performance</div>
                </div>
              </div>

              {/* Metrics */}
              <div className="adm-metrics">
                {[
                  { label: 'Total Users', value: stats.totalUsers, icon: <HiOutlineUsers />, color: '#3B82F6' },
                  { label: 'Total Events', value: stats.totalEvents, icon: <HiOutlineCollection />, color: '#6366F1' },
                  { label: 'Registrations', value: stats.totalRegistrations, icon: <HiOutlineTicket />, color: '#EC4899' },
                  { label: 'Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, icon: <HiOutlineChartBar />, color: '#10B981' },
                ].map((m, i) => (
                  <div className="adm-metric-card" key={i}>
                    <div className="adm-metric-icon" style={{ color: m.color }}>
                      {m.icon}
                    </div>
                    <div className="adm-metric-label">{m.label}</div>
                    <div className="adm-metric-value">{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="adm-charts">
                <div className="adm-chart-card" style={{ height: 340 }}>
                  <div className="adm-chart-title">📈 Monthly Registrations</div>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={stats.monthlyRegistrations} margin={{ top: 10, right: 0, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="_id" stroke="#64748B" tick={{ fontSize: 12, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} dy={8} />
                      <YAxis stroke="#64748B" tick={{ fontSize: 12, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
                      <Bar dataKey="count" fill="url(#gradientBar)" radius={[6, 6, 0, 0]} maxBarSize={45} />
                      <defs>
                        <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366F1" />
                          <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="adm-chart-card" style={{ height: 340, display: 'flex', flexDirection: 'column' }}>
                  <div className="adm-chart-title">🎭 Events by Category</div>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.categoryBreakdown}
                          dataKey="count"
                          nameKey="_id"
                          cx="50%" cy="50%"
                          innerRadius={60}
                          outerRadius={110}
                          stroke="#1E293B"
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
                        <div style={{ fontFamily: 'Outfit', fontSize: 32, fontWeight: 800, color: '#F8FAFC', lineHeight: 1 }}>{stats.totalEvents}</div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748B', marginTop: 6, fontWeight: 700 }}>events</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent */}
              <div className="adm-recent-grid">
                <div className="adm-chart-card">
                  <div className="adm-chart-title">📋 Recent Registrations</div>
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
                          <td style={{ color: '#F8FAFC', fontWeight: 600, fontSize: 13 }}>{reg.user?.name}</td>
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
                  <div className="adm-chart-title">📅 Upcoming Events</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {stats.upcomingEvents.map(event => {
                      const fill = Math.min((event.registeredCount / event.capacity) * 100, 100);
                      return (
                        <div key={event._id} className="adm-upcoming-item">
                          <div style={{ minWidth: 0, flex: 1, paddingRight: 16 }}>
                            <div className="adm-upcoming-title">{event.title}</div>
                            <div className="adm-upcoming-date">
                              <HiOutlineClock style={{ width: 12, height: 12 }} />
                              {new Date(event.date).toLocaleDateString()}
                            </div>
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
                  <div className="adm-page-eyebrow">🎭 Management</div>
                  <div className="adm-page-title">Events</div>
                  <div className="adm-page-sub">Create, edit, and manage festival listings</div>
                </div>
                <button className="btn-primary" onClick={() => openEventModal()}>
                  <HiOutlinePlus /> New Festival
                </button>
              </div>

              <div className="adm-table-card">
                <div className="adm-table-head">
                  <div>
                    <div className="adm-table-head-title">All Events</div>
                    <div className="adm-table-head-sub">{events.length} events on this page</div>
                  </div>
                </div>
                <div className="adm-table-wrap">
                  <table className="adm-table" style={{ minWidth: 900 }}>
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
                        const isOwner = event.organizer && (
                          (typeof event.organizer === 'object' && event.organizer._id === user?._id) ||
                          (typeof event.organizer === 'string' && event.organizer === user?._id)
                        );
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
                                  <span className="badge badge-gray" style={{ marginTop: 6 }}>{event.category}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{new Date(event.date).toLocaleDateString()}</div>
                              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#64748B', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <HiOutlineLocationMarker style={{ width: 12, height: 12 }} />
                                {event.city}
                              </div>
                            </td>
                            <td>
                              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 700, color: event.isFree ? '#10B981' : '#F8FAFC' }}>
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
                                onClick={() => isOwner && handleToggleFeatured(event._id)}
                                className={`btn-icon ${event.isFeatured ? 'star-active' : ''}`}
                                style={!isOwner ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
                                title={isOwner ? "Toggle Featured" : "Only the organizer can feature this event"}
                                disabled={!isOwner}
                              >
                                {event.isFeatured ? <HiStar style={{ width: 16, height: 16 }} /> : <HiOutlineStar style={{ width: 16, height: 16 }} />}
                              </button>
                            </td>
                            <td className="td-right">
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => isOwner && openEventModal(event)}
                                  className="btn-icon edit"
                                  style={!isOwner ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
                                  title={isOwner ? "Edit" : "Only the organizer can edit this event"}
                                  disabled={!isOwner}
                                >
                                  <HiOutlinePencilAlt />
                                </button>
                                <button
                                  onClick={() => isOwner && handleEventDelete(event._id)}
                                  className="btn-icon danger"
                                  style={!isOwner ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
                                  title={isOwner ? "Delete" : "Only the organizer can delete this event"}
                                  disabled={!isOwner}
                                >
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
                  <div className="adm-page-eyebrow">👥 Management</div>
                  <div className="adm-page-title">Users</div>
                  <div className="adm-page-sub">Manage user roles and access</div>
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
                <div className="adm-table-head">
                  <div>
                    <div className="adm-table-head-title">Platform Users</div>
                    <div className="adm-table-head-sub">{users.length} users on this page</div>
                  </div>
                </div>
                <div className="adm-table-wrap">
                  <table className="adm-table" style={{ minWidth: 700 }}>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div className="adm-user-avatar">{u.name.charAt(0)}</div>
                              <span style={{ fontWeight: 600, fontSize: 14, color: '#F8FAFC' }}>{u.name}</span>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'JetBrains Mono', fontSize: 13 }}>{u.email}</td>
                          <td>
                            <span className={`badge ${u.role === 'admin' ? 'badge-amber' : 'badge-gray'}`}>{u.role}</span>
                          </td>
                          <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="td-right">
                            {u._id !== user._id && (
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
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
                  <div className="adm-page-eyebrow">🎫 Data</div>
                  <div className="adm-page-title">Registrations</div>
                  <div className="adm-page-sub">Track all ticket sales and bookings</div>
                </div>
                <div className="adm-search-wrap">
                  <HiOutlineSearch className="adm-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or event..."
                    value={regSearch}
                    onChange={e => setRegSearch(e.target.value)}
                    className="adm-search-input"
                  />
                </div>
              </div>

              <div className="adm-table-card">
                <div className="adm-table-head">
                  <div>
                    <div className="adm-table-head-title">All Registrations</div>
                    <div className="adm-table-head-sub">{registrations.length} registrations on this page</div>
                  </div>
                </div>
                <div className="adm-table-wrap">
                  <table className="adm-table" style={{ minWidth: 800 }}>
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
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#F8FAFC' }}>{r.user?.name}</div>
                            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#64748B', marginTop: 4 }}>{r.user?.email}</div>
                          </td>
                          <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.event?.title || r.event}</td>
                          <td>
                            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>₹{r.totalAmount}</span>
                          </td>
                          <td>
                            <span className={`badge ${r.status === 'confirmed' ? 'badge-green' : 'badge-red'}`}>{r.status}</span>
                          </td>
                          <td className="td-right" style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>
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

      {/* ── EVENT MODAL ── */}
      {eventModalOpen && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && setEventModalOpen(false)}>
          <div className="adm-modal-panel">
            <div className="adm-modal-top">
              <div>
                <div className="adm-modal-eyebrow">{currentEvent ? '✏️ Editing' : '✨ New Festival'}</div>
                <div className="adm-modal-title">{currentEvent ? currentEvent.title : 'Create Festival'}</div>
              </div>
              <button className="btn-icon" onClick={() => setEventModalOpen(false)} style={{ flexShrink: 0 }}>
                <HiOutlineX style={{ width: 18, height: 18 }} />
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
                    <label className="adm-field-label">Festival Title</label>
                    <input required type="text" className="adm-input" value={eventFormData.title} onChange={e => setEventFormData({ ...eventFormData, title: e.target.value })} placeholder="Enter festival name" />
                  </div>
                  <div>
                    <label className="adm-field-label">Category</label>
                    <select className="adm-select" value={eventFormData.category} onChange={e => setEventFormData({ ...eventFormData, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="adm-field-label">Cultural Origin</label>
                    <input type="text" className="adm-input" value={eventFormData.culturalOrigin} onChange={e => setEventFormData({ ...eventFormData, culturalOrigin: e.target.value })} placeholder="e.g., South Indian" />
                  </div>
                  <div>
                    <label className="adm-field-label">Event Date</label>
                    <input required type="date" className="adm-input" value={eventFormData.date} onChange={e => setEventFormData({ ...eventFormData, date: e.target.value })} />
                  </div>
                  <div>
                    <label className="adm-field-label">City</label>
                    <input required type="text" className="adm-input" value={eventFormData.city} onChange={e => setEventFormData({ ...eventFormData, city: e.target.value })} placeholder="e.g., Mumbai" />
                  </div>
                  <div>
                    <label className="adm-field-label">Venue Name</label>
                    <input required type="text" className="adm-input" value={eventFormData.venue} onChange={e => setEventFormData({ ...eventFormData, venue: e.target.value })} placeholder="e.g., Indoor Stadium" />
                  </div>
                  <div>
                    <label className="adm-field-label">State</label>
                    <input type="text" className="adm-input" value={eventFormData.state} onChange={e => setEventFormData({ ...eventFormData, state: e.target.value })} placeholder="e.g., Maharashtra" />
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="adm-form-section">
                <div className="adm-form-section-header">
                  <div className="adm-form-section-num">2</div>
                  <div className="adm-form-section-title">Descriptions</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="adm-field-label">Short Description (Max 200 chars)</label>
                    <textarea maxLength="200" rows="2" className="adm-textarea" value={eventFormData.shortDescription} onChange={e => setEventFormData({ ...eventFormData, shortDescription: e.target.value })} placeholder="Brief summary for listing..." />
                  </div>
                  <div>
                    <label className="adm-field-label">Full Description</label>
                    <textarea required rows="5" className="adm-textarea" value={eventFormData.description} onChange={e => setEventFormData({ ...eventFormData, description: e.target.value })} placeholder="Detailed information about the festival..." />
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
                      <input type="number" min="0" className="adm-input" value={eventFormData.price} onChange={e => setEventFormData({ ...eventFormData, price: e.target.value })} placeholder="0" />
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
                    <div className="adm-upload-chip">✓ {eventFormData.images.length} files selected</div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="adm-modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setEventModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={eventSaving}>
                  {eventSaving && <div className="spin" />}
                  {currentEvent ? 'Save Changes' : 'Create Festival'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default AdminDashboard;
