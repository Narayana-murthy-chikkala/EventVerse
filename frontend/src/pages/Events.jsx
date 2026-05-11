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
  <div className="border-b border-[rgba(255,255,255,0.06)] py-4">
    <button 
      onClick={toggleOpen}
      className="flex items-center justify-between w-full text-left group"
    >
      <span className="font-[600] text-[14px] text-text-primary">{title}</span>
      <HiChevronDown 
        className={`w-5 h-5 text-text-muted group-hover:text-white transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`}
      />
    </button>
    <div className={`overflow-hidden transition-all duration-300 ease-[var(--ease-default)] ${isOpen ? 'max-h-[400px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
      {children}
    </div>
  </div>
);

const CheckboxOption = ({ label, checked, onChange, type = "checkbox" }) => (
  <label className="flex items-center gap-3 cursor-pointer group custom-checkbox-wrapper mb-3 last:mb-0">
    <input
      type={type}
      checked={checked}
      onChange={onChange}
    />
    <span className="checkmark flex-shrink-0 group-hover:border-[rgba(255,255,255,0.3)]">
      <svg viewBox="0 0 14 14">
        <path d="M3 7.5L6 10.5L11 3.5" />
      </svg>
    </span>
    <span className="text-[14px] text-text-muted group-hover:text-white transition-colors">
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

  // Filter States
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [priceFilter, setPriceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');

  // Accordion states
  const [openGroups, setOpenGroups] = useState({
    category: true,
    price: true,
    status: true,
    sort: true
  });

  const toggleGroup = (group) => setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
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

  useEffect(() => {
    fetchEvents(1);
  }, [fetchEvents]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchEvents(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setCity('');
    setPriceFilter('all');
    setStatusFilter('');
    setSortBy('date');
    setSearchParams({});
  };

  const hasActiveFilters = category || city || priceFilter !== 'all' || statusFilter || search;

  return (
    <div className="min-h-screen bg-bg-base pt-20 animate-fade-in">
      {/* Header */}
      <div className="w-full bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.06)] py-12 relative overflow-hidden">
        <div className="absolute top-[-100px] right-[10%] w-[400px] h-[400px] bg-[rgba(124,58,237,0.2)] rounded-full filter blur-[100px] opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 flex flex-col items-center text-center mb-10">
          <h1 className="text-[clamp(32px,5vw,48px)] font-[800] tracking-[-0.02em] text-text-primary mb-3">
            Explore <span className="bg-accent-gradient bg-clip-text text-transparent">Cultural Festivals</span>
          </h1>
          <p className="text-text-muted text-[16px] md:text-[18px] max-w-2xl mx-auto text-center">
            Discover extraordinary events across music, dance, art, food, theater and more
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Search Bar Mobile/Desktop */}
        <div className="mb-8 relative w-full max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center justify-center pointer-events-none">
            {search !== debouncedSearch ? (
              <div className="w-5 h-5 border-2 border-[rgba(255,255,255,0.1)] border-t-accent-primary rounded-full animate-spin" />
            ) : (
              <HiOutlineSearch className="w-5 h-5 text-text-subtle" />
            )}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search festivals by name, city, or artist..."
            className="w-full h-[52px] pl-12 pr-4 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[12px] text-text-primary text-[15px] placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] transition-all duration-200"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setFiltersDrawerOpen(true)}
            className="lg:hidden inline-flex items-center justify-center gap-2 w-full h-[48px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[12px] text-[15px] font-[600] text-text-primary hover:bg-[rgba(255,255,255,0.06)] transition-colors active:scale-[0.98] whitespace-nowrap"
          >
            <HiOutlineAdjustmentsHorizontal className="w-5 h-5 flex-shrink-0" />
            Filters {hasActiveFilters && <span className="inline-flex w-2 h-2 rounded-full bg-accent-primary ml-1" />}
          </button>

          {/* Sidebar Filters */}
          <aside className={`fixed inset-0 z-50 lg:static lg:block lg:w-[260px] lg:shrink-0 transition-transform duration-300 ${filtersDrawerOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}`}>
            {/* Mobile Overlay */}
            <div 
              className={`absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity ${filtersDrawerOpen ? 'opacity-100' : 'opacity-0'}`} 
              onClick={() => setFiltersDrawerOpen(false)}
            />
            
            <div className={`absolute bottom-0 left-0 right-0 top-20 bg-bg-base border-t border-[rgba(255,255,255,0.08)] lg:border lg:bg-[rgba(255,255,255,0.02)] lg:backdrop-blur-card rounded-t-[24px] lg:rounded-[16px] lg:static lg:top-[100px] lg:sticky p-6 lg:p-5 overflow-y-auto lg:overflow-visible transition-transform duration-300 lg:translate-y-0 ${filtersDrawerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
              
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-[700] text-[18px] text-text-primary flex items-center gap-2">
                  <HiOutlineAdjustmentsHorizontal /> Filters
                </h3>
                <div className="flex items-center gap-3">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-[12px] font-[600] text-danger hover:text-red-400 uppercase tracking-wider bg-[rgba(239,68,68,0.1)] px-2.5 py-1 rounded-full transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <button onClick={() => setFiltersDrawerOpen(false)} className="lg:hidden p-1 text-text-muted">
                    <HiOutlineX className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {/* City (Text Input) */}
                <div className="border-b border-[rgba(255,255,255,0.06)] pb-5">
                  <label className="block font-[600] text-[14px] text-text-primary mb-3">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full h-[40px] px-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[8px] text-text-primary text-[14px] focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all"
                  />
                </div>

                {/* Category Group */}
                <FilterGroup title="Categories" isOpen={openGroups.category} toggleOpen={() => toggleGroup('category')}>
                  <CheckboxOption 
                    label="All Categories" 
                    type="radio"
                    checked={category === ''} 
                    onChange={() => setCategory('')} 
                  />
                  {CATEGORIES.map(cat => (
                    <CheckboxOption 
                      key={cat} 
                      label={cat} 
                      type="radio"
                      checked={category === cat} 
                      onChange={() => setCategory(cat)} 
                    />
                  ))}
                </FilterGroup>

                {/* Price Group */}
                <FilterGroup title="Price" isOpen={openGroups.price} toggleOpen={() => toggleGroup('price')}>
                  {[
                    { value: 'all', label: 'All Prices' },
                    { value: 'free', label: 'Free Only' },
                    { value: 'paid', label: 'Paid Only' },
                  ].map(opt => (
                    <CheckboxOption 
                      key={opt.value} 
                      label={opt.label} 
                      type="radio"
                      checked={priceFilter === opt.value} 
                      onChange={() => setPriceFilter(opt.value)} 
                    />
                  ))}
                </FilterGroup>

                {/* Status Group */}
                <FilterGroup title="Status" isOpen={openGroups.status} toggleOpen={() => toggleGroup('status')}>
                  {[
                    { value: '', label: 'All Statuses' },
                    { value: 'upcoming', label: 'Upcoming' },
                    { value: 'ongoing', label: 'Ongoing' },
                    { value: 'completed', label: 'Completed' },
                  ].map(opt => (
                    <CheckboxOption 
                      key={opt.value} 
                      label={opt.label} 
                      type="radio"
                      checked={statusFilter === opt.value} 
                      onChange={() => setStatusFilter(opt.value)} 
                    />
                  ))}
                </FilterGroup>

                {/* Sort By */}
                <FilterGroup title="Sort By" isOpen={openGroups.sort} toggleOpen={() => toggleGroup('sort')}>
                  {[
                    { value: 'date', label: 'Date (Earliest)' },
                    { value: 'price', label: 'Price (Low to High)' },
                    { value: 'popularity', label: 'Most Popular' },
                  ].map(opt => (
                    <CheckboxOption 
                      key={opt.value} 
                      label={opt.label} 
                      type="radio"
                      checked={sortBy === opt.value} 
                      onChange={() => setSortBy(opt.value)} 
                    />
                  ))}
                </FilterGroup>
              </div>

              {/* Mobile Apply Button */}
              <div className="lg:hidden mt-6 pb-6">
                <button 
                  onClick={() => setFiltersDrawerOpen(false)}
                  className="inline-flex items-center justify-center gap-2 w-full h-[48px] bg-accent-gradient text-white font-[600] rounded-[12px] hover:shadow-glow-primary active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  Apply Filters
                </button>
              </div>

            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[14px] text-text-muted">
                Showing <span className="font-[700] text-text-primary">{totalEvents}</span> festivals
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-24 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[16px] backdrop-blur-card gap-4">
                <div className="inline-flex items-center justify-center w-[80px] h-[80px] bg-[rgba(255,255,255,0.04)] rounded-full mx-auto mb-2">
                  <HiOutlineSearch className="w-8 h-8 text-text-muted" />
                </div>
                <h3 className="text-[20px] font-[700] text-text-primary mb-0">
                  No festivals found
                </h3>
                <p className="text-[15px] text-text-muted mb-2 max-w-xs text-center mx-auto">
                  We couldn't find any events matching your current filters or search terms.
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[rgba(255,255,255,0.08)] text-white rounded-full font-[600] hover:bg-[rgba(255,255,255,0.12)] transition-colors text-[14px] whitespace-nowrap"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-[10px] border border-[rgba(255,255,255,0.1)] text-text-muted hover:text-white hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <HiOutlineChevronLeft className="w-5 h-5 flex-shrink-0" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                      .map((page, idx, arr) => (
                        <span key={page} className="flex items-center gap-1">
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="text-text-subtle text-sm px-1">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-[10px] text-[14px] font-[600] transition-all duration-300 ${
                              page === currentPage
                                ? 'bg-accent-gradient text-white shadow-glow-primary border-none'
                                : 'border border-[rgba(255,255,255,0.1)] text-text-muted hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
                            }`}
                          >
                            {page}
                          </button>
                        </span>
                      ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-[10px] border border-[rgba(255,255,255,0.1)] text-text-muted hover:text-white hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <HiOutlineChevronRight className="w-5 h-5 flex-shrink-0" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
