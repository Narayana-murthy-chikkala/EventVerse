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
  getEventImage,
} from '../services/eventService';
import { blobToObjectUrl, revokeObjectUrl } from '../utils/imageUtils';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineLocationMarker, HiOutlineMap, HiChevronLeft, HiChevronRight, HiCheckCircle } from 'react-icons/hi';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Poppins:wght@300;400;500;600;700&display=swap');

  .details-root {
    background: var(--bg-light);
    color: var(--text-dark);
    font-family: 'Poppins', sans-serif;
    padding-top: 96px;
    min-height: 100vh;
  }

  .details-hero {
    position: relative;
    width: 100%;
    height: 420px;
    background: var(--bg-light);
    overflow: hidden;
  }

  @media (min-width: 768px) {
    .details-hero {
      height: 520px;
    }
  }

  .details-hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, var(--bg-light) 0%, rgba(250, 250, 248, 0.4) 60%, transparent 100%);
  }

  /* ── Badges ─────────────────────────────────────────────── */
  .badges-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 18px;
  }

  .category-badge,
  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 5px 14px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
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

  .status-upcoming  { background: rgba(16, 185, 129, 0.08);  color: #059669; border: 1.5px solid rgba(16, 185, 129, 0.22); }
  .status-ongoing   { background: rgba(245, 158, 11, 0.08);  color: #D97706; border: 1.5px solid rgba(245, 158, 11, 0.22); }
  .status-completed { background: rgba(90, 80, 72, 0.08);    color: var(--text-gray); border: 1.5px solid rgba(90, 80, 72, 0.22); }
  .status-cancelled { background: rgba(220, 38, 38, 0.08);   color: #DC2626; border: 1.5px solid rgba(220, 38, 38, 0.22); }

  .origin-badge {
    display: inline-flex;
    align-items: center;
    padding: 5px 14px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border: 1.5px solid rgba(212, 82, 42, 0.25);
    color: var(--primary-terra);
    background: rgba(212, 82, 42, 0.06);
  }

  /* ── Title ───────────────────────────────────────────────── */
  .details-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(30px, 4.5vw, 46px);
    font-weight: 900;
    color: var(--text-dark);
    line-height: 1.15;
    margin-bottom: 8px;
    letter-spacing: -0.02em;
  }

  .details-title-underline {
    display: block;
    width: 56px;
    height: 3.5px;
    border-radius: 99px;
    background: var(--gradient-primary);
    margin-bottom: 32px;
    margin-top: 10px;
  }

  /* ── Meta Cards Grid ─────────────────────────────────────── */
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 40px;
  }

  @media (max-width: 600px) {
    .meta-grid {
      grid-template-columns: 1fr;
    }
  }

  .meta-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--bg-lighter);
    border: 1.5px solid var(--border-light);
    border-radius: 16px;
    padding: 16px 18px;
    box-shadow: 0 2px 12px rgba(26, 21, 16, 0.03);
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    min-width: 0;
  }

  .meta-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(26, 21, 16, 0.07);
    border-color: rgba(212, 82, 42, 0.28);
  }

  .meta-card.full-width {
    grid-column: 1 / -1;
  }

  .meta-icon {
    flex-shrink: 0;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba(212, 82, 42, 0.07);
    color: var(--primary-terra);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.25s ease, background 0.25s ease;
  }

  .meta-card:hover .meta-icon {
    transform: rotate(6deg) scale(1.06);
    background: rgba(212, 82, 42, 0.13);
  }

  .meta-body {
    flex: 1;
    min-width: 0;
  }

  .meta-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.13em;
    color: var(--text-light);
    margin-bottom: 3px;
  }

  .meta-val {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-dark);
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meta-sub {
    font-size: 12px;
    color: var(--text-gray);
    font-weight: 400;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meta-map-btn {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 11px;
    border: 1.5px solid var(--border-light);
    color: var(--text-gray);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s ease;
    background: var(--bg-light);
    text-decoration: none;
  }

  .meta-map-btn:hover {
    border-color: var(--primary-terra);
    color: var(--white);
    background: var(--primary-terra);
    transform: scale(1.1) rotate(6deg);
    box-shadow: 0 4px 14px rgba(212, 82, 42, 0.28);
  }

  /* ── Section Titles ──────────────────────────────────────── */
  .section-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  .section-heading-bar {
    display: block;
    width: 4px;
    height: 22px;
    border-radius: 99px;
    background: var(--gradient-primary);
    flex-shrink: 0;
  }

  .section-heading-text {
    font-family: 'Playfair Display', serif;
    font-size: 21px;
    font-weight: 800;
    color: var(--text-dark);
    line-height: 1;
    margin: 0;
  }

  /* ── Description ─────────────────────────────────────────── */
  .desc-block {
    margin-bottom: 40px;
    background: var(--bg-lighter);
    border: 1.5px solid var(--border-light);
    border-radius: 18px;
    padding: 24px 26px;
    box-shadow: 0 2px 12px rgba(26, 21, 16, 0.03);
  }

  .desc-text {
    font-size: 15px;
    line-height: 1.85;
    color: var(--text-gray);
    white-space: pre-line;
  }

  .desc-readmore {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--primary-terra);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: opacity 0.2s;
  }

  .desc-readmore:hover {
    opacity: 0.75;
  }

  /* ── Performers ──────────────────────────────────────────── */
  .performers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
    margin-bottom: 40px;
  }

  .performer-card {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: var(--bg-lighter);
    border: 1.5px solid var(--border-light);
    border-radius: 16px;
    padding: 18px;
    box-shadow: 0 2px 10px rgba(26, 21, 16, 0.03);
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  }

  .performer-card:hover {
    border-color: rgba(212, 82, 42, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(26, 21, 16, 0.07);
  }

  .performer-avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    ring: 2px solid var(--border-light);
  }

  .performer-avatar-placeholder {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    font-weight: 700;
    background: var(--gradient-primary);
  }

  .performer-name {
    font-weight: 700;
    font-size: 15px;
    color: var(--text-dark);
    line-height: 1.3;
  }

  .performer-role {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--primary-terra);
    background: rgba(212, 82, 42, 0.08);
    border-radius: 6px;
    padding: 2px 8px;
    margin-top: 4px;
  }

  .performer-bio {
    font-size: 13px;
    color: var(--text-light);
    margin-top: 6px;
    line-height: 1.55;
  }

  /* ── Schedule ────────────────────────────────────────────── */
  .schedule-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-bottom: 40px;
    position: relative;
    padding-left: 28px;
  }

  .schedule-list::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: linear-gradient(to bottom, var(--primary-terra), rgba(212, 82, 42, 0.1));
    border-radius: 99px;
  }

  .schedule-item {
    position: relative;
    padding-bottom: 16px;
  }

  .schedule-item:last-child {
    padding-bottom: 0;
  }

  .schedule-dot {
    position: absolute;
    left: -23px;
    top: 18px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--primary-terra);
    border: 2.5px solid var(--bg-light);
    box-shadow: 0 0 0 2px rgba(212, 82, 42, 0.25);
    transition: transform 0.2s;
  }

  .schedule-item:hover .schedule-dot {
    transform: scale(1.3);
  }

  .schedule-card {
    background: var(--bg-lighter);
    border: 1.5px solid var(--border-light);
    border-radius: 14px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    transition: border-color 0.25s ease, box-shadow 0.25s ease;
  }

  .schedule-card:hover {
    border-color: rgba(212, 82, 42, 0.25);
    box-shadow: 0 4px 16px rgba(26, 21, 16, 0.05);
  }

  .schedule-activity {
    font-weight: 700;
    font-size: 14px;
    color: var(--text-dark);
  }

  .schedule-performer {
    font-size: 13px;
    color: var(--text-light);
    margin-top: 3px;
  }

  .schedule-time {
    flex-shrink: 0;
    font-weight: 700;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--primary-terra);
    background: rgba(212, 82, 42, 0.08);
    border-radius: 8px;
    padding: 4px 10px;
    white-space: nowrap;
  }

  /* ── Divider ─────────────────────────────────────────────── */
  .section-divider {
    height: 1.5px;
    background: linear-gradient(to right, var(--border-light), transparent);
    border: none;
    margin: 0 0 32px 0;
    border-radius: 99px;
  }

  /* ── Tags ────────────────────────────────────────────────── */
  .tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 40px;
  }

  .tag-pill {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-gray);
    background: var(--bg-lighter);
    border: 1.5px solid var(--border-light);
    transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
    cursor: default;
  }

  .tag-pill:hover {
    border-color: rgba(212, 82, 42, 0.35);
    color: var(--primary-terra);
    background: rgba(212, 82, 42, 0.05);
  }

  .tag-pill::before {
    content: '#';
    margin-right: 2px;
    opacity: 0.55;
    font-size: 11px;
  }

  /* ── Sidebar ─────────────────────────────────────────────── */
  .sidebar-card {
    background: var(--bg-lighter);
    border: 1.5px solid var(--border-light);
    border-radius: 24px;
    padding: 28px;
    box-shadow: var(--shadow-lg);
  }

  .sidebar-price-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-light);
  }

  .sidebar-price-val {
    font-size: 36px;
    font-weight: 800;
    color: var(--text-dark);
  }

  .quantity-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-light);
    text-align: left;
  }

  .quantity-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-light);
    border: 1.5px solid var(--border-light);
    border-radius: 14px;
    padding: 8px;
  }

  .quantity-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--bg-lighter);
    border: 1.5px solid var(--border-light);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-dark);
    font-weight: bold;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .quantity-btn:hover:not(:disabled) {
    background: var(--bg-light);
    border-color: var(--primary-terra);
    color: var(--primary-terra);
  }

  .quantity-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .btn-book {
    width: 100%;
    height: 52px;
    border-radius: 12px;
    background: var(--gradient-primary);
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(212, 82, 42, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s;
  }

  .btn-book:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(212, 82, 42, 0.3);
  }

  .btn-book:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* ── Organizer ───────────────────────────────────────────── */
  .organizer-card {
    background: var(--bg-lighter);
    border: 1.5px solid var(--border-light);
    border-radius: 20px;
    padding: 24px;
    box-shadow: var(--shadow-sm);
  }

  .organizer-title {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-light);
    margin-bottom: 16px;
  }

  .organizer-name {
    font-weight: 600;
    font-size: 16px;
    color: var(--text-dark);
  }

  .organizer-note-box {
    margin-top: 20px;
    padding: 16px;
    background: var(--bg-light);
    border: 1.5px solid var(--border-lighter);
    border-radius: 12px;
    position: relative;
  }

  .organizer-note-text {
    font-size: 14px;
    color: var(--text-gray);
    font-style: italic;
    line-height: 1.6;
  }

  /* ── Modal ───────────────────────────────────────────────── */
  .modal-card {
    background: var(--bg-lighter);
    border: 1.5px solid var(--border-light);
    border-radius: 24px;
    padding: 32px;
    max-width: 400px;
    width: 100%;
    text-align: center;
    box-shadow: var(--shadow-xl);
  }

  .modal-title {
    font-family: 'Playfair Display', serif;
    font-size: 24px;
    font-weight: 800;
    color: var(--text-dark);
    margin-bottom: 8px;
  }

  .modal-sub {
    font-size: 15px;
    color: var(--text-gray);
    margin-bottom: 28px;
    line-height: 1.6;
  }
`;

const EventDetails = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [userRegistration, setUserRegistration] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [imageUrls, setImageUrls] = useState([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [ticketsCount, setTicketsCount] = useState(1);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await getEventById(id);
        setEvent(res.data.data.event);
        if (res.data.data.event.images && res.data.data.event.images.length > 0) {
          const urls = await Promise.all(
            res.data.data.event.images.map((_, index) =>
              getEventImage(id, index)
                .then(res => blobToObjectUrl(res.data))
                .catch(() => null)
            )
          );
          setImageUrls(urls.filter(Boolean));
        }
      } catch (err) {
        toast.error('Failed to load event');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
    return () => {
      imageUrls.forEach(url => revokeObjectUrl(url));
    };
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

  const handleRegister = async () => {
    if (!user) { navigate('/login'); return; }
    setRegistering(true);
    try {
      const res = await registerForEvent({ eventId: id, ticketsCount });
      const data = res.data.data;
      if (data.registration) {
        toast.success('Registration successful! 🎉');
        setUserRegistration(data.registration);
        setEvent((prev) => ({ ...prev, registeredCount: prev.registeredCount + ticketsCount }));
        return;
      }
      if (data.orderId) {
        navigate(`/payment/${data.registrationId}`, {
          state: { orderId: data.orderId, amount: data.amount, currency: data.currency, event },
        });
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
      const ticketsRefunded = userRegistration.ticketsCount || 1;
      setUserRegistration(null);
      setEvent((prev) => ({ ...prev, registeredCount: Math.max(0, prev.registeredCount - ticketsRefunded) }));
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
  const allImages = imageUrls.length > 0 ? imageUrls : [];

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

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

  const statusColors = {
    upcoming: 'status-upcoming',
    ongoing: 'status-ongoing',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
  };

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(spotsPercent, 100) / 100) * circumference;

  return (
    <div className="details-root animate-fade-in pb-24">
      <style>{css}</style>

      {/* Hero */}
      {allImages.length > 0 && (
        <div className="details-hero relative w-full overflow-hidden">
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
                className="absolute left-4 top-1/2 -translate-y-1/2 w-[48px] h-[48px] rounded-full bg-[rgba(255,255,255,0.7)] backdrop-blur-md border border-[rgba(0,0,0,0.1)] flex items-center justify-center text-text-dark hover:bg-[rgba(255,255,255,0.9)] transition-all duration-200 active:scale-[0.95] z-20"
              >
                <HiChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setActiveImage(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-[48px] h-[48px] rounded-full bg-[rgba(255,255,255,0.7)] backdrop-blur-md border border-[rgba(0,0,0,0.1)] flex items-center justify-center text-text-dark hover:bg-[rgba(255,255,255,0.9)] transition-all duration-200 active:scale-[0.95] z-20"
              >
                <HiChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`h-2.5 rounded-full transition-all duration-300`}
                    style={{
                      width: i === activeImage ? '28px' : '10px',
                      backgroundColor: i === activeImage ? 'var(--primary-terra)' : 'rgba(139,125,111,0.4)',
                    }}
                  />
                ))}
              </div>
            </>
          )}
          <div className="details-hero-overlay" />
        </div>
      )}

      {/* Content */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${allImages.length > 0 ? '-mt-24' : 'pt-6 md:pt-10'}`}>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* ── Left Column ─────────────────────────────────────── */}
          <div className="flex-1 lg:w-[65%] min-w-0">

            {/* Badges */}
            <div className="badges-row">
              <span className={`category-badge ${getCategoryStyles(event.category)}`}>
                {event.category}
              </span>
              {event.culturalOrigin && (
                <span className="origin-badge">{event.culturalOrigin}</span>
              )}
              <span className={`status-badge ${statusColors[event.status]}`}>
                {event.status}
              </span>
            </div>

            {/* Title */}
            <h1 className="details-title">{event.title}</h1>
            <span className="details-title-underline" />

            {/* Meta Cards */}
            <div className="meta-grid">
              <div className="meta-card">
                <div className="meta-icon">
                  <HiOutlineCalendar className="w-5 h-5" />
                </div>
                <div className="meta-body">
                  <p className="meta-label">Date</p>
                  <p className="meta-val">{formatDate(event.date)}</p>
                </div>
              </div>

              {event.time && (
                <div className="meta-card">
                  <div className="meta-icon">
                    <HiOutlineClock className="w-5 h-5" />
                  </div>
                  <div className="meta-body">
                    <p className="meta-label">Time</p>
                    <p className="meta-val">{event.time}</p>
                    {event.duration && <p className="meta-sub">{event.duration}</p>}
                  </div>
                </div>
              )}

              <div className="meta-card full-width">
                <div className="meta-icon">
                  <HiOutlineLocationMarker className="w-5 h-5" />
                </div>
                <div className="meta-body">
                  <p className="meta-label">Location</p>
                  <p className="meta-val">{event.venue}</p>
                  <p className="meta-sub">
                    {event.address ? `${event.address}, ` : ''}{event.city}{event.state ? `, ${event.state}` : ''}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue + ' ' + event.city)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="meta-map-btn"
                  title="View on Maps"
                >
                  <HiOutlineMap className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Description */}
            <div className="mb-10">
              <div className="section-heading">
                <span className="section-heading-bar" />
                <h3 className="section-heading-text">About This Event</h3>
              </div>
              <div className="desc-block">
                <p className="desc-text">
                  {showFullDesc || event.description.length <= 300
                    ? event.description
                    : `${event.description.substring(0, 300)}...`}
                </p>
                {event.description.length > 300 && (
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="desc-readmore"
                  >
                    {showFullDesc ? '↑ Show less' : 'Read full description →'}
                  </button>
                )}
              </div>
            </div>

            {/* Performers */}
            {event.performers?.length > 0 && (
              <div className="mb-10">
                <div className="section-heading">
                  <span className="section-heading-bar" />
                  <h3 className="section-heading-text">Lineup & Performers</h3>
                </div>
                <div className="performers-grid">
                  {event.performers.map((p, i) => (
                    <div key={i} className="performer-card">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="performer-avatar" style={{ ring: '2px solid var(--border-light)' }} />
                      ) : (
                        <div className="performer-avatar-placeholder">{p.name?.charAt(0)}</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="performer-name">{p.name}</p>
                        {p.role && <span className="performer-role">{p.role}</span>}
                        {p.bio && <p className="performer-bio">{p.bio}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule */}
            {event.schedule?.length > 0 && (
              <div className="mb-10">
                <div className="section-heading">
                  <span className="section-heading-bar" />
                  <h3 className="section-heading-text">Schedule</h3>
                </div>
                <div className="schedule-list">
                  {event.schedule.map((s, i) => (
                    <div key={i} className="schedule-item">
                      <div className="schedule-dot" />
                      <div className="schedule-card">
                        <div>
                          <p className="schedule-activity">{s.activity}</p>
                          {s.performer && <p className="schedule-performer">{s.performer}</p>}
                        </div>
                        <span className="schedule-time">{s.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {event.tags?.length > 0 && (
              <>
                <hr className="section-divider" />
                <div className="tags-row">
                  {event.tags.map((tag, i) => (
                    <span key={i} className="tag-pill">{tag}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Sidebar ──────────────────────────────────────────── */}
          <div className="lg:w-[35%]">
            <div className="sticky top-24 space-y-6">

              {/* Registration Card */}
              <div className="sidebar-card flex flex-col gap-6">

                {/* Price */}
                <div className="flex flex-col items-center text-center gap-1">
                  <span className="sidebar-price-label">Price</span>
                  {event.isFree || event.price === 0 ? (
                    <div className="text-[36px] font-[800] leading-none" style={{ color: 'var(--sage)' }}>FREE</div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <span className="sidebar-price-val">₹{displayPrice}</span>
                      {isEarlyBird && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <span className="text-[15px] line-through" style={{ color: 'var(--text-light)' }}>₹{event.price}</span>
                          <span className="inline-flex items-center justify-center text-[11px] font-[700] uppercase tracking-wider px-2 py-0.5 rounded-sm" style={{ color: 'var(--sage)', backgroundColor: 'rgba(107, 141, 94, 0.12)' }}>
                            Early Bird
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-full h-px bg-[var(--border-lighter)]" />

                {/* Capacity Ring */}
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="relative w-[68px] h-[68px]">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="34" cy="34" r="30" stroke="var(--border-lighter)" strokeWidth="6" fill="transparent" />
                      <circle
                        cx="34" cy="34" r="30"
                        stroke={spotsPercent > 80 ? '#EF4444' : spotsPercent > 50 ? '#F59E0B' : 'var(--sage)'}
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[13px] font-[700]" style={{ color: 'var(--text-dark)' }}>{Math.round(spotsPercent)}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[18px] font-[700] mb-0.5" style={{ color: 'var(--text-dark)' }}>
                      {isSoldOut ? 'Sold Out' : `${spotsLeft} spots left`}
                    </p>
                    <p className="text-[13px]" style={{ color: 'var(--text-light)' }}>Total capacity: {event.capacity}</p>
                  </div>
                </div>

                {/* Quantity */}
                {!userRegistration && !isSoldOut && event.status === 'upcoming' && (
                  <div className="flex flex-col gap-2.5">
                    <label className="quantity-label">Tickets Quantity (Max 5)</label>
                    <div className="quantity-container">
                      <button
                        onClick={() => setTicketsCount(prev => Math.max(1, prev - 1))}
                        disabled={ticketsCount <= 1}
                        className="quantity-btn"
                      >-</button>
                      <span className="text-[18px] font-[800]" style={{ color: 'var(--text-dark)' }}>{ticketsCount}</span>
                      <button
                        onClick={() => setTicketsCount(prev => Math.min(Math.min(5, spotsLeft), prev + 1))}
                        disabled={ticketsCount >= Math.min(5, spotsLeft)}
                        className="quantity-btn"
                      >+</button>
                    </div>
                  </div>
                )}

                {/* Action */}
                {event.status !== 'upcoming' ? (
                  <button disabled className="btn-book" style={{ opacity: 0.5, background: 'var(--border-light)', color: 'var(--text-light)', cursor: 'not-allowed', boxShadow: 'none' }}>
                    Registration Closed
                  </button>
                ) : userRegistration ? (
                  <div className="space-y-4">
                    <div className="border rounded-[16px] p-5 text-center flex flex-col items-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                        <HiCheckCircle className="w-8 h-8" style={{ color: 'var(--sage)' }} />
                      </div>
                      <p className="font-[700] text-[16px] mb-1" style={{ color: 'var(--text-dark)' }}>You're Registered!</p>
                      <p className="text-[13px] font-[600] uppercase tracking-wider mb-4" style={{ color: 'var(--sage)' }}>
                        Payment: {userRegistration.paymentStatus} ({userRegistration.ticketsCount} {userRegistration.ticketsCount === 1 ? 'ticket' : 'tickets'})
                      </p>
                      <Link
                        to="/dashboard"
                        className="inline-flex items-center justify-center gap-2 w-full h-[44px] border rounded-[12px] font-[600] text-[14px] transition-all whitespace-nowrap mb-2"
                        style={{ backgroundColor: 'rgba(107, 141, 94, 0.1)', borderColor: 'rgba(107, 141, 94, 0.2)', color: 'var(--sage)' }}
                      >
                        🎫 View Ticket & QR in Dashboard
                      </Link>
                      <p className="text-[12px]" style={{ color: 'var(--text-light)' }}>Your QR code is available in My Tickets</p>
                    </div>
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="inline-flex items-center justify-center gap-2 w-full h-[48px] bg-transparent border rounded-[12px] font-[600] transition-colors whitespace-nowrap"
                      style={{ borderColor: 'rgba(220, 38, 38, 0.3)', color: '#DC2626' }}
                    >
                      Cancel Registration
                    </button>
                  </div>
                ) : isSoldOut ? (
                  <button disabled className="btn-book" style={{ opacity: 0.5, background: 'var(--border-light)', color: 'var(--text-light)', cursor: 'not-allowed', boxShadow: 'none' }}>
                    Sold Out
                  </button>
                ) : authLoading ? (
                  <button disabled className="btn-book" style={{ opacity: 0.7 }}>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </button>
                ) : !user ? (
                  <Link to="/login" className="btn-book">Login to Register</Link>
                ) : (
                  <button onClick={handleRegister} disabled={registering} className="btn-book">
                    {registering ? (
                      <>
                        <div className="w-5 h-5 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin flex-shrink-0" />
                        Processing...
                      </>
                    ) : event.isFree || event.price === 0 ? (
                      `Register for Free (${ticketsCount} ${ticketsCount === 1 ? 'Ticket' : 'Tickets'})`
                    ) : (
                      `Book Tickets — ₹${displayPrice * ticketsCount}`
                    )}
                  </button>
                )}
              </div>

              {/* Organizer */}
              {event.organizer && (
                <div className="organizer-card">
                  <h3 className="organizer-title">Organized By</h3>
                  <div className="flex items-center justify-start gap-4">
                    {event.organizer.avatar ? (
                      <img src={event.organizer.avatar} alt={event.organizer.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" style={{ ring: '2px solid var(--border-light)' }} />
                    ) : (
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full text-white text-[20px] font-[800] flex-shrink-0" style={{ background: 'var(--gradient-primary)' }}>
                        {event.organizer.name?.charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <p className="organizer-name truncate">{event.organizer.name}</p>
                      <p className="text-[13px] mt-0.5 truncate" style={{ color: 'var(--primary-terra)', fontWeight: '600' }}>Verified Host</p>
                    </div>
                  </div>
                  {event.organizerNote && (
                    <div className="organizer-note-box">
                      <span className="text-[24px] absolute -top-2 -left-1 opacity-20" style={{ color: 'var(--primary-terra)' }}>"</span>
                      <p className="organizer-note-text relative z-10">{event.organizerNote}</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="modal-card">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
              <span className="text-[32px]">⚠️</span>
            </div>
            <h3 className="modal-title">Are you sure?</h3>
            <p className="modal-sub">
              Do you really want to cancel your registration for this event? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="inline-flex items-center justify-center gap-2 flex-1 h-[48px] border rounded-[12px] font-[600] hover:bg-gray-50 transition-all active:scale-[0.98] whitespace-nowrap"
                style={{ borderColor: 'var(--border-light)', color: 'var(--text-dark)' }}
              >
                No, Keep it
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center justify-center gap-2 flex-1 h-[48px] bg-red-600 text-white rounded-[12px] font-[600] hover:bg-red-700 transition-all active:scale-[0.98] whitespace-nowrap"
                style={{ boxShadow: '0 4px 16px rgba(220, 38, 38, 0.2)' }}
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