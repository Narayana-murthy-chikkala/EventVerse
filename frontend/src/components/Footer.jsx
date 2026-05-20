import { Link, useLocation } from 'react-router-dom';
import { FaInstagram, FaFacebookF, FaYoutube, FaTwitter } from 'react-icons/fa';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Poppins:wght@300;400;500;600;700&display=swap');

  .footer {
    --primary-terra: #D4522A;
    --primary-light: #E8835E;
    --white: #FFFFFF;
    --bg-light: #FAFAF8;
    --bg-lighter: #FFFFFF;
    --text-dark: #1A1510;
    --text-gray: #5A5048;
    --text-light: #8B7D6F;
    --border-light: #E5DDD5;
    --border-lighter: #F0E8E0;
  }

  .footer.admin-theme {
    --primary-terra: #6366F1;
    --primary-light: #818CF8;
    --white: #FFFFFF;
    --bg-light: #1E293B;
    --bg-lighter: #0F172A;
    --text-dark: #F8FAFC;
    --text-gray: #CBD5E1;
    --text-light: #94A3B8;
    --border-light: rgba(255, 255, 255, 0.08);
    --border-lighter: rgba(255, 255, 255, 0.12);
  }

  .footer-root {
    width: 100%;
    background: linear-gradient(180deg, var(--bg-lighter) 0%, var(--bg-light) 100%);
    padding-top: 100px;
    padding-bottom: 24px;
    margin-top: auto;
    position: relative;
    z-index: 10;
  }

  .footer-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 48px;
    margin-bottom: 48px;
  }

  @media (min-width: 768px) {
    .footer-grid {
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 40px;
    }
  }

  /* Brand Section */
  .footer-brand {
    space-y: 16px;
  }

  .footer-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    margin-bottom: 16px;
    transition: all 0.3s;
  }

  .footer-logo:hover .footer-logo-emoji {
    transform: scale(1.15) rotate(10deg);
  }

  .footer-logo-emoji {
    font-size: 28px;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .footer-logo-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 22px;
    font-weight: 800;
    background: linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .footer-description {
    font-size: 14px;
    line-height: 1.7;
    max-width: 280px;
    color: var(--text-gray);
    margin-bottom: 16px;
  }

  .footer-socials {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .footer-social-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--bg-light);
    border: 1.5px solid var(--border-light);
    color: var(--text-gray);
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    font-size: 14px;
  }

  .footer-social-link:hover {
    background: linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%));
    border-color: transparent;
    color: white;
    transform: scale(1.1);
    box-shadow: 0 8px 20px rgba(212, 82, 42, 0.2);
  }

  /* Footer Column */
  .footer-column {
    display: flex;
    flex-direction: column;
  }

  .footer-column-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-light);
    margin-bottom: 24px;
  }

  .footer-column-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .footer-column-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--text-gray);
    text-decoration: none;
    transition: all 0.3s;
  }

  .footer-column-link:hover {
    color: var(--text-dark);
    gap: 12px;
  }

  .footer-column-arrow {
    width: 0;
    overflow: hidden;
    color: var(--primary-terra);
    transition: width 0.3s;
  }

  .footer-column-link:hover .footer-column-arrow {
    width: 16px;
  }

  /* Contact Section */
  .footer-contact-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .footer-contact-emoji {
    font-size: 20px;
    margin-top: 2px;
    flex-shrink: 0;
  }

  .footer-contact-info h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-dark);
    margin: 0 0 4px 0;
  }

  .footer-contact-info p {
    font-size: 13px;
    color: var(--text-gray);
    margin: 0;
    line-height: 1.6;
  }

  .footer-contact-info a {
    color: var(--text-gray);
    text-decoration: none;
    transition: color 0.3s;
  }

  .footer-contact-info a:hover {
    color: var(--primary-terra);
  }

  .footer-contact-item:nth-child(n+2) {
    margin-top: 16px;
  }

  /* Bottom Bar */
  .footer-bottom {
    padding-top: 24px;
    border-top: 1px solid var(--border-lighter);
    position: relative;
  }

  .footer-bottom::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, var(--primary-terra) 20%, var(--primary-terra) 80%, transparent 100%);
    opacity: 0.5;
  }

  .footer-bottom-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    text-align: center;
  }

  @media (min-width: 640px) {
    .footer-bottom-content {
      flex-direction: row;
      justify-content: space-between;
      text-align: left;
    }
  }

  .footer-bottom-text {
    font-size: 13px;
    color: var(--text-light);
  }

  .footer-bottom-heart {
    display: inline-block;
    color: var(--primary-terra);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.1); }
  }
`;

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  const categories = [
    'Classical Music',
    'Folk Dance',
    'Art Exhibition',
    'Food Festival',
    'Theater & Drama',
  ];

  return (
    <>
      <style>{css}</style>
      <div className={`footer ${isAdminPage ? 'admin-theme' : ''}`}>
        <footer className="footer-root">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Brand Section */}
            <div className="footer-brand">
              <Link to="/home" className="footer-logo">
                <span className="footer-logo-emoji">🪔</span>
                <span className="footer-logo-text">EventVerse</span>
              </Link>

              <p className="footer-description">
                Celebrating our living culture through premium festival discovery, ticketing, and immersive experiences.
              </p>

              <div className="footer-socials">
                <a href="#" className="footer-social-link" title="Instagram">
                  <FaInstagram />
                </a>
                <a href="#" className="footer-social-link" title="Facebook">
                  <FaFacebookF />
                </a>
                <a href="#" className="footer-social-link" title="YouTube">
                  <FaYoutube />
                </a>
                <a href="#" className="footer-social-link" title="Twitter">
                  <FaTwitter />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-column">
              <h3 className="footer-column-title">Explore</h3>
              <ul className="footer-column-list">
                {['Home', 'Festivals', 'Gallery', 'About Us', 'Contact'].map((link) => {
                  let path = `/${link.toLowerCase().replace(' ', '-')}`;
                  if (link === 'Home') path = '/home';
                  if (link === 'Contact') path = '/about-us#contact';

                  return (
                    <li key={link}>
                      <Link
                        to={path}
                        className="footer-column-link"
                      >
                        <span className="footer-column-arrow">→</span>
                        <span>{link}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Categories */}
            <div className="footer-column">
              <h3 className="footer-column-title">Categories</h3>
              <ul className="footer-column-list">
                {categories.map((cat) => (
                  <li key={cat}>
                    <a
                      href={`/events?category=${encodeURIComponent(cat)}`}
                      className="footer-column-link"
                    >
                      <span className="footer-column-arrow">→</span>
                      <span>{cat}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="footer-column">
              <h3 className="footer-column-title">Contact</h3>

              <div className="footer-contact-item">
                <span className="footer-contact-emoji">📧</span>
                <div className="footer-contact-info">
                  <h4>Email</h4>
                  <a href="mailto:namaste@EventVerse.in">namaste@EventVerse.in</a>
                </div>
              </div>

              <div className="footer-contact-item">
                <span className="footer-contact-emoji">📞</span>
                <div className="footer-contact-info">
                  <h4>Phone</h4>
                  <p>+91 98765 43210</p>
                </div>
              </div>

              <div className="footer-contact-item">
                <span className="footer-contact-emoji">📍</span>
                <div className="footer-contact-info">
                  <h4>Address</h4>
                  <p>Cultural Center, 12th Avenue<br />Global Headquarters</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <p className="footer-bottom-text">
                &copy; {currentYear} EventVerse. All rights reserved.
              </p>
              <p className="footer-bottom-text">
                Made with <span className="footer-bottom-heart">❤️</span> for Global Culture
              </p>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};

export default Footer;