import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAllEvents } from '../services/eventService';
import { HiOutlinePhotograph, HiOutlineX, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightbox, setLightbox] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const categories = ['All', ...new Set(images.map(img => img.category))];

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await getAllEvents({ limit: 100 });
        const events = res.data.data.events || [];
        const allImages = [];
        const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/v1';
        events.forEach(event => {
          if (event.images && event.images.length > 0) {
            event.images.forEach((_, index) => {
              allImages.push({
                url: `${API_BASE}/events/${event._id}/images/${index}`,
                eventTitle: event.title,
                eventId: event._id,
                category: event.category
              });
            });
          } else if (event.thumbnail && event.thumbnail.filename) {
            allImages.push({
              url: `${API_BASE}/events/${event._id}/thumbnail`,
              eventTitle: event.title,
              eventId: event._id,
              category: event.category
            });
          }
        });
        setImages(allImages);
        setFiltered(allImages);
      } catch (err) {
        console.error('Failed to fetch gallery images:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  useEffect(() => {
    setFiltered(activeCategory === 'All' ? images : images.filter(img => img.category === activeCategory));
  }, [activeCategory, images]);

  const openLightbox = (index) => { setLightboxIndex(index); setLightbox(filtered[index]); };

  const navigateLightbox = useCallback((direction) => {
    const newIndex = direction === 'next'
      ? (lightboxIndex + 1) % filtered.length
      : (lightboxIndex - 1 + filtered.length) % filtered.length;
    setLightboxIndex(newIndex);
    setLightbox(filtered[newIndex]);
  }, [lightboxIndex, filtered]);

  useEffect(() => {
    if (!lightbox) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') navigateLightbox('next');
      else if (e.key === 'ArrowLeft') navigateLightbox('prev');
      else if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox, navigateLightbox]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)', paddingTop: '70px', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-lighter)',
        borderBottom: '1px solid var(--border-light)',
        padding: '60px 24px',
        textAlign: 'center',
      }}>
        <span style={{
          display: 'inline-block', fontSize: '11px', fontWeight: '700',
          color: 'var(--primary-terra)', letterSpacing: '0.12em',
          textTransform: 'uppercase', marginBottom: '14px',
          fontFamily: "'Poppins', sans-serif",
        }}>
          Visual Journey
        </span>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: '800',
          color: 'var(--text-dark)', marginBottom: '14px',
          lineHeight: 1.15,
        }}>
          Festival <em style={{ color: 'var(--primary-terra)', fontStyle: 'italic' }}>Gallery</em>
        </h1>
        <p style={{
          fontSize: '15px', color: 'var(--text-light)', maxWidth: '560px',
          margin: '0 auto', lineHeight: '1.7',
          fontFamily: "'Poppins', sans-serif",
        }}>
          A visual journey through vibrant global cultural celebrations. Discover the colors, emotions, and energy of our festivals.
        </p>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Category Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '40px', justifyContent: 'center' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 20px', borderRadius: '20px',
                fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                fontFamily: "'Poppins', sans-serif",
                background: activeCategory === cat ? 'linear-gradient(135deg, var(--primary-terra), var(--primary-light))' : 'var(--bg-lighter)',
                color: activeCategory === cat ? 'white' : 'var(--text-gray)',
                border: activeCategory === cat ? 'none' : '1.5px solid var(--border-light)',
                boxShadow: activeCategory === cat ? '0 4px 16px rgba(212,82,42,0.2)' : 'none',
                transform: activeCategory === cat ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="masonry-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                background: 'var(--border-lighter)', borderRadius: '14px',
                marginBottom: '20px', breakInside: 'avoid',
                height: `${240 + (i % 3) * 80}px`,
                animation: 'pulse 1.5s ease infinite',
                animationDelay: `${i * 0.08}s`,
              }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: 'var(--bg-lighter)', border: '1.5px solid var(--border-light)',
            borderRadius: '16px', padding: '80px 24px', textAlign: 'center',
          }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'var(--bg-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <HiOutlinePhotograph style={{ width: '32px', height: '32px', color: 'var(--text-light)' }} />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: "'Playfair Display', serif", marginBottom: '10px' }}>No images found</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>
              {activeCategory !== 'All'
                ? `We don't have any photos for "${activeCategory}" yet.`
                : 'Our gallery is currently empty. Festival photos will be added soon!'}
            </p>
          </div>
        ) : (
          <div className="masonry-grid">
            {filtered.map((img, i) => (
              <div
                key={i}
                style={{
                  marginBottom: '20px', breakInside: 'avoid',
                  borderRadius: '14px', overflow: 'hidden',
                  border: '1.5px solid var(--border-light)',
                  cursor: 'pointer', position: 'relative',
                  boxShadow: '0 2px 8px rgba(26,21,16,0.06)',
                  transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                  animation: 'fadeUp 0.5s ease both',
                  animationDelay: `${(i % 8) * 0.06}s`,
                }}
                onClick={() => openLightbox(i)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(212,82,42,0.12)'; e.currentTarget.style.borderColor = 'rgba(212,82,42,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,21,16,0.06)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
              >
                <img
                  src={img.url}
                  alt={img.eventTitle}
                  style={{ width: '100%', display: 'block', transition: 'transform 0.6s ease' }}
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="gallery-overlay" style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(26,21,16,0.85) 0%, rgba(26,21,16,0.2) 50%, transparent 100%)',
                  opacity: 0, transition: 'opacity 0.3s ease',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  padding: '16px',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                >
                  <p style={{ color: 'white', fontWeight: '700', fontSize: '14px', fontFamily: "'Poppins', sans-serif", marginBottom: '6px' }}>{img.eventTitle}</p>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)',
                    fontSize: '11px', fontWeight: '700', color: 'white', textTransform: 'uppercase',
                    letterSpacing: '0.06em', width: 'fit-content',
                    fontFamily: "'Poppins', sans-serif",
                  }}>
                    {img.category}
                  </span>
                </div>
                {/* Always-visible label overlay on small screens */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(26,21,16,0.75) 0%, transparent 50%)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  padding: '14px', pointerEvents: 'none',
                }}>
                  <div style={{ display: 'none' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(26,21,16,0.96)', backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          }}
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            onClick={e => { e.stopPropagation(); setLightbox(null); }}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', zIndex: 60, transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <HiOutlineX style={{ width: '20px', height: '20px' }} />
          </button>

          {/* Prev */}
          <button
            onClick={e => { e.stopPropagation(); navigateLightbox('prev'); }}
            style={{
              position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', zIndex: 60, transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            <HiOutlineChevronLeft style={{ width: '24px', height: '24px' }} />
          </button>

          {/* Next */}
          <button
            onClick={e => { e.stopPropagation(); navigateLightbox('next'); }}
            style={{
              position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', zIndex: 60, transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            <HiOutlineChevronRight style={{ width: '24px', height: '24px' }} />
          </button>

          {/* Image */}
          <div
            style={{ maxWidth: '900px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={lightbox.url}
              alt={lightbox.eventTitle}
              style={{
                maxHeight: '68vh', maxWidth: '100%', objectFit: 'contain',
                borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                marginBottom: '20px',
              }}
            />
            <div style={{
              background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px', padding: '18px 24px',
              textAlign: 'center', width: '100%', maxWidth: '520px',
            }}>
              <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '700', fontFamily: "'Poppins', sans-serif", marginBottom: '10px' }}>{lightbox.eventTitle}</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <span style={{
                  padding: '4px 14px', borderRadius: '12px',
                  background: 'rgba(212,82,42,0.25)', border: '1px solid rgba(212,82,42,0.4)',
                  fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                  color: '#E8835E', letterSpacing: '0.06em',
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  {lightbox.category}
                </span>
                <Link
                  to={`/events/${lightbox.eventId}`}
                  style={{ color: '#E8835E', fontSize: '13px', fontWeight: '600', textDecoration: 'none', fontFamily: "'Poppins', sans-serif" }}
                  onClick={() => setLightbox(null)}
                >
                  View Event Details →
                </Link>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Poppins', sans-serif" }}>
                Image {lightboxIndex + 1} of {filtered.length} • Use arrows or keyboard
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .gallery-card:hover .gallery-overlay { opacity: 1 !important; }
        
        .masonry-grid {
          column-count: 3;
          column-gap: 20px;
        }
        @media (max-width: 1024px) {
          .masonry-grid { column-count: 2; }
        }
        @media (max-width: 640px) {
          .masonry-grid { column-count: 1; }
        }
      `}</style>
    </div>
  );
};

export default Gallery;