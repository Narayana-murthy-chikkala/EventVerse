import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Poppins:wght@300;400;500;600;700&display=swap');

  .about-root {
    background: var(--bg-light);
    color: var(--text-dark);
    font-family: 'Poppins', sans-serif;
    overflow-x: hidden;
  }

  .about-hero {
    min-height: 50svh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 140px 24px 80px;
    background: linear-gradient(135deg, #FFFFFF 0%, #FAFAF8 50%, #F5F0EB 100%);
    border-bottom: 1px solid var(--border-lighter);
  }

  .about-hero-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 100% 80% at 15% 100%, rgba(212, 82, 42, 0.08) 0%, transparent 60%),
      radial-gradient(ellipse 80% 70% at 85% 10%, rgba(201, 168, 76, 0.06) 0%, transparent 55%);
    pointer-events: none;
  }

  .about-inner {
    position: relative;
    z-index: 2;
    max-width: 900px;
    margin: 0 auto;
    text-align: center;
    animation: fadeUp 0.8s ease both;
  }

  .about-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px;
    border: 1.5px solid rgba(212, 82, 42, 0.25);
    border-radius: 50px;
    background: rgba(248, 245, 240, 0.8);
    backdrop-filter: blur(10px);
    margin-bottom: 24px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  }

  .about-kicker-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary-terra);
    animation: pulse-warm 2s ease-in-out infinite;
  }

  .about-kicker-text {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--primary-terra);
  }

  .about-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(36px, 6vw, 64px);
    font-weight: 800;
    color: var(--text-dark);
    margin-bottom: 24px;
    line-height: 1.15;
  }

  .about-title em {
    font-style: italic;
    color: var(--primary-terra);
  }

  .about-sub {
    font-size: clamp(15px, 2vw, 18px);
    color: var(--text-gray);
    line-height: 1.8;
    max-width: 700px;
    margin: 0 auto;
  }

  .about-section {
    padding: 100px 24px;
    position: relative;
  }

  .about-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 32px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .about-card {
    padding: 48px 40px;
    border-radius: 12px;
    background: var(--bg-lighter);
    border: 1.5px solid var(--border-light);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    animation: fadeUp 0.6s ease both;
  }

  .about-card:hover {
    transform: translateY(-10px);
    background: var(--bg-light);
    border-color: var(--primary-terra);
    box-shadow: 0 16px 40px rgba(212, 82, 42, 0.12);
  }

  .about-icon-wrap {
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
  
  .about-card:nth-child(2) .about-icon-wrap {
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%);
    box-shadow: 0 6px 16px rgba(201, 168, 76, 0.18);
  }

  .about-card:hover .about-icon-wrap {
    transform: scale(1.1) rotate(5deg);
  }

  .about-card-title {
    font-family: 'Playfair Display', serif;
    font-size: 24px;
    font-weight: 700;
    color: var(--text-dark);
    margin-bottom: 12px;
  }

  .about-card-desc {
    font-size: 14px;
    line-height: 1.8;
    color: var(--text-gray);
  }

  .contact-section {
    background: var(--bg-lighter);
    padding: 100px 24px;
    position: relative;
    border-top: 1px solid var(--border-lighter);
  }

  .contact-inner {
    max-width: 900px;
    margin: 0 auto;
    background: var(--bg-light);
    border: 1.5px solid var(--border-light);
    border-radius: 24px;
    padding: 60px 40px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(26, 21, 16, 0.04);
  }

  .contact-inner::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at top right, rgba(212, 82, 42, 0.05) 0%, transparent 70%);
    pointer-events: none;
  }

  .contact-header {
    text-align: center;
    margin-bottom: 48px;
    position: relative;
    z-index: 1;
  }

  .contact-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 24px;
    margin-bottom: 48px;
    position: relative;
    z-index: 1;
  }

  .contact-info-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
    background: var(--bg-lighter);
    border: 1.5px solid var(--border-lighter);
    border-radius: 12px;
    text-align: center;
    transition: all 0.3s;
  }

  .contact-info-card:hover {
    border-color: var(--primary-terra);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(212, 82, 42, 0.08);
  }

  .contact-form {
    max-width: 500px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    border-top: 1px solid var(--border-lighter);
    padding-top: 48px;
  }

  .form-group {
    margin-bottom: 24px;
  }

  .form-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-gray);
    margin-bottom: 8px;
  }

  .form-textarea {
    width: 100%;
    background: var(--bg-lighter);
    border: 1.5px solid var(--border-light);
    border-radius: 10px;
    padding: 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: var(--text-dark);
    resize: vertical;
    transition: all 0.3s;
  }

  .form-textarea:focus {
    outline: none;
    border-color: var(--primary-terra);
    box-shadow: 0 0 0 4px rgba(212, 82, 42, 0.1);
  }

  .btn-submit {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 14px 32px;
    background: linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%);
    color: #fff;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 8px 20px rgba(212, 82, 42, 0.2);
  }

  .btn-submit:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(212, 82, 42, 0.3);
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const About = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#contact') {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        setTimeout(() => {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <>
      <style>{css}</style>
      <div className="about-root">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="about-hero-bg" />
          <div className="about-inner">
            <div className="about-kicker">
              <div className="about-kicker-dot" />
              <span className="about-kicker-text">Our Story</span>
            </div>
            <h1 className="about-title">
              About <em>EventVerse</em>
            </h1>
            <p className="about-sub">
              We are dedicated to bridging the gap between culture and community. EventVerse is the premier platform for discovering, organizing, and experiencing the world's most vibrant cultural festivals and events.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="about-section">
          <div className="about-grid">
            <div className="about-card">
              <div className="about-icon-wrap">
                <span style={{ filter: 'brightness(0) invert(1)' }}>🌟</span>
              </div>
              <h3 className="about-card-title">Our Mission</h3>
              <p className="about-card-desc">
                To empower organizers to seamlessly share their cultural heritage while providing attendees with a world-class, frictionless platform to discover and participate in meaningful living culture.
              </p>
            </div>
            
            <div className="about-card" style={{ animationDelay: '0.15s' }}>
              <div className="about-icon-wrap">
                <span style={{ filter: 'brightness(0) invert(1)' }}>👁️</span>
              </div>
              <h3 className="about-card-title">Our Vision</h3>
              <p className="about-card-desc">
                To become the global hub where tradition meets modern technology, ensuring that cultural art forms, music, and festivals are preserved and celebrated by generations to come.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="contact-section">
          <div className="contact-inner">
            <div className="contact-header">
              <div className="about-kicker" style={{ marginBottom: '16px' }}>
                <span className="about-kicker-text">Get in Touch</span>
              </div>
              <h2 className="about-title" style={{ fontSize: 'clamp(28px, 5vw, 48px)', marginBottom: '16px' }}>Contact Us</h2>
              <p className="about-sub" style={{ fontSize: '15px' }}>
                Have a question about an upcoming festival? Want to host your own event on EventVerse? Our team is here to help you every step of the way.
              </p>
            </div>

            <div className="contact-info-grid">
              <div className="contact-info-card">
                <HiOutlineMail size={28} color="var(--primary-terra)" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '4px' }}>Email</h4>
                <a href="mailto:hello@eventverse.com" style={{ fontSize: '13px', color: 'var(--text-gray)', textDecoration: 'none' }}>hello@eventverse.com</a>
              </div>
              
              <div className="contact-info-card">
                <HiOutlinePhone size={28} color="var(--primary-terra)" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '4px' }}>Phone</h4>
                <a href="tel:+1234567890" style={{ fontSize: '13px', color: 'var(--text-gray)', textDecoration: 'none' }}>+1 (234) 567-890</a>
              </div>

              <div className="contact-info-card">
                <HiOutlineLocationMarker size={28} color="var(--primary-terra)" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '4px' }}>Office</h4>
                <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Global Headquarters</span>
              </div>
            </div>

            <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>
              <div className="form-group">
                <label className="form-label">Message Us</label>
                <textarea 
                  rows="4" 
                  placeholder="How can we help you?"
                  className="form-textarea"
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn-submit">
                Send Message
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
};

export default About;
