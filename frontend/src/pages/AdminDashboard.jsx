import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FullscreenLoader } from '../components/Loader';
import {
  getAdminStats,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleFeatured,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllAdminRegistrations,
} from '../services/eventService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  HiOutlineChartBar, 
  HiOutlineCollection, 
  HiOutlineUsers, 
  HiOutlineTicket,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineStar,
  HiStar,
  HiOutlineX
} from 'react-icons/hi';

const CATEGORIES = [
  'Classical Music', 'Folk Dance', 'Classical Dance',
  'Art Exhibition', 'Food Festival', 'Theater & Drama',
  'Craft Fair', 'Cultural Parade', 'Literary Festival',
  'Film Festival', 'Spiritual & Religious', 'Other',
];

const COLORS = ['#A855F7', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#3B82F6', '#14B8A6', '#F97316', '#6366F1', '#D946EF'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState(null);

  // Events State
  const [events, setEvents] = useState([]);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsTotal, setEventsTotal] = useState(1);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventFormData, setEventFormData] = useState(initialEventForm());
  const [eventSaving, setEventSaving] = useState(false);

  // Users State
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(1);
  const [userSearch, setUserSearch] = useState('');

  // Registrations State
  const [registrations, setRegistrations] = useState([]);
  const [regsPage, setRegsPage] = useState(1);
  const [regsTotal, setRegsTotal] = useState(1);
  const [regEventFilter, setRegEventFilter] = useState('');

  function initialEventForm() {
    return {
      title: '', description: '', shortDescription: '', category: 'Classical Music',
      culturalOrigin: '', language: '', date: '', endDate: '', time: '', duration: '',
      venue: '', address: '', city: '', state: '', price: 0, isFree: false,
      earlyBirdPrice: '', earlyBirdDeadline: '', capacity: 100, waitlistEnabled: false,
      videoUrl: '', tags: '', highlights: '', organizerNote: '', status: 'upcoming',
      performers: [], schedule: [], images: [] // images will be File objects for upload
    };
  }

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
    else if (activeTab === 'events') fetchEvents();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'registrations') fetchRegistrations();
  }, [activeTab, eventsPage, usersPage, regsPage, userSearch, regEventFilter]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await getAdminStats();
      setStats(res.data.data);
    } catch (err) {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await getAllEvents({ page: eventsPage, limit: 10 });
      setEvents(res.data.data.events);
      setEventsTotal(res.data.data.totalPages);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers({ page: usersPage, limit: 10, search: userSearch });
      setUsers(res.data.data.users);
      setUsersTotal(res.data.data.totalPages);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await getAllAdminRegistrations({ page: regsPage, limit: 10, eventId: regEventFilter });
      setRegistrations(res.data.data.registrations);
      setRegsTotal(res.data.data.totalPages);
    } catch (err) {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  // Event Handlers
  const handleEventDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(id);
      toast.success('Event deleted');
      fetchEvents();
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      await toggleFeatured(id);
      toast.success('Featured status updated');
      fetchEvents();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const openEventModal = (event = null) => {
    setCurrentEvent(event);
    if (event) {
      setEventFormData({
        ...event,
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
        earlyBirdDeadline: event.earlyBirdDeadline ? new Date(event.earlyBirdDeadline).toISOString().split('T')[0] : '',
        tags: event.tags ? event.tags.join(', ') : '',
        highlights: event.highlights ? event.highlights.join('\n') : '',
        images: [] // Reset images for file upload
      });
    } else {
      setEventFormData(initialEventForm());
    }
    setEventModalOpen(true);
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setEventSaving(true);
    try {
      const formData = new FormData();
      Object.keys(eventFormData).forEach(key => {
        if (key === 'performers' || key === 'schedule') {
          formData.append(key, JSON.stringify(eventFormData[key]));
        } else if (key === 'tags') {
          formData.append(key, JSON.stringify(eventFormData.tags.split(',').map(t => t.trim()).filter(t => t)));
        } else if (key === 'highlights') {
          formData.append(key, JSON.stringify(eventFormData.highlights.split('\n').filter(h => h.trim())));
        } else if (key === 'images') {
          Array.from(eventFormData.images).forEach(file => formData.append('images', file));
        } else if (eventFormData[key] !== null && eventFormData[key] !== '') {
          formData.append(key, eventFormData[key]);
        }
      });

      if (currentEvent) {
        await updateEvent(currentEvent._id, formData);
        toast.success('Event updated successfully');
      } else {
        await createEvent(formData);
        toast.success('Event created successfully');
      }
      setEventModalOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    } finally {
      setEventSaving(false);
    }
  };

  const handleDynamicArrayChange = (field, index, subfield, value) => {
    const updatedArray = [...eventFormData[field]];
    updatedArray[index][subfield] = value;
    setEventFormData({ ...eventFormData, [field]: updatedArray });
  };

  const addDynamicItem = (field, defaultObj) => {
    setEventFormData({ ...eventFormData, [field]: [...eventFormData[field], defaultObj] });
  };

  const removeDynamicItem = (field, index) => {
    const updatedArray = eventFormData[field].filter((_, i) => i !== index);
    setEventFormData({ ...eventFormData, [field]: updatedArray });
  };

  // User Handlers
  const handleRoleToggle = async (id) => {
    if (id === user._id) return toast.error('Cannot change your own role');
    try {
      await updateUserRole(id);
      toast.success('User role updated');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleUserDelete = async (id) => {
    if (id === user._id) return toast.error('Cannot delete yourself');
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(id);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const tabs = [
    { id: 'stats', label: 'Overview', icon: <HiOutlineChartBar className="w-5 h-5" /> },
    { id: 'events', label: 'Events', icon: <HiOutlineCollection className="w-5 h-5" /> },
    { id: 'users', label: 'Users', icon: <HiOutlineUsers className="w-5 h-5" /> },
    { id: 'registrations', label: 'Registrations', icon: <HiOutlineTicket className="w-5 h-5" /> },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[rgba(10,10,15,0.95)] border border-[rgba(255,255,255,0.1)] p-3 rounded-[8px] shadow-lg">
          <p className="text-[13px] text-text-muted mb-1">{label}</p>
          <p className="text-[15px] font-[700] text-accent-cyan">{payload[0].value} <span className="text-[12px] font-[500] text-text-muted">registrations</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col md:flex-row pt-[70px] animate-fade-in">
      {/* Sidebar */}
      <aside className="w-full md:w-[260px] md:h-[calc(100vh-70px)] md:sticky md:top-[70px] border-r border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)] flex flex-col z-20">
        <div className="p-6 pb-2 hidden md:block">
          <h2 className="text-[12px] font-[700] uppercase tracking-[0.05em] text-text-subtle mb-4">Admin Panel</h2>
        </div>
        <nav className="flex flex-row md:flex-col p-4 md:p-4 gap-2 overflow-x-auto md:overflow-y-auto scrollbar-hide flex-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center justify-start gap-3 px-4 py-3 rounded-[12px] text-[14px] font-[600] transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[rgba(124,58,237,0.15)] text-accent-primary border border-[rgba(124,58,237,0.3)] shadow-[inset_0_0_20px_rgba(124,58,237,0.1)]'
                  : 'text-text-muted hover:bg-[rgba(255,255,255,0.04)] hover:text-text-primary border border-transparent'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto md:h-[calc(100vh-70px)] relative">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[rgba(124,58,237,0.08)] rounded-full filter blur-[120px] pointer-events-none" />

        {loading && <FullscreenLoader />}

        {!loading && activeTab === 'stats' && stats && (
          <div className="space-y-8 relative z-10 animate-slide-up">
            <div>
              <h2 className="text-[28px] font-[800] text-text-primary mb-1">Dashboard Overview</h2>
              <p className="text-[14px] text-text-muted">Platform metrics and recent activity</p>
            </div>
            
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Total Users', value: stats.totalUsers, icon: <HiOutlineUsers />, color: 'text-accent-primary', bg: 'bg-[rgba(124,58,237,0.15)]' },
                { title: 'Total Events', value: stats.totalEvents, icon: <HiOutlineCollection />, color: 'text-accent-cyan', bg: 'bg-[rgba(6,182,212,0.15)]' },
                { title: 'Registrations', value: stats.totalRegistrations, icon: <HiOutlineTicket />, color: 'text-warning', bg: 'bg-[rgba(245,158,11,0.15)]' },
                { title: 'Total Revenue', value: `₹${stats.totalRevenue > 0 ? stats.totalRevenue[0].total.toLocaleString() : 0}`, icon: <HiOutlineChartBar />, color: 'text-success', bg: 'bg-[rgba(16,185,129,0.15)]' },
              ].map((metric, idx) => (
                <div key={idx} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[16px] p-6 backdrop-blur-card hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center text-[24px] ${metric.bg} ${metric.color}`}>
                      {metric.icon}
                    </div>
                  </div>
                  <p className="text-[13px] font-[600] uppercase tracking-wider text-text-subtle mb-1">{metric.title}</p>
                  <p className={`text-[32px] font-[800] ${idx === 3 ? 'text-success' : 'text-text-primary'} leading-none`}>{metric.value}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 backdrop-blur-card h-[400px]">
                <h3 className="text-[16px] font-[700] text-text-primary mb-6">Monthly Registrations</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyRegistrations} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="_id" stroke="var(--text-muted)" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="count" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 backdrop-blur-card h-[400px] flex flex-col">
                <h3 className="text-[16px] font-[700] text-text-primary mb-6">Events by Category</h3>
                <div className="flex-1 relative pb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryBreakdown}
                        dataKey="count"
                        nameKey="_id"
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        stroke="rgba(10,10,15,1)"
                        strokeWidth={2}
                      >
                        {stats.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-6">
                    <div className="text-center">
                      <p className="text-[32px] font-[800] text-text-primary leading-none">{stats.totalEvents}</p>
                      <p className="text-[12px] text-text-muted font-[600] uppercase tracking-wider">Events</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
               <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 backdrop-blur-card overflow-hidden flex flex-col">
                 <h3 className="text-[16px] font-[700] text-text-primary mb-6">Recent Registrations</h3>
                 <div className="overflow-x-auto -mx-6 px-6">
                   <table className="w-full text-left border-collapse min-w-[400px]">
                     <thead>
                       <tr>
                         <th className="pb-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">User</th>
                         <th className="pb-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">Event</th>
                         <th className="pb-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)] text-right">Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                       {stats.recentRegistrations.map(reg => (
                         <tr key={reg._id} className="hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                           <td className="py-4">
                             <p className="text-[14px] font-[600] text-text-primary">{reg.user?.name}</p>
                           </td>
                           <td className="py-4">
                             <p className="text-[14px] text-text-muted truncate max-w-[150px] sm:max-w-[200px]" title={reg.event?.title}>{reg.event?.title}</p>
                           </td>
                           <td className="py-4 text-right">
                             <span className={`inline-block px-2.5 py-1 rounded-[6px] text-[11px] font-[700] uppercase tracking-wider border ${reg.status === 'confirmed' ? 'bg-[rgba(16,185,129,0.1)] text-success border-[rgba(16,185,129,0.2)]' : 'bg-[rgba(255,255,255,0.05)] text-text-muted border-[rgba(255,255,255,0.1)]'}`}>
                               {reg.status}
                             </span>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>

               <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 backdrop-blur-card overflow-hidden flex flex-col">
                 <h3 className="text-[16px] font-[700] text-text-primary mb-6">Upcoming Events</h3>
                 <div className="space-y-1">
                   {stats.upcomingEvents.map(event => {
                     const fillPercent = Math.min((event.registeredCount/event.capacity)*100, 100);
                     return (
                       <div key={event._id} className="group flex justify-between items-center p-3 rounded-[12px] hover:bg-[rgba(255,255,255,0.03)] border border-transparent hover:border-[rgba(255,255,255,0.06)] transition-all">
                         <div className="min-w-0 flex-1 pr-4">
                           <p className="text-[14px] font-[600] text-text-primary truncate">{event.title}</p>
                           <p className="text-[12px] text-text-muted">{new Date(event.date).toLocaleDateString()}</p>
                         </div>
                         <div className="shrink-0 text-right w-[80px]">
                           <span className="text-[13px] font-[700] text-accent-cyan block mb-1">{event.registeredCount}/{event.capacity}</span>
                           <div className="w-full h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                             <div className="h-full bg-accent-cyan rounded-full transition-all" style={{ width: `${fillPercent}%` }} />
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'events' && (
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[20px] backdrop-blur-card overflow-hidden animate-slide-up relative z-10 pb-4">
            <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-[rgba(255,255,255,0.06)]">
              <div>
                <h2 className="text-[20px] font-[800] text-text-primary">Manage Events</h2>
                <p className="text-[13px] text-text-muted mt-1">Create and manage festival listings</p>
              </div>
              <button
                onClick={() => openEventModal()}
                className="inline-flex items-center justify-center gap-2 h-[44px] px-6 bg-accent-gradient text-white rounded-[12px] font-[600] text-[14px] hover:shadow-glow-primary transition-all active:scale-[0.98] whitespace-nowrap"
              >
                <HiOutlinePlus className="w-5 h-5 flex-shrink-0" /> New Festival
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[rgba(255,255,255,0.01)]">
                    <th className="px-6 py-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">Event</th>
                    <th className="px-6 py-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">Date & Location</th>
                    <th className="px-6 py-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">Price</th>
                    <th className="px-6 py-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">Stats</th>
                    <th className="px-6 py-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)] text-center">Featured</th>
                    <th className="px-6 py-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                  {events.map((event) => (
                    <tr key={event._id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img src={event.thumbnail || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=100&q=80'} alt={event.title} className="w-12 h-12 rounded-[10px] object-cover ring-1 ring-[rgba(255,255,255,0.1)]" />
                          <div>
                            <p className="font-[600] text-[15px] text-text-primary line-clamp-1 mb-0.5">{event.title}</p>
                            <span className="px-2 py-0.5 rounded-[4px] bg-[rgba(255,255,255,0.06)] text-[11px] text-text-muted">{event.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[14px] text-text-primary mb-0.5">{new Date(event.date).toLocaleDateString()}</p>
                        <p className="text-[12px] text-text-muted">{event.city}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[14px] font-[600] ${event.isFree ? 'text-success' : 'text-text-primary'}`}>
                          {event.isFree ? 'Free' : `₹${event.price}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-[rgba(255,255,255,0.1)] rounded-full h-1.5 min-w-[60px] max-w-[80px]">
                            <div className="bg-accent-cyan h-1.5 rounded-full" style={{ width: `${Math.min((event.registeredCount/event.capacity)*100, 100)}%` }}></div>
                          </div>
                          <span className="text-[12px] text-text-muted font-[500] w-12">{event.registeredCount}/{event.capacity}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleToggleFeatured(event._id)} 
                          className={`w-8 h-8 rounded-full inline-flex items-center justify-center mx-auto transition-colors ${event.isFeatured ? 'bg-[rgba(245,158,11,0.15)] text-warning' : 'text-text-muted hover:bg-[rgba(255,255,255,0.1)]'}`}
                          title="Toggle Featured"
                        >
                          {event.isFeatured ? <HiStar className="w-5 h-5 flex-shrink-0" /> : <HiOutlineStar className="w-5 h-5 flex-shrink-0" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEventModal(event)} 
                            className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] inline-flex items-center justify-center text-text-primary hover:bg-[rgba(124,58,237,0.2)] hover:text-accent-primary hover:border-[rgba(124,58,237,0.4)] transition-all"
                            title="Edit Event"
                          >
                            <HiOutlinePencilAlt className="w-4 h-4 flex-shrink-0" />
                          </button>
                          <button 
                            onClick={() => handleEventDelete(event._id)} 
                            className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] inline-flex items-center justify-center text-text-primary hover:bg-[rgba(239,68,68,0.2)] hover:text-danger hover:border-[rgba(239,68,68,0.4)] transition-all"
                            title="Delete Event"
                          >
                            <HiOutlineTrash className="w-4 h-4 flex-shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {eventsTotal > 1 && (
              <div className="px-6 pt-6 flex justify-between items-center">
                <button 
                  disabled={eventsPage === 1} 
                  onClick={() => setEventsPage(p => p - 1)} 
                  className="inline-flex items-center justify-center gap-2 h-[36px] px-4 rounded-[8px] border border-[rgba(255,255,255,0.1)] text-[13px] font-[600] text-text-muted hover:text-white hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-30 transition-colors whitespace-nowrap"
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: eventsTotal }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setEventsPage(p)}
                      className={`inline-flex items-center justify-center gap-2 w-8 h-8 rounded-[6px] text-[13px] font-[600] transition-colors whitespace-nowrap ${
                        eventsPage === p 
                          ? 'bg-[rgba(124,58,237,0.2)] text-accent-primary border border-[rgba(124,58,237,0.4)]' 
                          : 'text-text-muted hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={eventsPage === eventsTotal} 
                  onClick={() => setEventsPage(p => p + 1)} 
                  className="inline-flex items-center justify-center gap-2 h-[36px] px-4 rounded-[8px] border border-[rgba(255,255,255,0.1)] text-[13px] font-[600] text-text-muted hover:text-white hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-30 transition-colors whitespace-nowrap"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'users' && (
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[20px] backdrop-blur-card overflow-hidden animate-slide-up relative z-10 pb-4">
            <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-[rgba(255,255,255,0.06)]">
              <div>
                <h2 className="text-[20px] font-[800] text-text-primary">Manage Users</h2>
                <p className="text-[13px] text-text-muted mt-1">View and manage user roles</p>
              </div>
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineSearch className="w-4 h-4 text-text-subtle" />
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full h-[40px] pl-10 pr-4 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-text-primary placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-[rgba(255,255,255,0.01)]">
                    <th className="px-6 py-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">User</th>
                    <th className="px-6 py-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">Email</th>
                    <th className="px-6 py-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">Role</th>
                    <th className="px-6 py-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">Joined</th>
                    <th className="px-6 py-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-text-primary font-[700] text-[16px]">
                            {u.name.charAt(0)}
                          </div>
                          <span className="font-[600] text-[14px] text-text-primary">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-text-muted">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-[700] uppercase tracking-wider border ${
                          u.role === 'admin' 
                            ? 'bg-[rgba(124,58,237,0.15)] text-accent-primary border-[rgba(124,58,237,0.3)]' 
                            : 'bg-[rgba(255,255,255,0.05)] text-text-muted border-[rgba(255,255,255,0.1)]'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-text-muted">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {u._id !== user._id && (
                            <>
                              <button 
                                onClick={() => handleRoleToggle(u._id)} 
                                className="inline-flex items-center justify-center gap-2 h-[32px] px-3 rounded-[6px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-[12px] font-[600] text-text-primary hover:bg-[rgba(124,58,237,0.2)] hover:text-accent-primary hover:border-[rgba(124,58,237,0.4)] transition-all whitespace-nowrap"
                              >
                                Toggle Role
                              </button>
                              <button 
                                onClick={() => handleUserDelete(u._id)} 
                                className="w-[32px] h-[32px] rounded-[6px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] inline-flex items-center justify-center text-text-primary hover:bg-[rgba(239,68,68,0.2)] hover:text-danger hover:border-[rgba(239,68,68,0.4)] transition-all"
                                title="Delete User"
                              >
                                <HiOutlineTrash className="w-4 h-4 flex-shrink-0" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {usersTotal > 1 && (
              <div className="px-6 pt-6 flex justify-between items-center">
                <button disabled={usersPage === 1} onClick={() => setUsersPage(p => p - 1)} className="inline-flex items-center justify-center gap-2 h-[36px] px-4 rounded-[8px] border border-[rgba(255,255,255,0.1)] text-[13px] font-[600] text-text-muted hover:text-white hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-30 transition-colors whitespace-nowrap">Prev</button>
                <span className="text-[13px] text-text-muted font-[500]">Page {usersPage} of {usersTotal}</span>
                <button disabled={usersPage === usersTotal} onClick={() => setUsersPage(p => p + 1)} className="inline-flex items-center justify-center gap-2 h-[36px] px-4 rounded-[8px] border border-[rgba(255,255,255,0.1)] text-[13px] font-[600] text-text-muted hover:text-white hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-30 transition-colors whitespace-nowrap">Next</button>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'registrations' && (
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[20px] backdrop-blur-card overflow-hidden animate-slide-up relative z-10 pb-4">
            <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-[rgba(255,255,255,0.06)]">
              <div>
                <h2 className="text-[20px] font-[800] text-text-primary">Registrations</h2>
                <p className="text-[13px] text-text-muted mt-1">View all ticket sales</p>
              </div>
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineSearch className="w-4 h-4 text-text-subtle" />
                </div>
                <input
                  type="text"
                  placeholder="Filter by Event ID..."
                  value={regEventFilter}
                  onChange={(e) => setRegEventFilter(e.target.value)}
                  className="w-full h-[40px] pl-10 pr-4 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-text-primary placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[rgba(255,255,255,0.01)]">
                    <th className="px-6 py-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">Registrant</th>
                    <th className="px-6 py-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">Event</th>
                    <th className="px-6 py-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">Amount</th>
                    <th className="px-6 py-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">Status</th>
                    <th className="px-6 py-4 text-[11px] font-[700] text-text-subtle uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)] text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                  {registrations.map((r) => (
                    <tr key={r._id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-[600] text-[14px] text-text-primary mb-0.5">{r.user?.name}</p>
                        <p className="text-[12px] text-text-muted">{r.user?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[14px] font-[500] text-text-primary line-clamp-1">{r.event?.title || r.event}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[14px] font-[600] text-white">₹{r.totalAmount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-[6px] text-[11px] font-[700] uppercase tracking-wider border ${r.status === 'confirmed' ? 'bg-[rgba(16,185,129,0.1)] text-success border-[rgba(16,185,129,0.2)]' : 'bg-[rgba(239,68,68,0.1)] text-danger border-[rgba(239,68,68,0.2)]'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-[13px] text-text-muted">
                        {new Date(r.registeredAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {regsTotal > 1 && (
              <div className="px-6 pt-6 flex justify-between items-center">
                <button disabled={regsPage === 1} onClick={() => setRegsPage(p => p - 1)} className="inline-flex items-center justify-center gap-2 h-[36px] px-4 rounded-[8px] border border-[rgba(255,255,255,0.1)] text-[13px] font-[600] text-text-muted hover:text-white hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-30 transition-colors whitespace-nowrap">Prev</button>
                <span className="text-[13px] text-text-muted font-[500]">Page {regsPage} of {regsTotal}</span>
                <button disabled={regsPage === regsTotal} onClick={() => setRegsPage(p => p + 1)} className="inline-flex items-center justify-center gap-2 h-[36px] px-4 rounded-[8px] border border-[rgba(255,255,255,0.1)] text-[13px] font-[600] text-text-muted hover:text-white hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-30 transition-colors whitespace-nowrap">Next</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Event Form Modal */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end animate-fade-in">
          <div className="bg-bg-base border-l border-[rgba(255,255,255,0.1)] w-full max-w-2xl h-full overflow-y-auto shadow-[-20px_0_50px_rgba(0,0,0,0.5)] p-6 animate-slide-left">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-[24px] font-[800] text-text-primary">{currentEvent ? 'Edit Festival' : 'Create New Festival'}</h2>
              <button onClick={() => setEventModalOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(255,255,255,0.05)] text-text-muted hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEventSubmit} className="space-y-8">
              {/* Form implementation uses dark inputs */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-[16px] font-[700] text-text-primary mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[rgba(124,58,237,0.2)] text-accent-primary flex items-center justify-center text-[12px]">1</span> Basic Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">Title</label>
                      <input required type="text" value={eventFormData.title} onChange={e => setEventFormData({...eventFormData, title: e.target.value})} className="w-full h-[44px] px-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[14px] text-text-primary focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">Category</label>
                      <select required value={eventFormData.category} onChange={e => setEventFormData({...eventFormData, category: e.target.value})} className="w-full h-[44px] px-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[14px] text-text-primary focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all [&>option]:bg-bg-base">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">Cultural Origin</label>
                      <input type="text" value={eventFormData.culturalOrigin} onChange={e => setEventFormData({...eventFormData, culturalOrigin: e.target.value})} className="w-full h-[44px] px-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[14px] text-text-primary focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">Date</label>
                      <input required type="date" value={eventFormData.date} onChange={e => setEventFormData({...eventFormData, date: e.target.value})} className="w-full h-[44px] px-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[14px] text-text-muted focus:text-text-primary focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">City</label>
                      <input required type="text" value={eventFormData.city} onChange={e => setEventFormData({...eventFormData, city: e.target.value})} className="w-full h-[44px] px-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[14px] text-text-primary focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[16px] font-[700] text-text-primary mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[rgba(124,58,237,0.2)] text-accent-primary flex items-center justify-center text-[12px]">2</span> Descriptions
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">Short Description</label>
                      <textarea maxLength="200" rows="2" value={eventFormData.shortDescription} onChange={e => setEventFormData({...eventFormData, shortDescription: e.target.value})} className="w-full p-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[14px] text-text-primary focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all resize-none"></textarea>
                    </div>
                    <div>
                      <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">Full Description</label>
                      <textarea required rows="4" value={eventFormData.description} onChange={e => setEventFormData({...eventFormData, description: e.target.value})} className="w-full p-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[14px] text-text-primary focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all resize-none"></textarea>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[16px] font-[700] text-text-primary mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[rgba(124,58,237,0.2)] text-accent-primary flex items-center justify-center text-[12px]">3</span> Pricing & Capacity
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[16px]">
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input type="checkbox" checked={eventFormData.isFree} onChange={e => setEventFormData({...eventFormData, isFree: e.target.checked, price: e.target.checked ? 0 : eventFormData.price})} className="peer sr-only" />
                          <div className="w-10 h-6 bg-[rgba(255,255,255,0.1)] rounded-full peer-checked:bg-accent-primary transition-colors"></div>
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                        </div>
                        <span className="text-[14px] font-[500] text-text-primary group-hover:text-white transition-colors">This is a free event</span>
                      </label>
                    </div>
                    {!eventFormData.isFree && (
                      <>
                        <div>
                          <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">Regular Price (₹)</label>
                          <input type="number" min="0" value={eventFormData.price} onChange={e => setEventFormData({...eventFormData, price: e.target.value})} className="w-full h-[44px] px-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[14px] text-text-primary focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all" />
                        </div>
                        <div>
                          <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">Total Capacity</label>
                          <input required type="number" min="1" value={eventFormData.capacity} onChange={e => setEventFormData({...eventFormData, capacity: e.target.value})} className="w-full h-[44px] px-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[14px] text-text-primary focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all" />
                        </div>
                      </>
                    )}
                    {eventFormData.isFree && (
                      <div className="md:col-span-2">
                        <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">Total Capacity</label>
                        <input required type="number" min="1" value={eventFormData.capacity} onChange={e => setEventFormData({...eventFormData, capacity: e.target.value})} className="w-full h-[44px] px-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[14px] text-text-primary focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-[16px] font-[700] text-text-primary mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[rgba(124,58,237,0.2)] text-accent-primary flex items-center justify-center text-[12px]">4</span> Media
                  </h3>
                  <div className="border-2 border-dashed border-[rgba(255,255,255,0.1)] hover:border-accent-primary transition-colors rounded-[16px] p-8 text-center bg-[rgba(255,255,255,0.01)] group">
                    <label className="cursor-pointer block">
                      <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center mx-auto mb-4 group-hover:bg-[rgba(124,58,237,0.2)] group-hover:text-accent-primary transition-colors">
                        <HiOutlinePlus className="w-6 h-6" />
                      </div>
                      <span className="block text-[15px] font-[600] text-text-primary mb-1">Click to upload images</span>
                      <span className="block text-[13px] text-text-muted mb-4">Max 8 images (JPG, PNG)</span>
                      <input type="file" multiple accept="image/*" onChange={e => setEventFormData({...eventFormData, images: e.target.files})} className="hidden" />
                      <div className="inline-block px-6 py-2 bg-[rgba(255,255,255,0.06)] text-white rounded-full text-[13px] font-[600] hover:bg-[rgba(255,255,255,0.1)] transition-colors">Browse Files</div>
                    </label>
                    {eventFormData.images?.length > 0 && (
                      <p className="mt-4 text-[13px] text-accent-cyan font-[600] bg-[rgba(6,182,212,0.1)] py-1.5 px-3 rounded-full inline-block">{eventFormData.images.length} files selected</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-[rgba(255,255,255,0.06)] sticky bottom-0 bg-bg-base py-4 px-2 -mx-2">
                <button type="button" onClick={() => setEventModalOpen(false)} className="h-[48px] px-6 border border-[rgba(255,255,255,0.12)] text-text-primary rounded-[12px] font-[600] hover:bg-[rgba(255,255,255,0.06)] transition-all active:scale-[0.98]">
                  Cancel
                </button>
                <button type="submit" disabled={eventSaving} className="h-[48px] px-8 bg-accent-gradient text-white rounded-[12px] font-[600] text-[15px] hover:shadow-glow-primary transition-all active:scale-[0.98] disabled:opacity-60 flex items-center gap-2">
                  {eventSaving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {currentEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
