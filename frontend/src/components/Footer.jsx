import { Link } from 'react-router-dom';
import { FaInstagram, FaFacebookF, FaYoutube, FaTwitter } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const categories = [
    'Classical Music',
    'Folk Dance',
    'Art Exhibition',
    'Food Festival',
    'Theater & Drama',
  ];

  return (
    <footer className="w-full bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.06)] pt-16 pb-6 mt-auto text-text-muted relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group inline-block">
              <span className="text-[26px] group-hover:scale-110 transition-transform duration-300">🪔</span>
              <span className="font-sans text-[22px] font-[800] tracking-[-0.02em] bg-accent-gradient bg-clip-text text-transparent">
                SanskritiUtsav
              </span>
            </Link>
            <p className="text-[14px] leading-relaxed max-w-xs">
              Celebrating India's Living Culture. Discover, register, and experience vibrant cultural festivals near you.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(255,255,255,0.06)] text-text-muted hover:text-white hover:bg-accent-gradient hover:shadow-glow-primary transition-all duration-250 hover:scale-110">
                <FaInstagram size={16} className="flex-shrink-0" />
              </a>
              <a href="#" className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(255,255,255,0.06)] text-text-muted hover:text-white hover:bg-accent-gradient hover:shadow-glow-primary transition-all duration-250 hover:scale-110">
                <FaFacebookF size={16} className="flex-shrink-0" />
              </a>
              <a href="#" className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(255,255,255,0.06)] text-text-muted hover:text-white hover:bg-accent-gradient hover:shadow-glow-primary transition-all duration-250 hover:scale-110">
                <FaYoutube size={16} className="flex-shrink-0" />
              </a>
              <a href="#" className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(255,255,255,0.06)] text-text-muted hover:text-white hover:bg-accent-gradient hover:shadow-glow-primary transition-all duration-250 hover:scale-110">
                <FaTwitter size={16} className="flex-shrink-0" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[11px] font-[700] tracking-[0.08em] uppercase text-text-subtle mb-6">Explore</h3>
            <ul className="space-y-3">
              {['Home', 'Festivals', 'Gallery', 'About Us', 'Contact'].map((link) => (
                <li key={link}>
                  <Link 
                    to={link === 'Home' ? '/' : `/${link.toLowerCase().replace(' ', '-')}`}
                    className="text-[14px] flex items-center group transition-colors duration-200"
                  >
                    <span className="w-0 overflow-hidden text-accent-cyan group-hover:w-4 transition-all duration-200">→</span>
                    <span className="group-hover:text-text-primary group-hover:translate-x-1 transition-transform duration-200">
                      {link}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-[11px] font-[700] tracking-[0.08em] uppercase text-text-subtle mb-6">Categories</h3>
            <ul className="space-y-3">
              {categories.map((cat) => (
                <li key={cat}>
                  <Link 
                    to={`/events?category=${encodeURIComponent(cat)}`}
                    className="text-[14px] flex items-center group transition-colors duration-200"
                  >
                    <span className="w-0 overflow-hidden text-accent-cyan group-hover:w-4 transition-all duration-200">→</span>
                    <span className="group-hover:text-text-primary group-hover:translate-x-1 transition-transform duration-200">
                      {cat}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[11px] font-[700] tracking-[0.08em] uppercase text-text-subtle mb-6">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-accent-secondary mt-1">📧</span>
                <div>
                  <p className="text-[14px] text-text-primary">Email</p>
                  <a href="mailto:namaste@sanskritiutsav.in" className="text-[13px] hover:text-accent-cyan transition-colors">
                    namaste@sanskritiutsav.in
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent-secondary mt-1">📞</span>
                <div>
                  <p className="text-[14px] text-text-primary">Phone</p>
                  <p className="text-[13px]">+91 98765 43210</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent-secondary mt-1">📍</span>
                <div>
                  <p className="text-[14px] text-text-primary">Address</p>
                  <p className="text-[13px] leading-relaxed">
                    Cultural Center, 12th Avenue<br />
                    New Delhi, India 110001
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[rgba(255,255,255,0.04)] flex flex-col sm:flex-row justify-between items-center gap-4 relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-accent-gradient opacity-50 hidden md:block"></div>
          <p className="text-[13px] text-center sm:text-left text-text-subtle">
            &copy; {currentYear} SanskritiUtsav. All rights reserved.
          </p>
          <p className="text-[13px] text-center sm:text-right text-text-subtle flex items-center gap-1.5">
            Made with <span className="text-danger animate-pulse">❤️</span> for Indian Culture
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
