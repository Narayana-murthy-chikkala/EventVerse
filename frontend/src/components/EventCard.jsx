import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getEventThumbnail } from '../services/eventService';
import { blobToObjectUrl, revokeObjectUrl } from '../utils/imageUtils';
import { HiOutlineCalendar, HiOutlineLocationMarker, HiChevronRight } from 'react-icons/hi';

const css = `
  .event-card-root {
    background: var(--bg-lighter);
    border: 1.5px solid var(--border-light);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(26, 21, 16, 0.02);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    display: flex;
    flex-direction: column;
    height: 100%;
    cursor: pointer;
  }

  .event-card-root:hover {
    transform: translateY(-6px);
    border-color: rgba(212, 82, 42, 0.3);
    box-shadow: 0 12px 32px rgba(212, 82, 42, 0.08);
  }

  .event-card-thumbnail-container {
    position: relative;
    height: 210px;
    width: 100%;
    overflow: hidden;
    flex-shrink: 0;
  }

  .event-card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .event-card-root:hover .event-card-img {
    transform: scale(1.05);
  }

  .event-card-badge-row {
    position: absolute;
    top: 14px;
    left: 14px;
    right: 14px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    pointer-events: none;
    z-index: 10;
  }

  .card-category-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 5px 12px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-radius: 999px;
    backdrop-filter: blur(8px);
    line-height: 1;
  }

  .badge-music    { background: rgba(212, 82, 42, 0.08);  color: var(--primary-terra); border: 1.5px solid rgba(212, 82, 42, 0.2); }
  .badge-dance    { background: rgba(107, 141, 94, 0.08); color: var(--sage);           border: 1.5px solid rgba(107, 141, 94, 0.2); }
  .badge-art      { background: rgba(201, 168, 76, 0.08); color: var(--gold);           border: 1.5px solid rgba(201, 168, 76, 0.2); }
  .badge-food     { background: rgba(220, 38, 38, 0.08);  color: #DC2626;              border: 1.5px solid rgba(220, 38, 38, 0.2); }
  .badge-theater  { background: rgba(37, 99, 235, 0.08);  color: #2563EB;              border: 1.5px solid rgba(37, 99, 235, 0.2); }
  .badge-folk     { background: rgba(219, 39, 119, 0.08); color: #DB2777;              border: 1.5px solid rgba(219, 39, 119, 0.2); }
  .badge-cultural { background: rgba(124, 58, 237, 0.08); color: #7C3AED;              border: 1.5px solid rgba(124, 58, 237, 0.2); }
  .badge-default  { background: rgba(90, 80, 72, 0.08);   color: var(--text-gray);     border: 1.5px solid rgba(90, 80, 72, 0.2); }

  .card-price-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 5px 12px;
    font-size: 11px;
    font-weight: 700;
    border-radius: 999px;
    backdrop-filter: blur(8px);
    line-height: 1;
    background: rgba(255, 255, 255, 0.85);
    color: var(--text-dark);
    border: 1.5px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }

  .card-featured-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 5px 12px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-radius: 999px;
    line-height: 1;
    background: linear-gradient(135deg, #F59E0B, #D97706);
    color: white;
    border: 1.5px solid rgba(251, 191, 36, 0.2);
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);
  }

  .event-card-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .event-card-title {
    font-family: 'Playfair Display', serif;
    font-size: 19px;
    font-weight: 800;
    color: var(--text-dark);
    line-height: 1.35;
    margin-bottom: 14px;
    transition: color 0.2s ease;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .event-card-root:hover .event-card-title {
    color: var(--primary-terra);
  }

  .event-card-meta-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: auto;
    margin-bottom: 20px;
  }

  .event-card-meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-gray);
    min-width: 0;
  }

  .event-card-meta-icon {
    color: var(--primary-terra);
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .event-card-meta-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .event-card-divider {
    height: 1px;
    background: var(--border-lighter);
    border: none;
    margin: 0 0 16px 0;
  }

  .event-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .event-card-spots-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-light);
  }

  .event-card-progress-bg {
    width: 100%;
    height: 4.5px;
    background: rgba(26, 21, 16, 0.06);
    border-radius: 99px;
    overflow: hidden;
    margin-top: 6px;
  }

  .event-card-chevron-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--bg-light);
    border: 1.5px solid var(--border-light);
    color: var(--text-light);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    flex-shrink: 0;
  }

  .event-card-root:hover .event-card-chevron-btn {
    background: var(--primary-terra);
    border-color: var(--primary-terra);
    color: var(--white);
    transform: scale(1.08);
    box-shadow: 0 4px 10px rgba(212, 82, 42, 0.2);
  }
`;

const EventCard = ({ event }) => {
  const navigate = useNavigate();
  const [thumbnailUrl, setThumbnailUrl] = useState(null);

  useEffect(() => {
    if (event._id) {
      getEventThumbnail(event._id)
        .then((res) => {
          if (res.data instanceof Blob) {
            setThumbnailUrl(blobToObjectUrl(res.data));
          }
        })
        .catch((err) => console.error('Error loading thumbnail:', err));
    }

    return () => {
      if (thumbnailUrl) {
        revokeObjectUrl(thumbnailUrl);
      }
    };
  }, [event._id]);

  const isSoldOut = event.registeredCount >= event.capacity;
  const spotsLeft = event.capacity - event.registeredCount;
  const fillPercentage = Math.min((event.registeredCount / event.capacity) * 100, 100);

  const getCategoryStyles = (category) => {
    if (!category) return 'badge-default';
    const cat = category.toLowerCase().trim();
    switch (cat) {
      case 'classical music': return 'badge-music';
      case 'classical dance': return 'badge-dance';
      case 'art exhibition': return 'badge-art';
      case 'food festival': return 'badge-food';
      case 'theater & drama': return 'badge-theater';
      case 'folk dance': return 'badge-folk';
      case 'cultural parade': return 'badge-cultural';
      default: return 'badge-default';
    }
  };

  const getCapacityColor = (percent) => {
    if (percent > 80) return '#EF4444';
    if (percent > 50) return '#F59E0B';
    return 'var(--sage)';
  };

  const fallbackImage = 'linear-gradient(135deg, #F5F0EB, #E5DDD5)';

  const displayPrice = event.isFree || event.price === 0 ? 'FREE' : `₹${event.earlyBirdPrice || event.price}`;

  return (
    <div className="event-card-root" onClick={() => navigate(`/events/${event._id}`)}>
      <style>{css}</style>
      
      {/* Thumbnail */}
      <div className="event-card-thumbnail-container">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={event.title} className="event-card-img" />
        ) : (
          <div className="w-full h-full event-card-img" style={{ background: fallbackImage }} />
        )}
        
        {/* Badges Overlay */}
        <div className="event-card-badge-row">
          <span className={`card-category-badge ${getCategoryStyles(event.category)}`}>
            {event.category}
          </span>
          
          <div className="flex flex-col items-end gap-1.5">
            {event.isFeatured && (
              <span className="card-featured-badge">
                ✦ Featured
              </span>
            )}
            <span className="card-price-badge">
              {displayPrice}
            </span>
          </div>
        </div>

        {isSoldOut && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="border-2 border-red-500 text-red-500 px-4 py-1.5 rounded-md font-[800] tracking-widest uppercase rotate-[-12deg] text-lg bg-black/40">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="event-card-body">
        <h3 className="event-card-title">{event.title}</h3>

        <div className="event-card-meta-list">
          <div className="event-card-meta-item">
            <HiOutlineCalendar className="event-card-meta-icon" />
            <span className="event-card-meta-text">
              {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              {event.time && ` • ${event.time}`}
            </span>
          </div>
          <div className="event-card-meta-item">
            <HiOutlineLocationMarker className="event-card-meta-icon" />
            <span className="event-card-meta-text">{event.venue}, {event.city}</span>
          </div>
        </div>

        <hr className="event-card-divider" />

        {/* Capacity / Action Bottom Row */}
        <div className="event-card-footer">
          <div className="flex-1 min-w-0">
            <span className="event-card-spots-label">
              {isSoldOut ? 'Capacity Reached' : `${spotsLeft} spots left`}
            </span>
            <div className="event-card-progress-bg">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${fillPercentage}%`,
                  backgroundColor: getCapacityColor(fillPercentage)
                }}
              />
            </div>
          </div>
          <div className="event-card-chevron-btn">
            <HiChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
