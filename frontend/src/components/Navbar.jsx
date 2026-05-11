import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { HiChevronDown } from 'react-icons/hi2';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) setDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Festivals' },
    { to: '/gallery', label: 'Gallery' },
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
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-[var(--ease-default)] ${
        scrolled
          ? 'bg-[rgba(10,10,15,0.85)] backdrop-blur-[20px] border-b border-[rgba(255,255,255,0.1)] shadow-card'
          : 'bg-[rgba(10,10,15,0.5)] backdrop-blur-[10px] border-b border-[rgba(255,255,255,0.06)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-[26px] group-hover:scale-110 transition-transform duration-300">🪔</span>
            <span className="font-sans text-[22px] font-[800] tracking-[-0.02em] bg-accent-gradient bg-clip-text text-transparent">
              SanskritiUtsav
            </span>
          </Link>

          <div className="hidden md:flex items-center justify-center flex-1 gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `relative font-sans font-medium text-[14px] transition-colors duration-200 group ${
                    isActive ? 'text-white' : 'text-text-muted hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    <span
                      className={`absolute -bottom-1 left-0 right-0 h-[2px] bg-accent-gradient origin-left transition-transform duration-300 ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="hidden md:flex items-center justify-end gap-4 flex-shrink-0">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 text-[14px] font-medium text-text-muted border border-[rgba(255,255,255,0.12)] rounded-full hover:border-[rgba(255,255,255,0.3)] hover:text-white transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.98] whitespace-nowrap"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2 text-[14px] font-[600] text-white bg-accent-gradient rounded-full hover:shadow-glow-primary transition-all duration-300 hover:-translate-y-[1px] active:scale-[0.98] whitespace-nowrap"
                >
                  Register
                </Link>
              </>
            ) : (
              <div className="relative dropdown-container">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-[rgba(255,255,255,0.06)] transition-colors active:scale-[0.98]"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-[rgba(255,255,255,0.1)]"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-card-gradient flex items-center justify-center text-white text-sm font-bold ring-2 ring-[rgba(255,255,255,0.1)]">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <HiChevronDown
                    className={`w-4 h-4 text-text-muted transition-transform duration-300 ${
                      dropdownOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-[rgba(10,10,15,0.95)] backdrop-blur-[20px] rounded-xl shadow-modal border border-[rgba(255,255,255,0.1)] py-2 animate-slide-up z-50">
                    <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] mb-1">
                      <p className="text-sm font-[600] text-white truncate">{user.name}</p>
                      <p className="text-xs text-text-muted truncate mt-0.5">{user.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-[10px] text-[14px] text-text-muted hover:bg-[rgba(255,255,255,0.06)] hover:text-white transition-colors"
                    >
                      <span className="opacity-70">🎫</span> My Tickets
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-[10px] text-[14px] text-text-muted hover:bg-[rgba(255,255,255,0.06)] hover:text-white transition-colors"
                    >
                      <span className="opacity-70">👤</span> Profile
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-[10px] text-[14px] text-text-muted hover:bg-[rgba(255,255,255,0.06)] hover:text-white transition-colors"
                      >
                        <span className="opacity-70">⚙️</span> Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-[rgba(255,255,255,0.06)] mt-1 pt-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-[10px] text-[14px] text-danger hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                      >
                        <span className="opacity-70">🚪</span> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-text-muted hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors active:scale-[0.98]"
            >
              {mobileOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`md:hidden bg-[rgba(10,10,15,0.98)] border-b border-[rgba(255,255,255,0.06)] backdrop-blur-card absolute w-full transition-transform duration-300 origin-top overflow-hidden shadow-card ${
          mobileOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
        }`}
        style={{ top: '100%' }}
      >
        <div className="px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-[15px] font-[500] transition-colors ${
                  isActive
                    ? 'bg-[rgba(124,58,237,0.15)] text-white border border-[rgba(124,58,237,0.3)]'
                    : 'text-text-muted hover:bg-[rgba(255,255,255,0.04)] hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {user ? (
            <div className="pt-2 mt-2 border-t border-[rgba(255,255,255,0.06)] space-y-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium text-text-muted hover:bg-[rgba(255,255,255,0.04)] hover:text-white transition-colors"
              >
                <span>🎫</span> My Tickets
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium text-text-muted hover:bg-[rgba(255,255,255,0.04)] hover:text-white transition-colors"
              >
                <span>👤</span> Profile
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium text-text-muted hover:bg-[rgba(255,255,255,0.04)] hover:text-white transition-colors"
                >
                  <span>⚙️</span> Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium text-danger hover:bg-[rgba(239,68,68,0.1)] transition-colors"
              >
                <span>🚪</span> Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-[rgba(255,255,255,0.06)]">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center w-full px-4 py-3 text-[15px] font-[500] text-text-muted border border-[rgba(255,255,255,0.12)] rounded-full hover:bg-[rgba(255,255,255,0.04)] hover:text-white transition-colors active:scale-[0.98] whitespace-nowrap"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center w-full px-4 py-3 text-[15px] font-[600] text-white bg-accent-gradient rounded-full hover:shadow-glow-primary transition-all active:scale-[0.98] whitespace-nowrap"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
