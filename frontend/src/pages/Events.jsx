import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { SkeletonCard } from '../components/Loader';
import { getAllEvents } from '../services/eventService';
import { HiOutlineSearch, HiChevronDown, HiOutlineX } from 'react-icons/hi';
import { HiOutlineAdjustmentsHorizontal, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

const CATEGORIES = [
  'Classical Music', 'Folk Dance', 'Classical Dance',
  'Art Exhibition', 'Food Festival', 'Theater & Drama',
  'Craft Fair', 'Cultural Parade', 'Literary Festival',
  'Film Festival', 'Spiritual & Religious', 'Other',
];

const FilterGroup = ({ title, isOpen, toggleOpen, children }) => (
  <div style={{ borderBottom: '1px solid var(--border-lighter)', paddingBottom: '16px', marginBottom: '0' }}>
    <button
      onClick={toggleOpen}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '14px 0', fontFamily: "'Poppins', sans-serif",
      }}
    >
      <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-dark)' }}>{title}</span>
      <HiChevronDown style={{
        width: '16px', height: '16px', color: 'var(--text-light)',
        transition: 'transform 0.3s ease',
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      }} />
    </button>
    <div style={{
      overflow: 'hidden', maxHeight: isOpen ? '500px' : '0',
      opacity: isOpen ? 1 : 0,
      transition: 'all 0.3s ease',
    }}>
      {children}
    </div>
  </div>
);

const RadioOption = ({ label, checked, onChange }) => (
  <label style={{
    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
    marginBottom: '10px', fontFamily: "'Poppins', sans-serif",
  }}>
    <div style={{
      width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
      border: checked ? '5px solid var(--primary-terra)' : '2px solid var(--border-light)',
      background: 'var(--bg-lighter)', transition: 'all 0.2s ease',
    }} onClick={onChange} />
    <span style={{ fontSize: '13px', color: checked ? 'var(--text-dark)' : 'var(--text-light)', fontWeight: checked ? '600' : '400', transition: 'color 0.2s' }}
      onClick={onChange}
    >
      {label}
    </span>
  </label>
);

const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [priceFilter, setPriceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const [openGroups, setOpenGroups] = useState({ category: true, price: true, status: true, sort: true });
  const toggleGroup = (group) => setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchEvents = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 9, sortBy };
      if (debouncedSearch) params.search = debouncedSearch;
      if (category) params.category = category;
      if (city) params.city = city;
      if (priceFilter === 'free') params.isFree = 'true';
      if (statusFilter) params.status = statusFilter;
      const res = await getAllEvents(params);
      const data = res.data.data;
      setEvents(data.events || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
      setTotalEvents(data.totalEvents || 0);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, city, priceFilter, statusFilter, sortBy]);

  useEffect(() => { fetchEvents(1); }, [fetchEvents]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchEvents(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearch(''); setCategory(''); setCity('');
    setPriceFilter('all'); setStatusFilter(''); setSortBy('date');
    setSearchParams({});
  };

  const hasActiveFilters = category || city || priceFilter !== 'all' || statusFilter || search;

  const sidebarContent = (
    <div>
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            width: '100%', height: '38px', justifyContent: 'center',
            background: 'rgba(212,82,42,0.06)', border: '1.5px solid rgba(212,82,42,0.2)',
            borderRadius: '8px', color: 'var(--primary-terra)',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            fontFamily: "'Poppins', sans-serif", marginBottom: '16px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,82,42,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,82,42,0.06)'; }}
        >
          <HiOutlineX style={{ width: '14px', height: '14px' }} /> Clear All Filters
        </button>
      )}

      <FilterGroup title="Categories" isOpen={openGroups.category} toggleOpen={() => toggleGroup('category')}>
        <RadioOption label="All Categories" checked={category === ''} onChange={() => setCategory('')} />
        {CATEGORIES.map(cat => (
          <RadioOption key={cat} label={cat} checked={category === cat} onChange={() => setCategory(cat)} />
        ))}
      </FilterGroup>

      <FilterGroup title="Price" isOpen={openGroups.price} toggleOpen={() => toggleGroup('price')}>
        {[{ value: 'all', label: 'All Prices' }, { value: 'free', label: 'Free Only' }, { value: 'paid', label: 'Paid Only' }].map(opt => (
          <RadioOption key={opt.value} label={opt.label} checked={priceFilter === opt.value} onChange={() => setPriceFilter(opt.value)} />
        ))}
      </FilterGroup>

      <FilterGroup title="Status" isOpen={openGroups.status} toggleOpen={() => toggleGroup('status')}>
        {[{ value: '', label: 'All Statuses' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'ongoing', label: 'Ongoing' }, { value: 'completed', label: 'Completed' }].map(opt => (
          <RadioOption key={opt.value} label={opt.label} checked={statusFilter === opt.value} onChange={() => setStatusFilter(opt.value)} />
        ))}
      </FilterGroup>

      <FilterGroup title="Sort By" isOpen={openGroups.sort} toggleOpen={() => toggleGroup('sort')}>
        {[{ value: 'date', label: 'Date (Earliest)' }, { value: 'price', label: 'Price (Low to High)' }, { value: 'popularity', label: 'Most Popular' }].map(opt => (
          <RadioOption key={opt.value} label={opt.label} checked={sortBy === opt.value} onChange={() => setSortBy(opt.value)} />
        ))}
      </FilterGroup>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)', paddingTop: '70px' }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-lighter)',
        borderBottom: '1px solid var(--border-light)',
        padding: '60px 24px 52px',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-80px', right: '8%',
          width: '320px', height: '320px',
          background: 'radial-gradient(circle, rgba(212,82,42,0.07) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <span style={{
          display: 'inline-block', fontSize: '11px', fontWeight: '700',
          color: 'var(--primary-terra)', letterSpacing: '0.12em',
          textTransform: 'uppercase', marginBottom: '14px',
          fontFamily: "'Poppins', sans-serif",
        }}>
          Discover & Celebrate
        </span>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: '800',
          color: 'var(--text-dark)', marginBottom: '14px', lineHeight: 1.15,
        }}>
          Explore <em style={{ color: 'var(--primary-terra)', fontStyle: 'italic' }}>Cultural Festivals</em>
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-light)', maxWidth: '560px', margin: '0 auto', lineHeight: '1.7', fontFamily: "'Poppins', sans-serif" }}>
          Discover extraordinary events across music, dance, art, food, theater and more
        </p>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px' }}>
        {/* Search bar */}
        <div style={{ maxWidth: '600px', margin: '0 auto 32px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            {search !== debouncedSearch ? (
              <div style={{ width: '18px', height: '18px', border: '2px solid rgba(212,82,42,0.2)', borderTop: '2px solid var(--primary-terra)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <HiOutlineSearch style={{ width: '18px', height: '18px', color: 'var(--text-light)' }} />
            )}
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search festivals by name, city, or artist..."
            style={{
              width: '100%', height: '52px', padding: '0 16px 0 48px',
              background: 'var(--bg-lighter)', border: '1.5px solid var(--border-light)',
              borderRadius: '12px', fontSize: '14px', color: 'var(--text-dark)', outline: 'none',
              transition: 'all 0.2s ease', boxSizing: 'border-box',
              fontFamily: "'Poppins', sans-serif',",
              boxShadow: '0 2px 8px rgba(26,21,16,0.04)',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--primary-terra)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,82,42,0.08)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = '0 2px 8px rgba(26,21,16,0.04)'; }}
          />
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setFiltersDrawerOpen(true)}
          style={{
            display: 'none', // hidden on lg, shown on mobile via class
            width: '100%', height: '48px',
            background: 'var(--bg-lighter)', border: '1.5px solid var(--border-light)',
            borderRadius: '10px', fontSize: '14px', fontWeight: '600',
            color: 'var(--text-dark)', cursor: 'pointer',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
            fontFamily: "'Poppins', sans-serif", marginBottom: '20px',
          }}
          className="mobile-filter-btn"
        >
          <HiOutlineAdjustmentsHorizontal style={{ width: '18px', height: '18px' }} />
          Filters & Sort
          {hasActiveFilters && (
            <span style={{
              padding: '2px 8px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary-terra), var(--primary-light))',
              color: 'white', fontSize: '11px', fontWeight: '700',
            }}>Active</span>
          )}
        </button>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
          {/* Sidebar */}
          <aside style={{
            width: '240px', flexShrink: 0,
            background: 'var(--bg-lighter)', border: '1.5px solid var(--border-light)',
            borderRadius: '14px', padding: '20px',
            boxShadow: '0 2px 8px rgba(26,21,16,0.04)',
          }} className="filter-sidebar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--border-light)' }}>
              <HiOutlineAdjustmentsHorizontal style={{ width: '18px', height: '18px', color: 'var(--primary-terra)' }} />
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: "'Poppins', sans-serif" }}>Filters</h3>
            </div>
            {sidebarContent}
          </aside>

          {/* Main grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>
                Showing <strong style={{ color: 'var(--text-dark)' }}>{totalEvents}</strong> festivals
              </p>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : events.length === 0 ? (
              <div style={{
                background: 'var(--bg-lighter)', border: '1.5px solid var(--border-light)',
                borderRadius: '14px', padding: '60px 24px', textAlign: 'center',
              }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <HiOutlineSearch style={{ width: '28px', height: '28px', color: 'var(--text-light)' }} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-dark)', fontFamily: "'Playfair Display', serif", marginBottom: '10px' }}>No festivals found</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif", marginBottom: '20px' }}>
                  We couldn't find any events matching your current filters.
                </p>
                <button onClick={clearFilters} style={{
                  padding: '10px 24px', borderRadius: '8px',
                  background: 'var(--bg-light)', border: '1.5px solid var(--border-light)',
                  color: 'var(--text-dark)', fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                  transition: 'all 0.2s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-terra)'; e.currentTarget.style.color = 'var(--primary-terra)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-dark)'; }}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                  {events.map(event => <EventCard key={event._id} event={event} />)}
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '48px' }}>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        width: '38px', height: '38px', borderRadius: '8px',
                        background: 'var(--bg-lighter)', border: '1.5px solid var(--border-light)',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === 1 ? 0.4 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-dark)', transition: 'all 0.2s ease',
                      }}
                    >
                      <HiOutlineChevronLeft style={{ width: '16px', height: '16px' }} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                      .map((page, idx, arr) => (
                        <span key={page} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span style={{ color: 'var(--text-light)', fontSize: '14px', padding: '0 4px' }}>...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            style={{
                              width: '38px', height: '38px', borderRadius: '8px',
                              fontSize: '13px', fontWeight: '600',
                              cursor: 'pointer', transition: 'all 0.2s ease',
                              fontFamily: "'Poppins', sans-serif",
                              background: page === currentPage ? 'linear-gradient(135deg, var(--primary-terra), var(--primary-light))' : 'var(--bg-lighter)',
                              color: page === currentPage ? 'white' : 'var(--text-gray)',
                              border: page === currentPage ? 'none' : '1.5px solid var(--border-light)',
                              boxShadow: page === currentPage ? '0 4px 12px rgba(212,82,42,0.2)' : 'none',
                            }}
                          >
                            {page}
                          </button>
                        </span>
                      ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{
                        width: '38px', height: '38px', borderRadius: '8px',
                        background: 'var(--bg-lighter)', border: '1.5px solid var(--border-light)',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        opacity: currentPage === totalPages ? 0.4 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-dark)', transition: 'all 0.2s ease',
                      }}
                    >
                      <HiOutlineChevronRight style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersDrawerOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(26,21,16,0.5)', backdropFilter: 'blur(4px)',
        }} onClick={() => setFiltersDrawerOpen(false)}>
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: '300px', background: 'var(--bg-lighter)',
            borderLeft: '1px solid var(--border-light)',
            padding: '24px', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: "'Playfair Display', serif" }}>Filters</h3>
              <button onClick={() => setFiltersDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '4px' }}>
                <HiOutlineX style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            {sidebarContent}
            <button onClick={() => setFiltersDrawerOpen(false)} style={{
              width: '100%', height: '48px', marginTop: '20px',
              background: 'linear-gradient(135deg, var(--primary-terra), var(--primary-light))',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif",
              boxShadow: '0 4px 16px rgba(212,82,42,0.2)',
            }}>
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          .filter-sidebar { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default Events;