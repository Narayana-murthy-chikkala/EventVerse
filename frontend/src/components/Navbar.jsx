import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { HiChevronDown } from 'react-icons/hi2';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');

  /* ════════════════════════════════════════════════════════ */
  /* LIGHT THEME (Default for non-admin pages) */
  /* ════════════════════════════════════════════════════════ */
  
  .navbar {
    --primary-terra: #D4522A;
    --primary-light: #E8835E;
    --primary-dark: #A33E1C;
    --white: #FFFFFF;
    --bg-light: #FAFAF8;
    --bg-lighter: #FFFFFF;
    --text-dark: #1A1510;
    --text-gray: #5A5048;
    --text-light: #8B7D6F;
    --border-light: #E5DDD5;
    --border-lighter: #F0E8E0;
  }

  /* ════════════════════════════════════════════════════════ */
  /* DARK THEME (For admin pages) */
  /* ════════════════════════════════════════════════════════ */
  
  .navbar.admin-theme {
    --primary-terra: #6366F1;
    --primary-light: #818CF8;
    --primary-dark: #4F46E5;
    --white: #FFFFFF;
    --bg-light: #1E293B;
    --bg-lighter: #0F172A;
    --text-dark: #F8FAFC;
    --text-gray: #CBD5E1;
    --text-light: #94A3B8;
    --border-light: rgba(255, 255, 255, 0.08);
    --border-lighter: rgba(255, 255, 255, 0.12);
  }

  .navbar-root {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* ──── LIGHT THEME: Glassy effect - scrolled state ──── */
  .navbar:not(.admin-theme) .navbar-root.scrolled {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.72) 0%, rgba(248, 248, 246, 0.55) 100%);
    backdrop-filter: blur(35px) saturate(180%) brightness(1.05);
    -webkit-backdrop-filter: blur(35px) saturate(180%) brightness(1.05);
    border-bottom: 1px solid rgba(229, 221, 213, 0.35);
    box-shadow: 0 12px 56px rgba(26, 21, 16, 0.14), 
                inset 0 1px 1px rgba(255, 255, 255, 0.6);
  }

  /* ──── LIGHT THEME: Glassy effect - non-scrolled state ──── */
  .navbar:not(.admin-theme) .navbar-root:not(.scrolled) {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(250, 250, 248, 0.25) 100%);
    backdrop-filter: blur(25px) saturate(160%);
    -webkit-backdrop-filter: blur(25px) saturate(160%);
    border-bottom: 1px solid rgba(240, 232, 224, 0.15);
  }

  /* ──── DARK THEME: Glassy effect - scrolled state ──── */
  .navbar.admin-theme .navbar-root.scrolled {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.75) 100%);
    backdrop-filter: blur(35px) saturate(180%) brightness(1.05);
    -webkit-backdrop-filter: blur(35px) saturate(180%) brightness(1.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 12px 56px rgba(0, 0, 0, 0.3), 
                inset 0 1px 1px rgba(255, 255, 255, 0.1);
  }

  /* ──── DARK THEME: Glassy effect - non-scrolled state ──── */
  .navbar.admin-theme .navbar-root:not(.scrolled) {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.5) 100%);
    backdrop-filter: blur(25px) saturate(160%);
    -webkit-backdrop-filter: blur(25px) saturate(160%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* Scroll direction animations */
  .navbar-root.scroll-up {
    transform: translateY(0);
    opacity: 1;
  }

  .navbar-root.scroll-down {
    transform: translateY(-110%);
    opacity: 0.8;
  }

  .navbar-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 72px;
  }

  .navbar-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    flex-shrink: 0;
  }

  .navbar-logo:hover .navbar-logo-emoji {
    transform: scale(1.15) rotate(10deg);
  }

  .navbar-logo-emoji {
    font-size: 28px;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .navbar-logo-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.01em;
    background: linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .navbar-nav {
    display: none;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 32px;
  }

  @media (min-width: 768px) {
    .navbar-nav {
      display: flex;
    }
  }

  .navbar-nav-link {
    position: relative;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-gray);
    text-decoration: none;
    transition: color 0.3s;
  }

  .navbar-nav-link::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-terra) 0%, var(--primary-light) 100%);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .navbar-nav-link:hover {
    color: var(--text-dark);
  }

  .navbar-nav-link:hover::after,
  .navbar-nav-link.active::after {
    transform: scaleX(1);
  }

  .navbar-nav-link.active {
    color: var(--text-dark);
    font-weight: 600;
  }

  .navbar-actions {
    display: none;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  @media (min-width: 768px) {
    .navbar-actions {
      display: flex;
    }
  }

  .btn-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px 20px;
    background: rgba(255, 255, 255, 0.3);
    color: var(--text-gray);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    border: 1.5px solid rgba(229, 221, 213, 0.4);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    white-space: nowrap;
    backdrop-filter: blur(10px);
  }

  .navbar.admin-theme .btn-ghost {
    background: rgba(99, 102, 241, 0.1);
    border: 1.5px solid rgba(99, 102, 241, 0.3);
  }

  .btn-ghost:hover {
    background: rgba(255, 255, 255, 0.5);
    border-color: var(--primary-terra);
    color: var(--text-dark);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 82, 42, 0.12);
  }

  .navbar.admin-theme .btn-ghost:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: var(--primary-terra);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.2);
  }

  .btn-ghost:active {
    transform: scale(0.97);
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 28px;
    background: linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%);
    color: white;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 8px 24px rgba(212, 82, 42, 0.25);
    white-space: nowrap;
    backdrop-filter: blur(10px);
  }

  .navbar.admin-theme .btn-primary {
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
  }

  .btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 36px rgba(212, 82, 42, 0.32);
  }

  .navbar.admin-theme .btn-primary:hover {
    box-shadow: 0 14px 36px rgba(99, 102, 241, 0.4);
  }

  .btn-primary:active {
    transform: scale(0.97);
  }

  .navbar-mobile-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.2);
    color: var(--text-gray);
    border: 1px solid rgba(229, 221, 213, 0.3);
    cursor: pointer;
    transition: all 0.3s;
    font-size: 24px;
    backdrop-filter: blur(10px);
  }

  .navbar.admin-theme .navbar-mobile-toggle {
    background: rgba(99, 102, 241, 0.1);
    border-color: rgba(99, 102, 241, 0.3);
  }

  @media (min-width: 768px) {
    .navbar-mobile-toggle {
      display: none;
    }
  }

  .navbar-mobile-toggle:hover {
    background: rgba(255, 255, 255, 0.4);
    color: var(--text-dark);
    border-color: var(--primary-terra);
  }

  .navbar.admin-theme .navbar-mobile-toggle:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: var(--primary-terra);
  }

  .navbar-mobile-menu {
    display: none;
    @media (max-width: 767px) {
      display: block;
    }
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(250, 250, 248, 0.6) 100%);
    border-bottom: 1px solid rgba(229, 221, 213, 0.3);
    backdrop-filter: blur(35px) saturate(180%);
    -webkit-backdrop-filter: blur(35px) saturate(180%);
    box-shadow: 0 12px 48px rgba(26, 21, 16, 0.12);
    transform-origin: top;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .navbar.admin-theme .navbar-mobile-menu {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
  }

  .navbar-mobile-menu.open {
    max-height: 500px;
  }

  .navbar-mobile-menu:not(.open) {
    max-height: 0;
    overflow: hidden;
  }

  .navbar-mobile-content {
    padding: 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .navbar-mobile-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    color: var(--text-gray);
    text-decoration: none;
    border-radius: 6px;
    transition: all 0.3s;
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
  }

  .navbar-mobile-link:hover {
    background: rgba(212, 82, 42, 0.08);
    color: var(--text-dark);
    padding-left: 20px;
  }

  .navbar.admin-theme .navbar-mobile-link:hover {
    background: rgba(99, 102, 241, 0.1);
  }

  .navbar-mobile-link.active {
    color: var(--text-dark);
    font-weight: 600;
  }

  /* User Menu */
  .navbar-user-menu {
    position: relative;
  }

  .navbar-user-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.3s;
  }

  .navbar-user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .navbar-user-avatar-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%);
    color: white;
    font-size: 12px;
    font-weight: 700;
  }

  .navbar-chevron {
    transition: transform 0.3s;
  }

  .navbar-chevron.open {
    transform: rotate(180deg);
  }

  .navbar-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    min-width: 200px;
    margin-top: 8px;
    background: var(--bg-lighter);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 1000;
  }

  .navbar.admin-theme .navbar-dropdown {
    background: var(--bg-light);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  }

  .navbar-dropdown.open {
    max-height: 500px;
    opacity: 1;
  }

  .navbar-dropdown-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-lighter);
  }

  .navbar-dropdown-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-dark);
    margin: 0 0 4px 0;
  }

  .navbar-dropdown-email {
    font-size: 12px;
    color: var(--text-light);
    margin: 0;
  }

  .navbar-dropdown-item {
    padding: 12px 16px;
    font-size: 14px;
    color: var(--text-gray);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    width: 100%;
    text-align: left;
  }

  .navbar-dropdown-item:hover {
    background: rgba(212, 82, 42, 0.08);
    color: var(--text-dark);
    padding-left: 24px;
  }

  .navbar.admin-theme .navbar-dropdown-item:hover {
    background: rgba(99, 102, 241, 0.1);
  }

  .navbar-dropdown-item.logout {
    color: var(--primary-terra);
    border-top: 1px solid var(--border-lighter);
  }

  .navbar-dropdown-item.logout:hover {
    background: rgba(212, 82, 42, 0.12);
  }

  .navbar.admin-theme .navbar-dropdown-item.logout:hover {
    background: rgba(99, 102, 241, 0.15);
  }

  .navbar-dropdown-emoji {
    font-size: 16px;
    opacity: 0.8;
    flex-shrink: 0;
  }
`;

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState('up');
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();

  // Check if we're on admin page
  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Detect scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }

      // Detect if scrolled past threshold
      setScrolled(currentScrollY > 60);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.navbar-user-menu')) setDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const navLinks = [
    { to: '/home', label: 'Home' },
    { to: '/events', label: 'Festivals' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/about-us', label: 'About Us' },
  ];

  const getInitials = (name) =>
    name
      ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
      : 'U';

  return (
    <>
      <style>{css}</style>
      <div className={`navbar ${isAdminPage ? 'admin-theme' : ''}`}>
        <nav className={`navbar-root ${scrolled ? 'scrolled' : ''} ${scrollDirection === 'down' ? 'scroll-down' : 'scroll-up'}`}>
          <div className="navbar-content">
            {/* Logo */}
            <Link to="/home" className="navbar-logo">
              <span className="navbar-logo-emoji">🪔</span>
              <span className="navbar-logo-text">EventVerse</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="navbar-nav">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `navbar-nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="navbar-actions">
              {!user ? (
                <>
                  <Link to="/login" className="btn-ghost">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Register
                  </Link>
                </>
              ) : (
                <div className="navbar-user-menu">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="navbar-user-button"
                    title={user.name}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="navbar-user-avatar"
                      />
                    ) : (
                      <div className="navbar-user-avatar-fallback">
                        {getInitials(user.name)}
                      </div>
                    )}
                    <HiChevronDown className={`navbar-chevron ${dropdownOpen ? 'open' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  <div className={`navbar-dropdown ${dropdownOpen ? 'open' : ''}`}>
                    <div className="navbar-dropdown-header">
                      <p className="navbar-dropdown-name">{user.name}</p>
                      <p className="navbar-dropdown-email">{user.email}</p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="navbar-dropdown-item"
                    >
                      <span className="navbar-dropdown-emoji">🎫</span>
                      My Tickets
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="navbar-dropdown-item"
                    >
                      <span className="navbar-dropdown-emoji">👤</span>
                      Profile
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="navbar-dropdown-item"
                      >
                        <span className="navbar-dropdown-emoji">⚙️</span>
                        Admin Panel
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="navbar-dropdown-item logout"
                    >
                      <span className="navbar-dropdown-emoji">🚪</span>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="navbar-mobile-toggle"
            >
              {mobileOpen ? <HiOutlineX /> : <HiOutlineMenu />}
            </button>
          </div>

          {/* Mobile Menu */}
          <div className={`navbar-mobile-menu ${mobileOpen ? 'open' : ''}`}>
            <div className="navbar-mobile-content">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `navbar-mobile-link ${isActive ? 'active' : ''}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="navbar-mobile-link"
                  >
                    <span>🎫</span> My Tickets
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="navbar-mobile-link"
                  >
                    <span>👤</span> Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="navbar-mobile-link"
                    >
                      <span>⚙️</span> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="navbar-mobile-link"
                    style={{ color: 'var(--primary-terra)' }}
                  >
                    <span>🚪</span> Logout
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid var(--border-lighter)` }}>
                  <Link to="/login" className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Navbar;