import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FullscreenLoader } from '../components/Loader';
import { getRegistrationById, verifyPayment } from '../services/eventService';
import {
  HiOutlineCalendar, HiOutlineClock, HiOutlineLocationMarker,
  HiOutlineShieldCheck, HiOutlineLockClosed, HiOutlineTicket,
  HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineRefresh,
  HiArrowLeft
} from 'react-icons/hi';

const PaymentPage = () => {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Data from navigation state (passed from EventDetails)
  const navState = location.state || {};

  const [registration, setRegistration] = useState(null);
  const [event, setEvent] = useState(navState.event || null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle | processing | success | failed
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [orderId] = useState(navState.orderId || '');
  const [amount] = useState(navState.amount || 0);
  const [currency] = useState(navState.currency || 'INR');
  const [selectedMethod, setSelectedMethod] = useState('upi');

  // Fetch registration details
  useEffect(() => {
    const fetchRegistration = async () => {
      try {
        const res = await getRegistrationById(registrationId);
        const reg = res.data.data.registration;
        setRegistration(reg);
        if (reg.event) setEvent(reg.event);
        if (reg.paymentStatus === 'paid') {
          setPaymentStatus('success');
        }
      } catch (err) {
        toast.error('Failed to load payment details');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    fetchRegistration();
  }, [registrationId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (paymentStatus !== 'idle') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Payment session expired');
          navigate('/events');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentStatus, navigate]);

  const formatTimer = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });

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

  const handlePay = useCallback(async () => {
    if (paymentStatus === 'processing') return;
    setPaymentStatus('processing');

    try {
      const orderIdToUse = orderId || registration?.orderId;
      const amountToUse = amount || registration?.totalAmount || 0;

      // Handle Mock Flow (when Razorpay keys aren't configured in backend)
      if (orderIdToUse?.startsWith('mock_order_')) {
        setTimeout(async () => {
          try {
            await verifyPayment({
              razorpayOrderId: orderIdToUse,
              razorpayPaymentId: 'mock_payment_id',
              razorpaySignature: 'mock_signature',
              registrationId: registrationId,
            });
            setPaymentStatus('success');
            toast.success('Mock Payment successful! 🎉');
            setTimeout(() => {
              navigate('/dashboard?ticket=' + registrationId);
            }, 3000);
          } catch (err) {
            setPaymentStatus('failed');
            toast.error('Mock payment verification failed');
          }
        }, 1500); // Simulate network delay
        return;
      }

      // Real Razorpay Flow
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Payment gateway failed to load');
        setPaymentStatus('failed');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amountToUse * 100,
        currency: currency,
        name: 'EventVerse',
        description: event?.title || 'Event Registration',
        order_id: orderIdToUse,
        handler: async (response) => {
          setPaymentStatus('processing');
          try {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              registrationId: registrationId,
            });
            setPaymentStatus('success');
            toast.success('Payment successful! 🎉');
            // Auto redirect to dashboard after 3 seconds
            setTimeout(() => {
              navigate('/dashboard?ticket=' + registrationId);
            }, 3000);
          } catch (err) {
            setPaymentStatus('failed');
            toast.error('Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus('idle');
            toast('Payment cancelled', { icon: '⚠️' });
          },
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#D4522A' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setPaymentStatus('failed');
        toast.error('Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err) {
      setPaymentStatus('failed');
      toast.error('Something went wrong');
    }
  }, [paymentStatus, orderId, amount, currency, event, user, registrationId, registration, navigate]);

  if (loading) return <FullscreenLoader />;

  const displayAmount = amount || registration?.totalAmount || 0;
  const timerPercent = (timeLeft / 600) * 100;
  const isUrgent = timeLeft < 120;

  // ─── STYLES ──────────────────────────────
  const pageStyle = {
    minHeight: '100vh', background: 'var(--bg-light)',
    paddingTop: '100px', paddingBottom: '80px',
  };
  const containerStyle = {
    maxWidth: '960px', margin: '0 auto', padding: '0 24px',
    display: 'grid', gridTemplateColumns: '1fr',
    gap: '28px',
  };
  const cardStyle = {
    background: 'var(--bg-lighter)', border: '1.5px solid var(--border-light)',
    borderRadius: '16px', padding: '28px', boxShadow: 'var(--shadow-sm)',
  };
  const labelStyle = {
    fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: '0.1em', color: 'var(--text-light)',
    fontFamily: "'Poppins', sans-serif", marginBottom: '4px',
  };
  const valueStyle = {
    fontSize: '15px', fontWeight: '600', color: 'var(--text-dark)',
    fontFamily: "'Poppins', sans-serif",
  };
  const iconBoxStyle = {
    width: '40px', height: '40px', borderRadius: '10px',
    background: 'rgba(212,82,42,0.08)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };

  // ─── SUCCESS STATE ──────────────────────
  if (paymentStatus === 'success') {
    return (
      <div style={pageStyle}>
        <div style={{ ...containerStyle, maxWidth: '520px', textAlign: 'center' }}>
          <div style={{ ...cardStyle, padding: '48px 32px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(107,141,94,0.12)', margin: '0 auto 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'scaleIn 0.5s ease',
            }}>
              <HiOutlineCheckCircle style={{ width: '44px', height: '44px', color: 'var(--sage)' }} />
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif", fontSize: '28px',
              fontWeight: '800', color: 'var(--text-dark)', marginBottom: '8px',
            }}>Payment Successful!</h2>
            <p style={{
              fontSize: '15px', color: 'var(--text-light)',
              fontFamily: "'Poppins', sans-serif", marginBottom: '8px',
            }}>
              Your ticket for <strong style={{ color: 'var(--text-dark)' }}>{event?.title}</strong> is confirmed.
            </p>
            <p style={{
              fontSize: '13px', color: 'var(--text-light)',
              fontFamily: "'Poppins', sans-serif", marginBottom: '28px',
            }}>
              Redirecting to your tickets...
            </p>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center',
            }}>
              <div style={{
                width: '200px', height: '4px', borderRadius: '2px',
                background: 'var(--border-light)', overflow: 'hidden',
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '2px',
                  background: 'var(--gradient-primary)',
                  animation: 'progressBar 3s linear',
                }} />
              </div>
              <button
                onClick={() => navigate('/dashboard?ticket=' + registrationId)}
                style={{
                  marginTop: '12px', padding: '12px 28px', borderRadius: '10px',
                  background: 'var(--gradient-primary)', color: 'white', border: 'none',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  boxShadow: '0 4px 16px rgba(212,82,42,0.2)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HiOutlineTicket style={{ width: '16px', height: '16px' }} /> View My Ticket
                </span>
              </button>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes progressBar { from { width: 0%; } to { width: 100%; } }
        `}</style>
      </div>
    );
  }

  // ─── FAILED STATE ───────────────────────
  if (paymentStatus === 'failed') {
    return (
      <div style={pageStyle}>
        <div style={{ ...containerStyle, maxWidth: '520px', textAlign: 'center' }}>
          <div style={{ ...cardStyle, padding: '48px 32px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(212,82,42,0.1)', margin: '0 auto 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <HiOutlineXCircle style={{ width: '44px', height: '44px', color: 'var(--primary-terra)' }} />
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif", fontSize: '28px',
              fontWeight: '800', color: 'var(--text-dark)', marginBottom: '8px',
            }}>Payment Failed</h2>
            <p style={{
              fontSize: '15px', color: 'var(--text-light)',
              fontFamily: "'Poppins', sans-serif", marginBottom: '28px',
            }}>
              Don't worry, no amount was deducted. Please try again.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setPaymentStatus('idle'); handlePay(); }}
                style={{
                  padding: '12px 28px', borderRadius: '10px',
                  background: 'var(--gradient-primary)', color: 'white', border: 'none',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  display: 'flex', alignItems: 'center', gap: '6px',
                  boxShadow: '0 4px 16px rgba(212,82,42,0.2)',
                }}
              >
                <HiOutlineRefresh style={{ width: '16px', height: '16px' }} /> Retry Payment
              </button>
              <button
                onClick={() => navigate(-1)}
                style={{
                  padding: '12px 28px', borderRadius: '10px',
                  background: 'var(--bg-light)', color: 'var(--text-dark)',
                  border: '1.5px solid var(--border-light)',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN PAYMENT VIEW ─────────────────
  return (
    <div style={pageStyle}>
      <div style={{ ...containerStyle, gridTemplateColumns: window.innerWidth > 768 ? '1.1fr 0.9fr' : '1fr' }}>

        {/* LEFT — Order Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: '600', color: 'var(--text-light)',
              fontFamily: "'Poppins', sans-serif", padding: 0, width: 'fit-content',
            }}
          >
            <HiArrowLeft style={{ width: '16px', height: '16px' }} /> Back to event
          </button>

          {/* Timer Card */}
          <div style={{
            ...cardStyle, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderColor: isUrgent ? 'rgba(212,82,42,0.4)' : 'var(--border-light)',
            background: isUrgent ? 'rgba(212,82,42,0.03)' : 'var(--bg-lighter)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HiOutlineClock style={{
                width: '20px', height: '20px',
                color: isUrgent ? 'var(--primary-terra)' : 'var(--text-light)',
              }} />
              <span style={{
                fontSize: '13px', fontWeight: '600', color: 'var(--text-gray)',
                fontFamily: "'Poppins', sans-serif",
              }}>
                Session expires in
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '20px', fontWeight: '800',
                color: isUrgent ? 'var(--primary-terra)' : 'var(--text-dark)',
                fontFamily: "'Poppins', sans-serif", fontVariantNumeric: 'tabular-nums',
              }}>
                {formatTimer(timeLeft)}
              </span>
              <div style={{
                width: '60px', height: '4px', borderRadius: '2px',
                background: 'var(--border-light)', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${timerPercent}%`, height: '100%', borderRadius: '2px',
                  background: isUrgent ? 'var(--primary-terra)' : 'var(--sage)',
                  transition: 'width 1s linear',
                }} />
              </div>
            </div>
          </div>

          {/* Event Summary Card */}
          <div style={cardStyle}>
            <h3 style={{
              fontFamily: "'Playfair Display', serif", fontSize: '20px',
              fontWeight: '800', color: 'var(--text-dark)', marginBottom: '20px',
            }}>Order Summary</h3>

            {/* Event Info */}
            <div style={{
              background: 'var(--bg-light)', borderRadius: '12px',
              padding: '20px', marginBottom: '20px',
            }}>
              <h4 style={{
                fontSize: '17px', fontWeight: '700', color: 'var(--text-dark)',
                fontFamily: "'Poppins', sans-serif", marginBottom: '14px',
              }}>{event?.title}</h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {event?.date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={iconBoxStyle}>
                      <HiOutlineCalendar style={{ width: '18px', height: '18px', color: 'var(--primary-terra)' }} />
                    </div>
                    <div>
                      <p style={labelStyle}>Date</p>
                      <p style={valueStyle}>{formatDate(event.date)}</p>
                    </div>
                  </div>
                )}
                {event?.time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={iconBoxStyle}>
                      <HiOutlineClock style={{ width: '18px', height: '18px', color: 'var(--primary-terra)' }} />
                    </div>
                    <div>
                      <p style={labelStyle}>Time</p>
                      <p style={valueStyle}>{event.time}</p>
                    </div>
                  </div>
                )}
                {event?.venue && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={iconBoxStyle}>
                      <HiOutlineLocationMarker style={{ width: '18px', height: '18px', color: 'var(--primary-terra)' }} />
                    </div>
                    <div>
                      <p style={labelStyle}>Venue</p>
                      <p style={valueStyle}>{event.venue}{event.city ? `, ${event.city}` : ''}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-gray)', fontFamily: "'Poppins', sans-serif" }}>
                  Ticket ({registration?.ticketType || 'general'}) × {registration?.ticketsCount || 1}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)', fontFamily: "'Poppins', sans-serif" }}>
                  ₹{displayAmount}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-gray)', fontFamily: "'Poppins', sans-serif" }}>Platform fee</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--sage)', fontFamily: "'Poppins', sans-serif" }}>FREE</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-dark)', fontFamily: "'Poppins', sans-serif" }}>Total</span>
                <span style={{
                  fontSize: '24px', fontWeight: '800', fontFamily: "'Poppins', sans-serif",
                  background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  ₹{displayAmount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Payment Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Payment Method Card */}
          <div style={cardStyle}>
            <h3 style={{
              fontFamily: "'Playfair Display', serif", fontSize: '20px',
              fontWeight: '800', color: 'var(--text-dark)', marginBottom: '20px',
            }}>Payment Method</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {[
                { id: 'upi', label: 'UPI / Google Pay / PhonePe', icon: '📱' },
                { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
                { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                    border: selectedMethod === method.id
                      ? '2px solid var(--primary-terra)'
                      : '1.5px solid var(--border-light)',
                    background: selectedMethod === method.id
                      ? 'rgba(212,82,42,0.04)' : 'var(--bg-lighter)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: '22px' }}>{method.icon}</span>
                  <span style={{
                    fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)',
                    fontFamily: "'Poppins', sans-serif",
                  }}>{method.label}</span>
                  <div style={{
                    marginLeft: 'auto', width: '20px', height: '20px', borderRadius: '50%',
                    border: selectedMethod === method.id
                      ? '6px solid var(--primary-terra)'
                      : '2px solid var(--border-light)',
                    transition: 'all 0.2s ease',
                  }} />
                </button>
              ))}
            </div>

            {/* Attendee Info */}
            <div style={{
              background: 'var(--bg-light)', borderRadius: '12px',
              padding: '16px', marginBottom: '24px',
            }}>
              <p style={{ ...labelStyle, marginBottom: '8px' }}>Attendee Details</p>
              <p style={{ ...valueStyle, marginBottom: '2px' }}>{user?.name}</p>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>{user?.email}</p>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={paymentStatus === 'processing'}
              style={{
                width: '100%', height: '56px', borderRadius: '12px',
                background: paymentStatus === 'processing'
                  ? 'var(--text-light)' : 'var(--gradient-primary)',
                color: 'white', border: 'none', fontSize: '16px', fontWeight: '700',
                cursor: paymentStatus === 'processing' ? 'not-allowed' : 'pointer',
                fontFamily: "'Poppins', sans-serif",
                boxShadow: '0 6px 24px rgba(212,82,42,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.3s ease',
              }}
            >
              {paymentStatus === 'processing' ? (
                <>
                  <div style={{
                    width: '20px', height: '20px', border: '2.5px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Processing...
                </>
              ) : (
                <>
                  <HiOutlineLockClosed style={{ width: '18px', height: '18px' }} />
                  Pay ₹{displayAmount} Securely
                </>
              )}
            </button>
          </div>

          {/* Trust Badges */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '20px', flexWrap: 'wrap', padding: '8px 0',
          }}>
            {[
              { icon: <HiOutlineShieldCheck style={{ width: '16px', height: '16px' }} />, text: 'Razorpay Secured' },
              { icon: <HiOutlineLockClosed style={{ width: '16px', height: '16px' }} />, text: '256-bit SSL' },
              { icon: <HiOutlineCheckCircle style={{ width: '16px', height: '16px' }} />, text: 'Instant Confirmation' },
            ].map((badge, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '11px', fontWeight: '600', color: 'var(--text-light)',
                fontFamily: "'Poppins', sans-serif",
              }}>
                {badge.icon}
                {badge.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .payment-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default PaymentPage;
