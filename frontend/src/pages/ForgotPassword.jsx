import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import EventCard from '../components/EventCard';
import { getFeaturedEvents, getEventsByCategory, getUpcomingEvents } from '../services/eventService';
import { HiOutlineSearch, HiOutlineTicket, HiOutlineStar, HiOutlineArrowRight } from 'react-icons/hi';

const categoryEmojis = {
  'Classical Music': '🎵',
  'Folk Dance': '💃',
  'Classical Dance': '🩰',
  'Art Exhibition': '🎨',
  'Food Festival': '🍛',
  'Theater & Drama': '🎭',
  'Craft Fair': '🏺',
  'Cultural Parade': '🎪',
  'Literary Festival': '📚',
  'Film Festival': '🎬',
  'Spiritual & Religious': '🕉️',
  Other: '🎉',
};

// Counter Hook for Stats Bar
const useCounter = (end, duration = 2000) => {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let startTimestamp = null;
          const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (nodeRef.current) {
      observer.observe(nodeRef.current);
    }

    return () => observer.disconnect();
  }, [end, duration]);

  return [count, nodeRef];
};

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [email, setEmail] = useState('');

  const [usersCount, usersRef] = useCounter(24500);
  const [eventsCount, eventsRef] = useCounter(1200);
  const [citiesCount, citiesRef] = useCounter(45);
  const [ticketsCount, ticketsRef] = useCounter(89000);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featRes, catRes, upRes] = await Promise.all([
          getFeaturedEvents(),
          getEventsByCategory(),
          getUpcomingEvents(),
        ]);
        setFeatured(featRes.data.data.events || []);
        setCategories(catRes.data.data.categories || []);
        setUpcoming(upRes.data.data.events || []);
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      }
    };
    fetchData();
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success('Thank you for subscribing! 🪔');
    setEmail('');
  };

  return (
    <div className="bg-bg-base animate-fade-in relative overflow-hidden">

      {/* HERO SECTION */}
      <section className="relative w-full min-h-screen flex items-center justify-center pt-20">
        <div className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] bg-[rgba(124,58,237,0.4)] rounded-full filter blur-[80px] opacity-35 pointer-events-none" />
        <div className="absolute bottom-[0] right-[-150px] w-[500px] h-[500px] bg-[rgba(6,182,212,0.25)] rounded-full filter blur-[80px] opacity-35 pointer-events-none" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center">
          <div className="mb-6 px-4 py-1.5 rounded-full border border-transparent bg-[linear-gradient(var(--bg-base),var(--bg-base))_padding-box,var(--accent-gradient)_border-box] animate-slide-up">
            <span className="inline-flex items-center justify-center gap-2 text-[12px] font-[600] tracking-wider text-text-primary uppercase">
              <span className="text-accent-cyan">✦</span> Discover Amazing Events
            </span>
          </div>

          <h1 className="font-sans text-[clamp(48px,7vw,80px)] font-[800] tracking-[-0.04em] leading-[1.1] text-text-primary mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <span className="bg-accent-gradient bg-clip-text text-transparent">Experience</span> The Richness<br className="hidden md:block" /> Of Indian Culture
          </h1>

          <p className="text-[20px] text-text-muted mb-10 max-w-[560px] mx-auto animate-slide-up" style={{ animationDelay: '200ms' }}>
            From classical ragas to vibrant folk dances, explore India's living heritage and book your tickets to exclusive cultural festivals today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Link
              to="/events"
              className="inline-flex items-center justify-center gap-2 h-[52px] px-[32px] bg-accent-gradient text-white font-[600] text-[16px] rounded-full hover:shadow-glow-primary transition-all duration-300 hover:-translate-y-[2px] active:scale-[0.98] whitespace-nowrap"
            >
              Explore Festivals
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 h-[52px] px-[32px] border border-[rgba(255,255,255,0.12)] text-text-primary font-[600] text-[16px] rounded-full hover:bg-[rgba(255,255,255,0.04)] transition-all duration-300 hover:-translate-y-[2px] active:scale-[0.98] whitespace-nowrap"
            >
              How It Works
            </a>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* STATS BAR SECTION */}
      <section className="w-full py-12 bg-[rgba(255,255,255,0.03)] border-y border-[rgba(255,255,255,0.06)] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[rgba(255,255,255,0.06)]">
            <div className="flex flex-col items-center justify-center text-center px-4" ref={usersRef}>
              <div className="text-[48px] font-[800] bg-accent-gradient bg-clip-text text-transparent leading-none mb-2 text-center">{usersCount.toLocaleString()}+</div>
              <div className="text-[14px] text-text-muted uppercase tracking-[0.05em] font-[600] text-center">Active Users</div>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4" ref={eventsRef}>
              <div className="text-[48px] font-[800] bg-accent-gradient bg-clip-text text-transparent leading-none mb-2 text-center">{eventsCount.toLocaleString()}+</div>
              <div className="text-[14px] text-text-muted uppercase tracking-[0.05em] font-[600] text-center">Events Hosted</div>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4" ref={citiesRef}>
              <div className="text-[48px] font-[800] bg-accent-gradient bg-clip-text text-transparent leading-none mb-2 text-center">{citiesCount}+</div>
              <div className="text-[14px] text-text-muted uppercase tracking-[0.05em] font-[600] text-center">Cities Reached</div>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4" ref={ticketsRef}>
              <div className="text-[48px] font-[800] bg-accent-gradient bg-clip-text text-transparent leading-none mb-2 text-center">{ticketsCount.toLocaleString()}</div>
              <div className="text-[14px] text-text-muted uppercase tracking-[0.05em] font-[600] text-center">Tickets Sold</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED FESTIVALS */}
      {featured.length > 0 && (
        <section className="w-full py-[120px] relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center mb-12">
              <span className="text-[12px] font-[700] uppercase tracking-[0.05em] bg-accent-gradient bg-clip-text text-transparent mb-2 block text-center">
                Curated For You
              </span>
              <h2 className="text-[clamp(32px,4vw,48px)] font-[800] text-text-primary leading-tight text-center">
                Featured Festivals
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.slice(0, 6).map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>

            <div className="flex items-center justify-center mt-10">
              <Link
                to="/events"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-text-primary hover:text-accent-secondary transition-colors"
              >
                View All Events →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="w-full py-[120px] bg-[rgba(255,255,255,0.02)] border-y border-[rgba(255,255,255,0.06)] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-16">
            <span className="text-[12px] font-[700] uppercase tracking-[0.05em] bg-accent-gradient bg-clip-text text-transparent mb-2 block">
              Simple Process
            </span>
            <h2 className="text-[clamp(32px,4vw,48px)] font-[800] text-text-primary leading-tight">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-[80px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-[rgba(255,255,255,0.05)] via-[rgba(255,255,255,0.1)] to-[rgba(255,255,255,0.05)] border-t border-dashed border-[rgba(255,255,255,0.2)] z-0" />

            {[
              {
                num: '01',
                icon: <HiOutlineSearch />,
                title: 'Discover Events',
                desc: 'Browse through 12 categories of cultural events — from classical music to food festivals, all happening near you.',
              },
              {
                num: '02',
                icon: <HiOutlineTicket />,
                title: 'Book Securely',
                desc: 'Book your spot with our seamless registration. Pay securely and receive an instant QR-coded ticket.',
              },
              {
                num: '03',
                icon: <HiOutlineStar />,
                title: 'Attend & Enjoy',
                desc: 'Show your QR code at the venue and immerse yourself in the magic of Indian cultural traditions.',
              },
            ].map((step, idx) => (
              <div
                key={step.num}
                className="flex flex-col items-center text-center bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-8 backdrop-blur-card hover:-translate-y-[4px] hover:border-[rgba(124,58,237,0.4)] transition-all duration-300 group relative z-10"
              >
                <div className="absolute top-4 right-4 text-[72px] font-[900] bg-accent-gradient bg-clip-text text-transparent opacity-15 leading-none">
                  {step.num}
                </div>
                <div className="inline-flex items-center justify-center w-[48px] h-[48px] rounded-xl bg-[rgba(255,255,255,0.06)] text-accent-cyan text-[24px] mb-6 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="font-[700] text-[20px] text-text-primary mb-3">
                  {step.title}
                </h3>
                <p className="text-text-muted text-[15px] leading-relaxed max-w-xs">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="w-full py-[120px] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-[rgba(124,58,237,0.12)] border border-[rgba(124,58,237,0.3)] rounded-[20px] p-10 md:p-16 text-center overflow-hidden flex flex-col items-center gap-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_rgba(124,58,237,0.3),_transparent)] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center w-full">
              <h2 className="text-[clamp(32px,4vw,48px)] font-[800] text-text-primary leading-tight mb-4 text-center">
                Ready to Experience <br /> Something Extraordinary?
              </h2>
              <p className="text-[18px] text-[rgba(248,250,252,0.85)] max-w-2xl mx-auto mb-8 text-center">
                Join our community of culture enthusiasts and never miss out on the most vibrant festivals happening around you.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 h-[52px] px-[40px] bg-white text-bg-base font-[700] text-[16px] rounded-full hover:bg-[rgba(255,255,255,0.9)] animate-pulse-glow transition-all active:scale-[0.98] whitespace-nowrap"
              >
                Sign Up Free <HiOutlineArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
