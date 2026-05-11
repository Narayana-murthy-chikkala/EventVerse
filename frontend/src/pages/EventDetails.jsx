import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FullscreenLoader } from '../components/Loader';
import {
  getEventById,
  registerForEvent,
  verifyPayment,
  getMyRegistrations,
  cancelRegistration,
} from '../services/eventService';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineLocationMarker, HiOutlineMap, HiChevronLeft, HiChevronRight, HiCheckCircle } from 'react-icons/hi';

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [userRegistration, setUserRegistration] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await getEventById(id);
        setEvent(res.data.data.event);
      } catch (err) {
        toast.error('Failed to load event');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate]);

  useEffect(() => {
    const checkRegistration = async () => {
      if (!user) return;
      try {
        const res = await getMyRegistrations();
        const regs = res.data.data.registrations || [];
        const existing = regs.find(
          (r) => r.event?._id === id && r.status !== 'cancelled'
        );
        if (existing) setUserRegistration(existing);
      } catch (err) {
        console.error('Failed to check registration:', err);
      }
    };
    checkRegistration();
  }, [user, id]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setRegistering(true);
    try {
      const res = await registerForEvent({ eventId: id });
      const data = res.data.data;

      if (data.registration) {
        toast.success('Registration successful! 🎉');
        setUserRegistration(data.registration);
        setEvent((prev) => ({
          ...prev,
          registeredCount: prev.registeredCount + 1,
        }));
        return;
      }

      if (data.orderId) {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error('Payment gateway failed to load');
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: data.amount * 100,
          currency: data.currency,
          name: 'SanskritiUtsav',
          description: event.title,
          order_id: data.orderId,
          handler: async (response) => {
            try {
              const verifyRes = await verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                registrationId: data.registrationId,
              });
              toast.success('Payment successful! Ticket confirmed! 🎫');
              setUserRegistration(verifyRes.data.data.registration);
              setEvent((prev) => ({
                ...prev,
                registeredCount: prev.registeredCount + 1,
              }));
            } catch (err) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone || '',
          },
          theme: { color: '#7C3AED' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancel = async () => {
    if (!userRegistration) return;
    try {
      await cancelRegistration(userRegistration._id);
      toast.success('Registration cancelled');
      setUserRegistration(null);
      setEvent((prev) => ({
        ...prev,
        registeredCount: Math.max(0, prev.registeredCount - 1),
      }));
      setShowCancelConfirm(false);
    } catch (err) {
      toast.error('Failed to cancel registration');
    }
  };

  if (loading) return <FullscreenLoader />;
  if (!event) return null;

  const isSoldOut = event.registeredCount >= event.capacity;
  const spotsLeft = event.capacity - event.registeredCount;
  const spotsPercent = (event.registeredCount / event.capacity) * 100;

  const isEarlyBird =
    event.earlyBirdPrice &&
    event.earlyBirdDeadline &&
    new Date() < new Date(event.earlyBirdDeadline);

  const displayPrice = isEarlyBird ? event.earlyBirdPrice : event.price;

  const fallbackImage = 'linear-gradient(135deg, #1e1e2e, #2d1b69)';
  const allImages =
    event.images?.length > 0
      ? event.images
      : event.thumbnail
      ? [event.thumbnail]
      : [];

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

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

  const statusColors = {
    upcoming: 'bg-[rgba(16,185,129,0.15)] text-success border border-[rgba(16,185,129,0.3)]',
    ongoing: 'bg-[rgba(245,158,11,0.15)] text-warning border border-[rgba(245,158,11,0.3)]',
    completed: 'bg-[rgba(255,255,255,0.1)] text-text-muted border border-[rgba(255,255,255,0.2)]',
    cancelled: 'bg-[rgba(239,68,68,0.15)] text-danger border border-[rgba(239,68,68,0.3)]',
  };

  // SVG Circle Progress calculation
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(spotsPercent, 100) / 100) * circumference;

  return (
    <div className="min-h-screen bg-bg-base animate-fade-in pb-20">
      
      {/* Hero Image Area */}
      <div className="relative w-full h-[480px] bg-bg-base overflow-hidden">
        {allImages.length > 0 ? (
          <>
            <img
              src={allImages[activeImage]}
              alt={event.title}
              className="w-full h-full object-cover animate-fade-in"
              key={activeImage}
            />
            {allImages.length > 1 && (
              <>
                <button 
                  onClick={() => setActiveImage(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-[48px] h-[48px] rounded-full bg-[rgba(10,10,15,0.4)] backdrop-blur-[8px] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors active:scale-[0.98]"
                >
                  <HiChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setActiveImage(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-[48px] h-[48px] rounded-full bg-[rgba(10,10,15,0.4)] backdrop-blur-[8px] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors active:scale-[0.98]"
                >
                  <HiChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === activeImage ? 'w-6 bg-white' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full" style={{ background: fallbackImage }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/60 to-transparent pointer-events-none" />
      </div>

      {/* Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Main Content (65%) */}
          <div className="flex-1 lg:w-[65%]">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[12px] font-[700] uppercase tracking-[0.05em] backdrop-blur-[8px] ${getCategoryStyles(event.category)}`}>
                {event.category}
              </span>
              {event.culturalOrigin && (
                <span className="inline-flex items-center justify-center px-3 py-1 bg-[rgba(255,255,255,0.1)] text-white border border-[rgba(255,255,255,0.2)] rounded-full text-[12px] font-[700] uppercase tracking-[0.05em] backdrop-blur-[8px]">
                  {event.culturalOrigin}
                </span>
              )}
              <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[12px] font-[700] uppercase tracking-[0.05em] backdrop-blur-[8px] ${statusColors[event.status]}`}>
                {event.status}
              </span>
            </div>

            <h1 className="text-[clamp(32px,4vw,40px)] font-[800] tracking-[-0.02em] text-text-primary leading-tight mb-6">
              {event.title}
            </h1>

            {/* Meta Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 mb-10 p-6 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[16px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[rgba(124,58,237,0.15)] flex items-center justify-center text-accent-primary">
                  <HiOutlineCalendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[13px] text-text-subtle font-[600] uppercase tracking-wider mb-0.5">Date</p>
                  <p className="text-[15px] text-text-primary font-[500]">{formatDate(event.date)}</p>
                </div>
              </div>
              {event.time && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[rgba(124,58,237,0.15)] flex items-center justify-center text-accent-primary">
                    <HiOutlineClock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[13px] text-text-subtle font-[600] uppercase tracking-wider mb-0.5">Time</p>
                    <p className="text-[15px] text-text-primary font-[500]">{event.time} {event.duration && <span className="text-text-muted">({event.duration})</span>}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 sm:col-span-2 mt-2">
                <div className="w-10 h-10 rounded-full bg-[rgba(124,58,237,0.15)] flex items-center justify-center text-accent-primary">
                  <HiOutlineLocationMarker className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-text-subtle font-[600] uppercase tracking-wider mb-0.5">Location</p>
                  <p className="text-[15px] text-text-primary font-[500]">{event.venue}</p>
                  <p className="text-[14px] text-text-muted">{event.address ? `${event.address}, ` : ''}{event.city}{event.state ? `, ${event.state}` : ''}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue + ' ' + event.city)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-text-muted hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all"
                  title="View on Maps"
                >
                  <HiOutlineMap className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Description */}
            <div className="mb-10">
              <h3 className="text-[20px] font-[700] text-text-primary mb-4">About This Event</h3>
              <p className="text-[16px] leading-[1.8] text-[rgba(248,250,252,0.85)] whitespace-pre-line">
                {showFullDesc || event.description.length <= 300 
                  ? event.description 
                  : `${event.description.substring(0, 300)}...`}
              </p>
              {event.description.length > 300 && (
                <button 
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="mt-2 text-accent-cyan font-[600] text-[15px] hover:text-white transition-colors"
                >
                  {showFullDesc ? 'Show less' : 'Read full description'}
                </button>
              )}
            </div>

            {/* Performers */}
            {event.performers?.length > 0 && (
              <div className="mb-10">
                <h3 className="text-[20px] font-[700] text-text-primary mb-6">Lineup & Performers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.performers.map((p, i) => (
                    <div key={i} className="flex items-start gap-4 bg-[rgba(255,255,255,0.02)] rounded-[16px] p-4 border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-colors">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-[rgba(255,255,255,0.1)]" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-card-gradient flex items-center justify-center text-white text-lg font-bold ring-2 ring-[rgba(255,255,255,0.1)]">
                          {p.name?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-[600] text-[16px] text-text-primary">{p.name}</p>
                        {p.role && <p className="text-[13px] text-accent-cyan mt-0.5">{p.role}</p>}
                        {p.bio && <p className="text-[13px] text-text-muted mt-1 leading-snug">{p.bio}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule */}
            {event.schedule?.length > 0 && (
              <div className="mb-10">
                <h3 className="text-[20px] font-[700] text-text-primary mb-6">Schedule</h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[68px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[rgba(255,255,255,0.1)] before:to-transparent">
                  {event.schedule.map((s, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-bg-base bg-[rgba(255,255,255,0.1)] group-hover:bg-accent-primary group-hover:border-[rgba(124,58,237,0.3)] text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors duration-300">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[rgba(255,255,255,0.02)] p-4 rounded-[16px] border border-[rgba(255,255,255,0.06)] shadow-card">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-[700] text-text-primary">{s.activity}</div>
                          <time className="font-[600] text-[13px] text-accent-cyan">{s.time}</time>
                        </div>
                        {s.performer && <div className="text-[14px] text-text-muted">{s.performer}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {event.tags?.length > 0 && (
              <div className="mb-10 pt-6 border-t border-[rgba(255,255,255,0.06)]">
                <div className="flex flex-wrap items-center gap-2">
                  {event.tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center justify-center px-4 py-1.5 bg-[rgba(255,255,255,0.06)] text-text-primary border border-[rgba(255,255,255,0.10)] rounded-full text-[13px] hover:bg-[rgba(255,255,255,0.1)] cursor-default transition-colors">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (35%) */}
          <div className="lg:w-[35%]">
            <div className="sticky top-24 space-y-6">
              
              {/* Registration Glass Card */}
              <div className="bg-[rgba(255,255,255,0.04)] backdrop-blur-card rounded-[20px] border border-[rgba(255,255,255,0.08)] p-6 md:p-8 shadow-card flex flex-col gap-5">
                
                {/* Price Section */}
                <div className="flex flex-col items-center text-center gap-1">
                  <span className="text-[12px] font-[600] uppercase tracking-widest text-text-muted">Price</span>
                  {event.isFree || event.price === 0 ? (
                    <div className="text-[36px] font-[800] text-success leading-none">FREE</div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <span className="text-[36px] font-[800] text-white leading-none">₹{displayPrice}</span>
                      {isEarlyBird && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <span className="text-[15px] text-text-subtle line-through decoration-text-subtle">₹{event.price}</span>
                          <span className="inline-flex items-center justify-center text-[11px] font-[700] uppercase tracking-wider bg-[rgba(16,185,129,0.15)] text-success px-2 py-0.5 rounded-sm">
                            Early Bird
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-full h-px bg-[rgba(255,255,255,0.06)]" />

                {/* Capacity Progress Ring */}
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="relative w-[68px] h-[68px]">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="34" cy="34" r="30" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="transparent" />
                      <circle 
                        cx="34" cy="34" r="30" 
                        stroke={spotsPercent > 80 ? 'var(--danger)' : spotsPercent > 50 ? 'var(--warning)' : 'var(--success)'} 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset} 
                        className="transition-all duration-1000 ease-out" 
                        strokeLinecap="round" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[13px] font-[700] text-text-primary">{Math.round(spotsPercent)}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[18px] font-[700] text-text-primary mb-0.5">{isSoldOut ? 'Sold Out' : `${spotsLeft} spots left`}</p>
                    <p className="text-[13px] text-text-muted">Total capacity: {event.capacity}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                {event.status !== 'upcoming' ? (
                  <button disabled className="inline-flex items-center justify-center w-full h-[52px] bg-[rgba(255,255,255,0.06)] text-text-muted rounded-[12px] font-[600] cursor-not-allowed whitespace-nowrap">
                    Registration Closed
                  </button>
                ) : userRegistration ? (
                  <div className="space-y-4">
                    <div className="bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] rounded-[16px] p-5 text-center flex flex-col items-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[rgba(16,185,129,0.2)] mx-auto mb-3">
                        <HiCheckCircle className="w-8 h-8 text-success flex-shrink-0" />
                      </div>
                      <p className="font-[700] text-[16px] text-white mb-1">You're Registered!</p>
                      <p className="text-[13px] text-success font-[600] uppercase tracking-wider mb-4">Payment: {userRegistration.paymentStatus}</p>
                      
                      {userRegistration.qrCode && (
                        <div className="bg-white p-2 rounded-[12px] inline-flex items-center justify-center mb-2">
                          <img src={userRegistration.qrCode} alt="QR Code" className="w-32 h-32 object-contain" />
                        </div>
                      )}
                      <p className="text-[12px] text-text-muted">Show this QR code at the venue</p>
                    </div>
                    
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="inline-flex items-center justify-center gap-2 w-full h-[48px] bg-transparent border border-[rgba(239,68,68,0.3)] text-danger rounded-[12px] font-[600] hover:bg-[rgba(239,68,68,0.1)] transition-colors whitespace-nowrap"
                    >
                      Cancel Registration
                    </button>
                  </div>
                ) : isSoldOut ? (
                  <button disabled className="inline-flex items-center justify-center w-full h-[52px] bg-[rgba(239,68,68,0.15)] text-danger rounded-[12px] font-[600] cursor-not-allowed border border-[rgba(239,68,68,0.3)] whitespace-nowrap">
                    Sold Out
                  </button>
                ) : !user ? (
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 w-full h-[52px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-white rounded-[12px] font-[600] hover:bg-[rgba(255,255,255,0.1)] transition-all active:scale-[0.98] whitespace-nowrap"
                  >
                    Login to Register
                  </Link>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="relative inline-flex items-center justify-center gap-2 w-full h-[52px] bg-accent-gradient text-white rounded-[12px] font-[700] text-[16px] animate-pulse-glow hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden whitespace-nowrap"
                  >
                    {registering ? (
                      <>
                        <div className="w-5 h-5 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin flex-shrink-0" />
                        Processing...
                      </>
                    ) : event.isFree || event.price === 0 ? (
                      'Register for Free'
                    ) : (
                      `Book Tickets — ₹${displayPrice}`
                    )}
                  </button>
                )}
              </div>

              {/* Organizer Card */}
              {event.organizer && (
                <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-card rounded-[20px] border border-[rgba(255,255,255,0.06)] p-6">
                  <h3 className="text-[14px] font-[700] uppercase tracking-wider text-text-subtle mb-4">Organized By</h3>
                  <div className="flex items-center justify-start gap-4">
                    {event.organizer.avatar ? (
                      <img src={event.organizer.avatar} alt={event.organizer.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-[rgba(255,255,255,0.1)] flex-shrink-0" />
                    ) : (
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-card-gradient text-white text-[20px] font-[800] ring-2 ring-[rgba(255,255,255,0.1)] flex-shrink-0">
                        {event.organizer.name?.charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <p className="font-[600] text-[16px] text-text-primary truncate">{event.organizer.name}</p>
                      <p className="text-[13px] text-accent-cyan mt-0.5 truncate">Verified Host</p>
                    </div>
                  </div>
                  {event.organizerNote && (
                    <div className="mt-5 p-4 bg-[rgba(255,255,255,0.03)] rounded-[12px] border border-[rgba(255,255,255,0.04)] relative">
                      <span className="text-[24px] absolute -top-2 -left-1 opacity-20 text-text-primary">"</span>
                      <p className="text-[14px] text-text-muted italic relative z-10 leading-relaxed">
                        {event.organizerNote}
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[rgba(10,10,15,0.95)] border border-[rgba(255,255,255,0.1)] rounded-[20px] p-8 max-w-sm w-full shadow-modal animate-slide-up scale-95 origin-bottom text-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center mx-auto mb-5">
              <span className="text-[32px]">⚠️</span>
            </div>
            <h3 className="text-[24px] font-[800] text-white mb-2">Are you sure?</h3>
            <p className="text-[15px] text-text-muted mb-8 leading-relaxed">
              Do you really want to cancel your registration for this event? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="inline-flex items-center justify-center gap-2 flex-1 h-[48px] border border-[rgba(255,255,255,0.12)] text-text-primary rounded-[12px] font-[600] hover:bg-[rgba(255,255,255,0.06)] transition-all active:scale-[0.98] whitespace-nowrap"
              >
                No, Keep it
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center justify-center gap-2 flex-1 h-[48px] bg-danger text-white rounded-[12px] font-[600] hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] active:scale-[0.98] whitespace-nowrap"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
