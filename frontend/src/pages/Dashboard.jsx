import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { SkeletonCard } from '../components/Loader';
import { getMyRegistrations, getUpcomingEvents, cancelRegistration, getEventThumbnail } from '../services/eventService';
import { blobToObjectUrl, revokeObjectUrl } from '../utils/imageUtils';
import { HiOutlineTicket, HiOutlineCalendar, HiOutlineSearch, HiOutlinePencilAlt, HiOutlineDownload, HiOutlineX, HiOutlineCheckCircle, HiOutlineClock, HiOutlineLocationMarker } from 'react-icons/hi';

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('tickets');
  const [registrations, setRegistrations] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketModal, setTicketModal] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [regThumbnails, setRegThumbnails] = useState({});
  const [pendingTicketId, setPendingTicketId] = useState(null);

  // Check for ?ticket=regId from payment redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ticketId = params.get('ticket');
    if (ticketId) {
      setPendingTicketId(ticketId);
      setActiveTab('tickets');
    }
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [regRes, upRes] = await Promise.all([getMyRegistrations(), getUpcomingEvents()]);
        const regs = regRes.data.data.registrations || [];
        setRegistrations(regs);
        setUpcoming(upRes.data.data.events || []);

        // Fetch event thumbnails for registrations
        const thumbs = {};
        for (const reg of regs) {
          if (reg.event?._id) {
            try {
              const res = await getEventThumbnail(reg.event._id);
              thumbs[reg.event._id] = blobToObjectUrl(res.data);
            } catch (err) {
              console.error('Failed to load thumbnail:', err);
            }
          }
        }
        setRegThumbnails(thumbs);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      Object.values(regThumbnails).forEach(url => revokeObjectUrl(url));
    };
  }, []);

  // Auto-open ticket modal after data loads (from payment redirect)
  useEffect(() => {
    if (!loading && pendingTicketId && registrations.length > 0) {
      const reg = registrations.find(r => r._id === pendingTicketId);
      if (reg) {
        setTicketModal(reg);
        setPendingTicketId(null);
        toast.success('🎫 Your ticket is ready!');
      }
    }
  }, [loading, pendingTicketId, registrations]);

  const handleCancel = async (regId) => {
    try {
      await cancelRegistration(regId);
      setRegistrations(prev => prev.map(r => r._id === regId ? { ...r, status: 'cancelled' } : r));
      toast.success('Registration cancelled');
      setCancelConfirm(null);
    } catch {
      toast.error('Failed to cancel registration');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const getTodayDate = () => new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const statusColors = {
    confirmed: { bg: 'rgba(107,141,94,0.1)', text: 'var(--sage)', border: 'rgba(107,141,94,0.3)' },
    cancelled: { bg: 'rgba(212,82,42,0.1)', text: 'var(--primary-terra)', border: 'rgba(212,82,42,0.3)' },
    waitlisted: { bg: 'rgba(201,168,76,0.1)', text: 'var(--gold)', border: 'rgba(201,168,76,0.3)' },
  };

  const tabs = [
    { key: 'tickets', label: 'My Tickets', icon: <HiOutlineTicket style={{ width: '18px', height: '18px' }} /> },
    { key: 'upcoming', label: 'Upcoming Festivals', icon: <HiOutlineCalendar style={{ width: '18px', height: '18px' }} /> },
    { key: 'explore', label: 'Explore', icon: <HiOutlineSearch style={{ width: '18px', height: '18px' }} /> },
  ];

  const cardStyle = {
    background: 'var(--bg-lighter)',
    border: '1.5px solid var(--border-light)',
    borderRadius: '14px',
    padding: '20px',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(26,21,16,0.04)',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)', paddingTop: '80px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(26px, 5vw, 38px)', fontWeight: '800',
            color: 'var(--text-dark)', marginBottom: '6px',
          }}>
            Welcome back, <em style={{ color: 'var(--primary-terra)', fontStyle: 'italic' }}>{user?.name?.split(' ')[0]}</em>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>{getTodayDate()}</p>
        </div>

        {/* Profile card */}
        <div style={{
          ...cardStyle,
          marginBottom: '32px',
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-light)' }} />
            ) : (
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '26px', fontWeight: '800', color: 'white',
                fontFamily: "'Poppins', sans-serif",
              }}>
                {user?.name?.charAt(0)}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-dark)', fontFamily: "'Poppins', sans-serif" }}>{user?.name}</h2>
                <span style={{
                  padding: '2px 10px', borderRadius: '20px',
                  fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                  letterSpacing: '0.06em', fontFamily: "'Poppins', sans-serif",
                  background: user?.role === 'admin' ? 'linear-gradient(135deg, var(--primary-terra), var(--primary-light))' : 'var(--bg-light)',
                  color: user?.role === 'admin' ? 'white' : 'var(--text-light)',
                  border: user?.role === 'admin' ? 'none' : '1.5px solid var(--border-light)',
                }}>
                  {user?.role === 'admin' ? 'Admin' : 'Member'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>{user?.email}</p>
            </div>
          </div>
          <Link to="/profile" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            height: '40px', padding: '0 20px',
            background: 'var(--bg-light)', border: '1.5px solid var(--border-light)',
            borderRadius: '10px', fontSize: '13px', fontWeight: '600',
            color: 'var(--text-dark)', textDecoration: 'none',
            transition: 'all 0.2s ease', fontFamily: "'Poppins', sans-serif",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-terra)'; e.currentTarget.style.color = 'var(--primary-terra)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-dark)'; }}
          >
            <HiOutlinePencilAlt style={{ width: '15px', height: '15px' }} /> Edit Profile
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', overflowX: 'auto', paddingBottom: '4px' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                height: '44px', padding: '0 20px',
                borderRadius: '22px', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s ease', fontFamily: "'Poppins', sans-serif",
                border: activeTab === tab.key ? 'none' : '1.5px solid var(--border-light)',
                background: activeTab === tab.key ? 'linear-gradient(135deg, var(--primary-terra), var(--primary-light))' : 'var(--bg-lighter)',
                color: activeTab === tab.key ? 'white' : 'var(--text-gray)',
                boxShadow: activeTab === tab.key ? '0 4px 16px rgba(212,82,42,0.2)' : 'none',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ ...cardStyle, height: '100px', animation: 'pulse 1.5s ease infinite' }} />
                ))}
              </div>
            ) : registrations.length === 0 ? (
              <div style={{
                ...cardStyle, textAlign: 'center',
                padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
              }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'var(--bg-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <HiOutlineTicket style={{ width: '28px', height: '28px', color: 'var(--text-light)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-dark)', fontFamily: "'Playfair Display', serif", marginBottom: '8px' }}>No tickets yet</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>Start exploring events and register to see your tickets here.</p>
                </div>
                <Link to="/events" style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '10px 24px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--primary-terra), var(--primary-light))',
                  color: 'white', textDecoration: 'none',
                  fontSize: '14px', fontWeight: '600', fontFamily: "'Poppins', sans-serif",
                  boxShadow: '0 4px 16px rgba(212,82,42,0.2)',
                }}>
                  Browse Festivals
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {registrations.map(reg => {
                  const sc = statusColors[reg.status] || { bg: 'var(--bg-light)', text: 'var(--text-light)', border: 'var(--border-light)' };
                  const thumbnail = regThumbnails[reg.event?._id];
                  return (
                    <div key={reg._id} style={{
                      ...cardStyle,
                      display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                      justifyContent: 'space-between', gap: '14px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {thumbnail ? (
                          <img src={thumbnail} alt="" style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary-terra), var(--primary-light))', flexShrink: 0 }} />
                        )}
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)', fontFamily: "'Poppins', sans-serif", marginBottom: '4px' }}>{reg.event?.title}</h4>
                          <p style={{ fontSize: '12px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>
                            {reg.event?.date && new Date(reg.event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {reg.event?.venue}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '20px',
                          fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                          background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                          fontFamily: "'Poppins', sans-serif",
                        }}>
                          {reg.status}
                        </span>
                        {reg.qrCode && reg.status === 'confirmed' && (
                          <button
                            onClick={() => setTicketModal(reg)}
                            style={{
                              height: '34px', padding: '0 14px',
                              background: 'var(--bg-light)', border: '1.5px solid var(--border-light)',
                              borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                              color: 'var(--primary-terra)', cursor: 'pointer',
                              transition: 'all 0.2s ease', fontFamily: "'Poppins', sans-serif",
                            }}
                          >
                            View Ticket
                          </button>
                        )}
                        {reg.status === 'confirmed' && (
                          <button
                            onClick={() => setCancelConfirm(reg._id)}
                            style={{
                              height: '34px', padding: '0 14px',
                              background: 'transparent', border: '1.5px solid rgba(212,82,42,0.3)',
                              borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                              color: 'var(--primary-terra)', cursor: 'pointer',
                              transition: 'all 0.2s ease', fontFamily: "'Poppins', sans-serif",
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Upcoming Tab */}
        {activeTab === 'upcoming' && (
          <div>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : upcoming.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <HiOutlineCalendar style={{ width: '40px', height: '40px', color: 'var(--text-light)' }} />
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-dark)', fontFamily: "'Playfair Display', serif" }}>No upcoming events</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>Check back soon for new festivals!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {upcoming.map(event => <EventCard key={event._id} event={event} />)}
              </div>
            )}
          </div>
        )}

        {/* Explore Tab */}
        {activeTab === 'explore' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {[
              { to: '/events', icon: '🎭', title: 'All Festivals', desc: 'Browse all events' },
              { to: '/events?category=Classical+Music', icon: '🎵', title: 'Classical Music', desc: 'Carnatic & Hindustani' },
              { to: '/events?category=Folk+Dance', icon: '💃', title: 'Folk Dance', desc: 'Garba, Bhangra & more' },
              { to: '/gallery', icon: '📷', title: 'Gallery', desc: 'Event photography' },
            ].map((item, idx) => (
              <Link
                key={idx}
                to={item.to}
                style={{
                  ...cardStyle,
                  display: 'block', textDecoration: 'none',
                  animationDelay: `${idx * 0.1}s`,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = 'var(--primary-terra)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(212,82,42,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,21,16,0.04)'; }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(212,82,42,0.1) 0%, rgba(232,131,94,0.08) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', marginBottom: '12px',
                }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-dark)', fontFamily: "'Poppins', sans-serif", marginBottom: '4px' }}>{item.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>{item.desc}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Modal — Premium QR Design */}
      {ticketModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(26,21,16,0.65)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          animation: 'fadeIn 0.2s ease',
        }} onClick={() => setTicketModal(null)}>
          <div style={{
            background: 'var(--bg-lighter)', borderRadius: '24px',
            maxWidth: '400px', width: '100%',
            border: '1.5px solid var(--border-light)',
            boxShadow: '0 32px 80px rgba(26,21,16,0.25)', overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%)',
              padding: '28px 24px 24px', textAlign: 'center', position: 'relative',
            }}>
              <button onClick={() => setTicketModal(null)} style={{
                position: 'absolute', top: '14px', right: '14px',
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', transition: 'background 0.2s',
              }}>
                <HiOutlineX style={{ width: '17px', height: '17px' }} />
              </button>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', margin: '0 auto 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <HiOutlineTicket style={{ width: '26px', height: '26px', color: 'white' }} />
              </div>
              <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '800', fontFamily: "'Poppins', sans-serif", marginBottom: '2px' }}>Digital Ticket</h3>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', fontFamily: "'Poppins', sans-serif" }}>EventVerse Entry Pass</p>
            </div>

            {/* Dashed divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0',
              margin: '0', position: 'relative',
            }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-light)', flexShrink: 0, marginLeft: '-12px', border: '1.5px solid var(--border-light)', borderLeft: 'none' }} />
              <div style={{ flex: 1, borderTop: '2px dashed var(--border-light)' }} />
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-light)', flexShrink: 0, marginRight: '-12px', border: '1.5px solid var(--border-light)', borderRight: 'none' }} />
            </div>

            {/* Body */}
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <h4 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-dark)', fontFamily: "'Poppins', sans-serif", marginBottom: '4px' }}>{ticketModal.event?.title}</h4>

              {/* Event meta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                {ticketModal.event?.date && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <HiOutlineCalendar style={{ width: '14px', height: '14px', color: 'var(--primary-terra)', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>
                      {formatDate(ticketModal.event.date)}
                    </span>
                  </div>
                )}
                {ticketModal.event?.venue && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <HiOutlineLocationMarker style={{ width: '14px', height: '14px', color: 'var(--primary-terra)', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>
                      {ticketModal.event.venue}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment status badge */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '5px 14px', borderRadius: '20px',
                  fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em',
                  fontFamily: "'Poppins', sans-serif",
                  background: ticketModal.paymentStatus === 'paid' || ticketModal.paymentStatus === 'free'
                    ? 'rgba(107,141,94,0.12)' : 'rgba(201,168,76,0.12)',
                  color: ticketModal.paymentStatus === 'paid' || ticketModal.paymentStatus === 'free'
                    ? 'var(--sage)' : 'var(--gold)',
                  border: ticketModal.paymentStatus === 'paid' || ticketModal.paymentStatus === 'free'
                    ? '1px solid rgba(107,141,94,0.3)' : '1px solid rgba(201,168,76,0.3)',
                }}>
                  <HiOutlineCheckCircle style={{ width: '12px', height: '12px' }} />
                  {ticketModal.paymentStatus === 'free' ? 'Free Entry' : ticketModal.paymentStatus === 'paid' ? 'Payment Confirmed' : ticketModal.paymentStatus}
                </span>
              </div>

              {/* QR Code — only for confirmed tickets */}
              {(ticketModal.paymentStatus === 'paid' || ticketModal.paymentStatus === 'free') && ticketModal.qrCode ? (
                <>
                  <div style={{
                    background: 'white', padding: '14px', borderRadius: '16px',
                    display: 'inline-block', marginBottom: '12px',
                    boxShadow: '0 4px 20px rgba(26,21,16,0.10)',
                    border: '1.5px solid var(--border-lighter)',
                  }}>
                    <img src={ticketModal.qrCode} alt="QR Code" style={{ width: '170px', height: '170px', display: 'block' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--sage)', animation: 'pulse 1.5s ease infinite' }} />
                    <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Poppins', sans-serif" }}>Valid Entry Pass</p>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif", marginBottom: '20px' }}>Show this QR code at the venue entrance</p>
                </>
              ) : (
                <div style={{
                  background: 'rgba(201,168,76,0.06)', border: '1.5px dashed rgba(201,168,76,0.3)',
                  borderRadius: '12px', padding: '20px', marginBottom: '20px',
                }}>
                  <HiOutlineClock style={{ width: '28px', height: '28px', color: 'var(--gold)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-gray)', fontFamily: "'Poppins', sans-serif", fontWeight: '600' }}>QR code will appear after payment</p>
                </div>
              )}

              {/* Ticket ID */}
              <p style={{ fontSize: '11px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif", marginBottom: '16px', letterSpacing: '0.04em' }}>
                Ticket ID: #{ticketModal._id?.slice(-8).toUpperCase()}
              </p>

              {/* Download button */}
              {ticketModal.qrCode && (ticketModal.paymentStatus === 'paid' || ticketModal.paymentStatus === 'free') && (
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = ticketModal.qrCode;
                    link.download = `eventverse-ticket-${ticketModal._id?.slice(-8)}.png`;
                    link.click();
                  }}
                  style={{
                    width: '100%', height: '46px',
                    background: 'linear-gradient(135deg, var(--primary-terra), var(--primary-light))',
                    color: 'white', border: 'none', borderRadius: '12px',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    fontFamily: "'Poppins', sans-serif",
                    boxShadow: '0 4px 16px rgba(212,82,42,0.25)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <HiOutlineDownload style={{ width: '17px', height: '17px' }} /> Download QR Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(26,21,16,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div style={{
            background: 'var(--bg-lighter)', borderRadius: '20px',
            maxWidth: '360px', width: '100%', padding: '36px 28px',
            border: '1.5px solid var(--border-light)',
            boxShadow: '0 24px 60px rgba(26,21,16,0.15)', textAlign: 'center',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(212,82,42,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '28px',
            }}>
              ⚠️
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: "'Playfair Display', serif", marginBottom: '10px' }}>Cancel Registration?</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif", lineHeight: '1.6', marginBottom: '24px' }}>
              Are you sure? This action cannot be undone and your spot will be given to someone else.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setCancelConfirm(null)} style={{
                flex: 1, height: '44px', background: 'var(--bg-light)',
                border: '1.5px solid var(--border-light)', borderRadius: '10px',
                fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)', cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
              }}>
                Keep it
              </button>
              <button onClick={() => handleCancel(cancelConfirm)} style={{
                flex: 1, height: '44px',
                background: 'linear-gradient(135deg, #E05C3A, var(--primary-terra))',
                border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: '600', color: 'white', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(212,82,42,0.2)',
                fontFamily: "'Poppins', sans-serif",
              }}>
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
};

export default Dashboard;