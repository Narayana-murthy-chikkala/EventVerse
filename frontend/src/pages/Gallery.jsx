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

  const categories = ['All', ...new Set(images.map((img) => img.category))];

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await getAllEvents({ limit: 100 });
        const events = res.data.data.events || [];
        const allImages = [];
        events.forEach((event) => {
          const eventImages = event.images?.length > 0 ? event.images : event.thumbnail ? [event.thumbnail] : [];
          eventImages.forEach((url) => {
            allImages.push({
              url,
              eventTitle: event.title,
              eventId: event._id,
              category: event.category,
            });
          });
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
    if (activeCategory === 'All') {
      setFiltered(images);
    } else {
      setFiltered(images.filter((img) => img.category === activeCategory));
    }
  }, [activeCategory, images]);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightbox(filtered[index]);
  };

  const navigateLightbox = useCallback(
    (direction) => {
      const newIndex =
        direction === 'next'
          ? (lightboxIndex + 1) % filtered.length
          : (lightboxIndex - 1 + filtered.length) % filtered.length;
      setLightboxIndex(newIndex);
      setLightbox(filtered[newIndex]);
    },
    [lightboxIndex, filtered]
  );

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
    <div className="min-h-screen bg-bg-base pt-[70px] pb-20 relative overflow-hidden animate-fade-in">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[rgba(6,182,212,0.1)] rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-0 w-[500px] h-[500px] bg-[rgba(124,58,237,0.1)] rounded-full filter blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 py-16 lg:py-20 text-center px-4 sm:px-6 lg:px-8 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,15,0.4)] backdrop-blur-sm">
        <h1 className="text-[40px] md:text-[56px] font-[800] tracking-[-0.02em] text-white mb-4 leading-tight">
          Festival <span className="bg-accent-gradient bg-clip-text text-transparent">Gallery</span>
        </h1>
        <p className="text-[16px] text-text-muted max-w-2xl mx-auto font-[500]">
          A visual journey through India's vibrant cultural celebrations. Discover the colors, emotions, and energy of our festivals.
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2.5 mb-12 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-[600] transition-all border whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-accent-gradient text-white border-transparent shadow-[0_4px_20px_rgba(124,58,237,0.3)]'
                  : 'bg-[rgba(255,255,255,0.02)] text-text-muted border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[20px] animate-pulse break-inside-avoid"
                style={{ height: `${250 + Math.random() * 200}px` }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[24px] backdrop-blur-card">
            <div className="w-24 h-24 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center mx-auto mb-6">
              <HiOutlinePhotograph className="w-12 h-12 text-text-muted" />
            </div>
            <h3 className="text-[24px] font-[800] text-text-primary mb-2">
              No images found
            </h3>
            <p className="text-[15px] text-text-muted max-w-sm mx-auto">
              {activeCategory !== 'All'
                ? `We don't have any photos for "${activeCategory}" yet. Check back later!`
                : 'Our gallery is currently empty. Festival photos will be added soon!'}
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {filtered.map((img, i) => (
              <div
                key={i}
                className="break-inside-avoid group relative rounded-[20px] overflow-hidden cursor-pointer bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] shadow-card hover:shadow-glow-primary transition-all duration-500"
                onClick={() => openLightbox(i)}
              >
                <img
                  src={img.url}
                  alt={img.eventTitle}
                  className="w-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,15,0.9)] via-[rgba(10,10,15,0.2)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <p className="text-white font-[700] text-[16px] mb-2 leading-tight drop-shadow-md transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{img.eventTitle}</p>
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                    <span className="inline-block px-3 py-1 bg-[rgba(255,255,255,0.15)] backdrop-blur-md rounded-full text-[11px] font-[700] uppercase tracking-wider text-white border border-[rgba(255,255,255,0.2)]">
                      {img.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-[rgba(10,10,15,0.95)] backdrop-blur-xl flex items-center justify-center animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            className="absolute top-6 right-6 w-12 h-12 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] rounded-full inline-flex items-center justify-center text-white transition-colors z-20"
          >
            <HiOutlineX className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateLightbox('prev');
            }}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] rounded-full inline-flex items-center justify-center text-white transition-colors z-20 border border-[rgba(255,255,255,0.1)]"
          >
            <HiOutlineChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateLightbox('next');
            }}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] rounded-full inline-flex items-center justify-center text-white transition-colors z-20 border border-[rgba(255,255,255,0.1)]"
          >
            <HiOutlineChevronRight className="w-8 h-8" />
          </button>

          <div
            className="max-w-6xl max-h-[90vh] mx-4 flex flex-col items-center animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative group">
              <img
                src={lightbox.url}
                alt={lightbox.eventTitle}
                className="max-h-[75vh] max-w-full object-contain rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.1)]"
              />
            </div>
            
            <div className="mt-6 text-center max-w-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-4 backdrop-blur-md w-full">
              <h3 className="text-white text-[20px] font-[800] mb-3">{lightbox.eventTitle}</h3>
              <div className="flex flex-wrap items-center justify-center gap-3 mb-3">
                <span className="px-3 py-1 bg-[rgba(255,255,255,0.1)] rounded-full text-[11px] font-[700] uppercase tracking-wider text-white">
                  {lightbox.category}
                </span>
                <span className="w-1 h-1 bg-[rgba(255,255,255,0.2)] rounded-full"></span>
                <Link
                  to={`/events/${lightbox.eventId}`}
                  className="text-accent-cyan hover:text-white text-[13px] font-[600] transition-colors"
                  onClick={() => setLightbox(null)}
                >
                  View Event Details →
                </Link>
              </div>
              <p className="text-[12px] text-text-subtle font-[500] uppercase tracking-wider">
                Image {lightboxIndex + 1} of {filtered.length} <span className="hidden sm:inline">• Use arrows to navigate</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
