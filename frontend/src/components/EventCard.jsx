import { useNavigate } from 'react-router-dom';

const EventCard = ({ event }) => {
  const navigate = useNavigate();

  const isSoldOut = event.registeredCount >= event.capacity;
  const spotsLeft = event.capacity - event.registeredCount;
  const fillPercentage = Math.min((event.registeredCount / event.capacity) * 100, 100);

  // Category Colors Mapped for Badges
  const getCategoryStyles = (category) => {
    switch (category) {
      case 'Classical Music': return 'bg-[rgba(124,58,237,0.2)] text-[#A855F7] border border-[rgba(124,58,237,0.3)]';
      case 'Classical Dance': return 'bg-[rgba(6,182,212,0.2)] text-[#22D3EE] border border-[rgba(6,182,212,0.3)]';
      case 'Art Exhibition': return 'bg-[rgba(245,158,11,0.2)] text-[#FBBF24] border border-[rgba(245,158,11,0.3)]';
      case 'Food Festival': return 'bg-[rgba(239,68,68,0.2)] text-[#F87171] border border-[rgba(239,68,68,0.3)]';
      case 'Theater & Drama': return 'bg-[rgba(59,130,246,0.2)] text-[#60A5FA] border border-[rgba(59,130,246,0.3)]';
      case 'Folk Dance': return 'bg-[rgba(236,72,153,0.2)] text-[#F472B6] border border-[rgba(236,72,153,0.3)]';
      default: return 'bg-[rgba(255,255,255,0.1)] text-white border border-[rgba(255,255,255,0.2)]';
    }
  };

  const getCapacityGradient = (percent) => {
    if (percent > 80) return 'linear-gradient(to right, #EF4444, #B91C1C)'; // Red
    if (percent > 50) return 'linear-gradient(to right, #F59E0B, #D97706)'; // Amber
    return 'linear-gradient(to right, #10B981, #059669)'; // Green
  };

  const fallbackImage = 'linear-gradient(135deg, #1e1e2e, #2d1b69)';

  return (
    <div
      onClick={() => navigate(`/events/${event._id}`)}
      className="group cursor-pointer bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[14px] overflow-hidden transition-all duration-[280ms] ease-[var(--ease-default)] hover:-translate-y-1 hover:border-[rgba(124,58,237,0.4)] hover:shadow-glow-primary flex flex-col"
    >
      {/* Thumbnail Area */}
      <div className="relative h-[200px] w-full overflow-hidden flex-shrink-0">
        <div 
          className="w-full h-full group-hover:scale-105 transition-transform duration-[400ms] ease-[var(--ease-default)]"
          style={{ 
            background: event.thumbnail ? `url(${event.thumbnail}) center/cover no-repeat` : fallbackImage 
          }}
        />
        
        {/* Dark overlay at bottom for text contrast */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[rgba(10,10,15,0.9)] to-transparent pointer-events-none" />

        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
          <span 
            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-[700] tracking-[0.05em] uppercase backdrop-blur-[8px] ${getCategoryStyles(event.category)}`}
          >
            {event.category}
          </span>
          
          <div className="flex flex-col items-end gap-1.5">
            {event.isFeatured && (
              <span className="bg-gradient-to-r from-amber-400 to-yellow-600 text-white px-2.5 py-1 rounded-full text-[11px] font-[700] tracking-[0.05em] uppercase shadow-lg border border-yellow-300/30">
                ✦ Featured
              </span>
            )}
            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[12px] font-[700] tracking-[0.05em] backdrop-blur-[8px] ${
              event.isFree || event.price === 0 
                ? 'bg-[rgba(16,185,129,0.15)] text-[#10B981] border border-[rgba(16,185,129,0.3)]' 
                : 'bg-[rgba(255,255,255,0.1)] text-white border border-[rgba(255,255,255,0.2)]'
            }`}>
              {event.isFree || event.price === 0 ? 'FREE' : `₹${event.earlyBirdPrice || event.price}`}
            </span>
          </div>
        </div>

        {isSoldOut && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="border-2 border-danger text-danger px-4 py-1.5 rounded-md font-[800] tracking-widest uppercase rotate-[-12deg] text-lg bg-black/40">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <h3 className="text-[16px] font-[700] leading-[1.3] text-text-primary line-clamp-2 mb-3">
          {event.title}
        </h3>

        <div className="space-y-2 mt-auto mb-5">
          <div className="flex items-center gap-2 text-[13px] text-text-muted">
            <svg className="w-4 h-4 text-accent-cyan flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} {event.time && `• ${event.time}`}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-text-muted">
            <svg className="w-4 h-4 text-accent-cyan flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{event.venue}, {event.city}</span>
          </div>
        </div>

        {/* Capacity / Action Bottom Row */}
        <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-4 mt-auto">
          <div className="flex-1">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[11px] font-[600] text-text-muted uppercase tracking-wider text-left">
                {isSoldOut ? 'Capacity Reached' : `${spotsLeft} spots left`}
              </span>
            </div>
            <div className="w-full h-1 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${fillPercentage}%`,
                  background: getCapacityGradient(fillPercentage)
                }}
              />
            </div>
          </div>
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex-shrink-0 group-hover:bg-accent-primary group-hover:border-transparent transition-colors duration-300">
            <svg className="w-4 h-4 text-text-muted group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
