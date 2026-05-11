import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { SkeletonCard } from '../components/Loader';
import {
  getMyRegistrations,
  getUpcomingEvents,
  cancelRegistration,
} from '../services/eventService';
import { HiOutlineTicket, HiOutlineCalendar, HiOutlineSearch, HiOutlinePhotograph, HiOutlinePencilAlt, HiOutlineDownload, HiOutlineX } from 'react-icons/hi';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tickets');
  const [registrations, setRegistrations] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketModal, setTicketModal] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [regRes, upRes] = await Promise.all([
          getMyRegistrations(),
          getUpcomingEvents(),
        ]);
        setRegistrations(regRes.data.data.registrations || []);
        setUpcoming(upRes.data.data.events || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCancel = async (regId) => {
    try {
      await cancelRegistration(regId);
      setRegistrations((prev) =>
        prev.map((r) =>
          r._id === regId ? { ...r, status: 'cancelled' } : r
        )
      );
      toast.success('Registration cancelled');
      setCancelConfirm(null);
    } catch (err) {
      toast.error('Failed to cancel registration');
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const statusBadge = (status) => {
    const map = {
      confirmed: 'bg-[rgba(16,185,129,0.15)] text-success border-[rgba(16,185,129,0.3)]',
      cancelled: 'bg-[rgba(239,68,68,0.15)] text-danger border-[rgba(239,68,68,0.3)]',
      waitlisted: 'bg-[rgba(245,158,11,0.15)] text-warning border-[rgba(245,158,11,0.3)]',
    };
    return map[status] || 'bg-[rgba(255,255,255,0.1)] text-text-muted border-[rgba(255,255,255,0.2)]';
  };

  const paymentBadge = (ps) => {
    const map = {
      paid: 'bg-[rgba(16,185,129,0.15)] text-success border-[rgba(16,185,129,0.3)]',
      free: 'bg-[rgba(6,182,212,0.15)] text-accent-cyan border-[rgba(6,182,212,0.3)]',
      pending: 'bg-[rgba(245,158,11,0.15)] text-warning border-[rgba(245,158,11,0.3)]',
      failed: 'bg-[rgba(239,68,68,0.15)] text-danger border-[rgba(239,68,68,0.3)]',
    };
    return map[ps] || 'bg-[rgba(255,255,255,0.1)] text-text-muted border-[rgba(255,255,255,0.2)]';
  };

  const tabs = [
    { key: 'tickets', label: 'My Tickets', icon: <HiOutlineTicket className="w-5 h-5" /> },
    { key: 'upcoming', label: 'Upcoming Festivals', icon: <HiOutlineCalendar className="w-5 h-5" /> },
    { key: 'explore', label: 'Explore', icon: <HiOutlineSearch className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-bg-base pt-[80px] pb-20 animate-fade-in relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[rgba(124,58,237,0.1)] rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-[32px] md:text-[40px] font-[800] tracking-[-0.02em] text-text-primary mb-2">
            Welcome back, <span className="bg-accent-gradient bg-clip-text text-transparent">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-[15px] text-text-muted font-[500]">{getTodayDate()}</p>
        </div>

        {/* Profile Summary Card */}
        <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-card border border-[rgba(255,255,255,0.08)] rounded-[20px] p-6 sm:p-8 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-card hover:border-[rgba(255,255,255,0.12)] transition-colors">
          <div className="flex items-center gap-6">
            <div className="relative">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-[80px] h-[80px] rounded-full object-cover ring-2 ring-transparent ring-offset-2 ring-offset-bg-base bg-accent-gradient p-[2px]" />
              ) : (
                <div className="w-[80px] h-[80px] rounded-full bg-accent-gradient flex items-center justify-center text-white text-[32px] font-[800] ring-4 ring-[rgba(124,58,237,0.2)]">
                  {user?.name?.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-[24px] font-[700] text-text-primary">{user?.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-[700] uppercase tracking-wider ${
                  user?.role === 'admin' 
                    ? 'bg-accent-gradient text-white shadow-glow-primary' 
                    : 'bg-[rgba(255,255,255,0.06)] text-text-muted border border-[rgba(255,255,255,0.1)]'
                }`}>
                  {user?.role === 'admin' ? 'Admin' : 'Member'}
                </span>
              </div>
              <p className="text-[14px] text-text-muted">{user?.email}</p>
            </div>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center justify-center gap-2 h-[44px] px-6 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-white rounded-[12px] font-[600] text-[14px] hover:bg-[rgba(255,255,255,0.1)] transition-colors active:scale-[0.98] w-full sm:w-auto whitespace-nowrap"
          >
            <HiOutlinePencilAlt className="w-4 h-4 flex-shrink-0" /> Edit Profile
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center justify-center gap-2 h-[48px] px-6 rounded-full text-[14px] font-[600] transition-all whitespace-nowrap border ${
                activeTab === tab.key
                  ? 'bg-[rgba(124,58,237,0.2)] text-white border-[rgba(124,58,237,0.4)] shadow-glow-primary'
                  : 'bg-[rgba(255,255,255,0.02)] text-text-muted border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.06)] hover:text-text-primary'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* My Tickets Tab */}
          {activeTab === 'tickets' && (
            <div>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[16px] p-5 animate-pulse flex gap-4">
                      <div className="w-24 h-16 bg-[rgba(255,255,255,0.05)] rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-[rgba(255,255,255,0.05)] rounded w-1/2" />
                        <div className="h-4 bg-[rgba(255,255,255,0.05)] rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-20 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[20px] backdrop-blur-card">
                  <div className="w-20 h-20 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center mx-auto mb-6">
                    <HiOutlineTicket className="w-10 h-10 text-text-muted" />
                  </div>
                  <h3 className="text-[20px] font-[700] text-text-primary mb-2">
                    No registrations yet
                  </h3>
                  <p className="text-[15px] text-text-muted mb-8 max-w-sm mx-auto">
                    You haven't registered for any events yet. Discover amazing cultural festivals and book your spot!
                  </p>
                  <Link
                    to="/events"
                    className="inline-flex items-center justify-center gap-2 h-[48px] px-8 bg-accent-gradient text-white rounded-[12px] font-[600] hover:shadow-glow-primary transition-all active:scale-[0.98] whitespace-nowrap"
                  >
                    Explore Festivals
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {registrations.map((reg) => (
                    <div
                      key={reg._id}
                      className="group bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[16px] p-5 flex flex-col sm:flex-row gap-5 hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.12)] transition-all"
                    >
                      <Link to={`/events/${reg.event?._id}`} className="shrink-0 overflow-hidden rounded-[12px]">
                        <img
                          src={
                            reg.event?.thumbnail ||
                            'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=200&q=80'
                          }
                          alt={reg.event?.title}
                          className="w-full sm:w-[120px] h-[80px] object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <Link
                          to={`/events/${reg.event?._id}`}
                          className="font-[700] text-[18px] text-text-primary hover:text-accent-cyan transition-colors truncate mb-1"
                        >
                          {reg.event?.title || 'Event'}
                        </Link>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-text-muted mb-3">
                          <span className="flex items-center gap-1.5"><HiOutlineCalendar /> {formatDate(reg.event?.date)}</span>
                          <span className="flex items-center gap-1.5">📍 {reg.event?.venue}, {reg.event?.city}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2.5 py-0.5 rounded-[6px] text-[11px] font-[700] uppercase tracking-wider border ${statusBadge(reg.status)}`}>
                            {reg.status}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-[6px] text-[11px] font-[700] uppercase tracking-wider border ${paymentBadge(reg.paymentStatus)}`}>
                            {reg.paymentStatus}
                          </span>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 shrink-0 justify-center mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-[rgba(255,255,255,0.06)] sm:border-t-0 sm:pl-4 sm:border-l">
                        {reg.qrCode && reg.status !== 'cancelled' && (
                          <button
                            onClick={() => setTicketModal(reg)}
                            className="inline-flex items-center justify-center gap-2 flex-1 sm:flex-none h-[36px] px-4 bg-[rgba(124,58,237,0.15)] text-accent-primary border border-[rgba(124,58,237,0.3)] rounded-[8px] text-[13px] font-[600] hover:bg-[rgba(124,58,237,0.25)] transition-colors whitespace-nowrap"
                          >
                            View Ticket
                          </button>
                        )}
                        {reg.status === 'confirmed' && (
                          <button
                            onClick={() => setCancelConfirm(reg._id)}
                            className="inline-flex items-center justify-center gap-2 flex-1 sm:flex-none h-[36px] px-4 bg-transparent border border-[rgba(239,68,68,0.3)] text-danger rounded-[8px] text-[13px] font-[600] hover:bg-[rgba(239,68,68,0.1)] transition-colors whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming Tab */}
          {activeTab === 'upcoming' && (
            <div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="text-center py-20 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[20px] backdrop-blur-card">
                  <div className="w-20 h-20 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center mx-auto mb-6">
                    <HiOutlineCalendar className="w-10 h-10 text-text-muted" />
                  </div>
                  <h3 className="text-[20px] font-[700] text-text-primary mb-2">
                    No upcoming events
                  </h3>
                  <p className="text-[15px] text-text-muted">Check back soon for new festivals!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcoming.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Explore Tab */}
          {activeTab === 'explore' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { to: '/events', icon: '🎭', title: 'All Festivals', desc: 'Browse all events', color: 'from-purple-500/20 to-indigo-500/20' },
                { to: '/events?category=Classical+Music', icon: '🎵', title: 'Classical Music', desc: 'Carnatic & Hindustani', color: 'from-amber-500/20 to-orange-500/20' },
                { to: '/events?category=Folk+Dance', icon: '💃', title: 'Folk Dance', desc: 'Garba, Bhangra & more', color: 'from-pink-500/20 to-rose-500/20' },
                { to: '/gallery', icon: <HiOutlinePhotograph className="w-8 h-8 text-cyan-400" />, title: 'Gallery', desc: 'Event photography', color: 'from-cyan-500/20 to-blue-500/20' },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  to={item.to}
                  className="bg-[rgba(255,255,255,0.02)] rounded-[20px] p-6 border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.12)] transition-all group hover:-translate-y-1"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} border border-[rgba(255,255,255,0.05)] flex items-center justify-center text-[28px] mb-4 group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <h3 className="text-[18px] font-[700] text-text-primary mb-1 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[14px] text-text-muted">{item.desc}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {ticketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[rgba(10,10,15,0.95)] border border-[rgba(255,255,255,0.1)] rounded-[24px] max-w-sm w-full shadow-modal overflow-hidden animate-slide-up relative">
            <button 
              onClick={() => setTicketModal(null)}
              className="absolute top-4 right-4 w-8 h-8 inline-flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.2)] transition-colors z-10"
            >
              <HiOutlineX className="w-5 h-5 flex-shrink-0" />
            </button>
            <div className="bg-accent-gradient p-6 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
              <h3 className="text-[20px] font-[800] relative z-10">🎫 Digital Ticket</h3>
            </div>
            <div className="p-8 text-center bg-[rgba(255,255,255,0.02)]">
              <h4 className="text-[20px] font-[700] text-text-primary mb-2 leading-tight">
                {ticketModal.event?.title}
              </h4>
              <p className="text-[14px] text-text-muted mb-6">
                {formatDate(ticketModal.event?.date)} • {ticketModal.event?.venue}
              </p>
              
              {ticketModal.qrCode && (
                <div className="bg-white p-3 rounded-[16px] inline-block mb-4 shadow-lg">
                  <img
                    src={ticketModal.qrCode}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <p className="text-[13px] font-[600] text-success uppercase tracking-wider">Valid Entry Pass</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = ticketModal.qrCode;
                    link.download = `ticket-${ticketModal._id}.png`;
                    link.click();
                  }}
                  className="inline-flex items-center justify-center gap-2 flex-1 h-[44px] bg-accent-gradient text-white rounded-[10px] text-[14px] font-[600] hover:shadow-glow-primary transition-all active:scale-[0.98] whitespace-nowrap"
                >
                  <HiOutlineDownload className="w-5 h-5 flex-shrink-0" /> Download QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirm Modal */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[rgba(10,10,15,0.95)] border border-[rgba(255,255,255,0.1)] rounded-[20px] p-8 max-w-sm w-full shadow-modal animate-slide-up scale-95 origin-bottom text-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center mx-auto mb-5">
              <span className="text-[32px]">⚠️</span>
            </div>
            <h3 className="text-[24px] font-[800] text-white mb-2">Cancel Registration?</h3>
            <p className="text-[15px] text-text-muted mb-8 leading-relaxed">
              Are you sure you want to cancel? This action cannot be undone and your spot will be given to someone else.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirm(null)}
                className="inline-flex items-center justify-center gap-2 flex-1 h-[48px] border border-[rgba(255,255,255,0.12)] text-text-primary rounded-[12px] font-[600] hover:bg-[rgba(255,255,255,0.06)] transition-all active:scale-[0.98] whitespace-nowrap"
              >
                Keep it
              </button>
              <button
                onClick={() => handleCancel(cancelConfirm)}
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

export default Dashboard;
