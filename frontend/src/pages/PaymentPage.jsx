import React, { useState, useEffect, useCallback, useId, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FullscreenLoader } from '../components/Loader';
import { getRegistrationById, verifyPayment, sendTicketEmail } from '../services/eventService';
import {
  HiOutlineCalendar, HiOutlineClock, HiOutlineLocationMarker,
  HiOutlineShieldCheck, HiOutlineLockClosed, HiOutlineTicket,
  HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineRefresh,
  HiArrowLeft, HiOutlineCreditCard, HiOutlineOfficeBuilding,
  HiOutlineDeviceMobile, HiOutlineEye, HiOutlineEyeOff,
  HiOutlineDownload, HiOutlinePrinter, HiOutlineExternalLink,
  HiOutlineChevronRight, HiOutlineInformationCircle, HiOutlineMail
} from 'react-icons/hi';

// Bank list for Net Banking
const POPULAR_BANKS = [
  { id: 'SBIN', name: 'State Bank of India', short: 'SBI', color: '#1B64AB', bg: '#E7F5FF' },
  { id: 'HDFC', name: 'HDFC Bank', short: 'HDFC', color: '#004B8D', bg: '#EBF4FC' },
  { id: 'ICIC', name: 'ICICI Bank', short: 'ICICI', color: '#B02A30', bg: '#FDEEE9' },
  { id: 'UTIB', name: 'Axis Bank', short: 'AXIS', color: '#97144D', bg: '#FCE8F0' },
  { id: 'KKBK', name: 'Kotak Mahindra Bank', short: 'KOTAK', color: '#ED1B24', bg: '#FDE8E8' },
  { id: 'PUNB', name: 'Punjab National Bank', short: 'PNB', color: '#A21639', bg: '#FBE8ED' },
];

const ALL_BANKS = [
  { id: 'BARB', name: 'Bank of Baroda' },
  { id: 'CNRB', name: 'Canara Bank' },
  { id: 'UBIN', name: 'Union Bank of India' },
  { id: 'INDB', name: 'IndusInd Bank' },
  { id: 'YESB', name: 'Yes Bank' },
  { id: 'IBKL', name: 'IDBI Bank' },
  { id: 'FDRL', name: 'Federal Bank' },
  { id: 'CBIN', name: 'Central Bank of India' },
  { id: 'BKID', name: 'Bank of India' },
  { id: 'IDFB', name: 'IDFC First Bank' },
  { id: 'IOBA', name: 'Indian Overseas Bank' },
  { id: 'UCBA', name: 'UCO Bank' },
  { id: 'SIBL', name: 'South Indian Bank' },
  { id: 'RATN', name: 'RBL Bank' },
  { id: 'KVBL', name: 'Karur Vysya Bank' },
];

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
  const [activeStep, setActiveStep] = useState(1); // 1: Method & Details, 2: 3D Secure / OTP, 3: Ticket Generated
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes session
  const [orderId] = useState(navState.orderId || null);
  const [amount] = useState(navState.amount || 0);
  const [currency] = useState(navState.currency || 'INR');
  const [keyId, setKeyId] = useState(navState.keyId || '');

  // Payment Method selection: 'card' | 'netbanking' | 'upi'
  const [selectedMethod, setSelectedMethod] = useState('card');

  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.name ? user.name.toUpperCase() : '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [showCvv, setShowCvv] = useState(false);
  const [saveCard, setSaveCard] = useState(true);

  // Net Banking details state
  const [selectedBank, setSelectedBank] = useState('SBIN');
  const [bankingType, setBankingType] = useState('retail'); // 'retail' | 'corporate'
  const [customerId, setCustomerId] = useState('');

  // UPI details state
  const [upiId, setUpiId] = useState('');
  const [upiMode, setUpiMode] = useState('id'); // 'id' | 'qr'

  // Step 2 2FA / OTP State
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpTimer, setOtpTimer] = useState(45);
  const [isVerifying, setIsVerifying] = useState(false);

  // Ref to prevent duplicate verify-payment API calls (survives re-renders)
  const hasVerified = useRef(false);

  // Completed Ticket State
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [emailingTicket, setEmailingTicket] = useState(false);

  const handleEmailTicket = async () => {
    if (!registrationId) return;
    setEmailingTicket(true);
    try {
      const res = await sendTicketEmail(registrationId);
      toast.success(res.data?.message || 'Official ticket emailed successfully! ✉️');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to email ticket');
    } finally {
      setEmailingTicket(false);
    }
  };

  // Fetch registration details
  useEffect(() => {
    const fetchRegistration = async () => {
      try {
        const res = await getRegistrationById(registrationId);
        const reg = res.data.data.registration;
        setRegistration(reg);
        if (reg.event) setEvent(reg.event);
        if (res.data.data.keyId) setKeyId(res.data.data.keyId);
        if (reg.paymentStatus === 'paid') {
          setGeneratedTicket(reg);
          setPaymentStatus('success');
          setActiveStep(3);
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

  // Session Countdown timer
  useEffect(() => {
    if (paymentStatus === 'success') return;
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

  // OTP Timer countdown when on Step 2
  useEffect(() => {
    if (activeStep !== 2) return;
    const interval = setInterval(() => {
      setOtpTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeStep]);

  const formatTimer = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });

  // Card Formatting & Card Brand Detection
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const getCardBrand = (num) => {
    const clean = num.replace(/\s/g, '');
    if (/^4/.test(clean)) return { name: 'VISA', color: '#1A1F71', bg: 'linear-gradient(135deg, #1A1F71 0%, #004B8D 100%)' };
    if (/^(5[1-5]|2[2-7])/.test(clean)) return { name: 'Mastercard', color: '#EB001B', bg: 'linear-gradient(135deg, #242526 0%, #B02A30 100%)' };
    if (/^(60|65|81|82|508)/.test(clean)) return { name: 'RuPay', color: '#097939', bg: 'linear-gradient(135deg, #097939 0%, #004B8D 100%)' };
    if (/^(34|37)/.test(clean)) return { name: 'Amex', color: '#2E77BC', bg: 'linear-gradient(135deg, #2E77BC 0%, #002663 100%)' };
    return { name: 'DEBIT/CREDIT', color: '#D4522A', bg: 'linear-gradient(135deg, #2C2622 0%, #1A1510 100%)' };
  };

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

  // Step 1 Validation -> Proceed to Step 2
  const handleProceedToAuth = () => {
    if (selectedMethod === 'card') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length < 15) {
        toast.error('Please enter a valid 16-digit card number');
        return;
      }
      if (!cardHolder.trim()) {
        toast.error('Please enter cardholder name');
        return;
      }
      if (cardExpiry.length < 5) {
        toast.error('Please enter card expiry in MM/YY format');
        return;
      }
      if (cardCvv.length < 3) {
        toast.error('Please enter a valid 3-digit CVV');
        return;
      }
    } else if (selectedMethod === 'netbanking') {
      if (!selectedBank) {
        toast.error('Please select your bank for Net Banking');
        return;
      }
    } else if (selectedMethod === 'upi') {
      if (upiMode === 'id' && (!upiId || !upiId.includes('@'))) {
        toast.error('Please enter a valid UPI ID (e.g. name@okhdfcbank)');
        return;
      }
    }

    // Advance to Step 2 (3D Secure / OTP Verification)
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setOtpValue('');
    setActiveStep(2);
    setOtpTimer(45);

    // High-visibility Bank OTP alert
    toast.custom((t) => (
      <div
        style={{
          background: 'linear-gradient(135deg, #1C1917, #292524)',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 16px 36px rgba(0,0,0,0.35), 0 0 0 2px rgba(212,82,42,0.5)',
          border: '1px solid rgba(212,82,42,0.6)',
          maxWidth: '440px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          animation: 'slideUp 0.3s ease',
        }}
      >
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'rgba(212,82,42,0.2)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '24px',
          flexShrink: 0,
        }}>
          📲
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#D4522A', fontWeight: '800' }}>
            Bank 3D Secure OTP Code
          </div>
          <div style={{ fontSize: '13px', color: '#E7E5E4', marginTop: '2px' }}>
            Your 6-Digit OTP is: <span style={{ fontSize: '18px', fontWeight: '900', color: '#FDBA74', letterSpacing: '3px', fontFamily: 'monospace' }}>{randomOtp}</span>
          </div>
        </div>
        <button
          onClick={() => {
            setOtpValue(randomOtp);
            toast.dismiss(t.id);
            toast.success('OTP auto-filled!');
          }}
          style={{
            background: 'var(--primary-terra)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Auto-Fill
        </button>
      </div>
    ), { duration: 15000, position: 'top-center' });
  };

  const handleResendOtp = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpValue('');
    setOtpTimer(45);

    toast.custom((t) => (
      <div
        style={{
          background: 'linear-gradient(135deg, #1C1917, #292524)',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 16px 36px rgba(0,0,0,0.35), 0 0 0 2px rgba(212,82,42,0.5)',
          border: '1px solid rgba(212,82,42,0.6)',
          maxWidth: '440px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          animation: 'slideUp 0.3s ease',
        }}
      >
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'rgba(212,82,42,0.2)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '24px',
          flexShrink: 0,
        }}>
          📲
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#D4522A', fontWeight: '800' }}>
            New Bank OTP Dispatched
          </div>
          <div style={{ fontSize: '13px', color: '#E7E5E4', marginTop: '2px' }}>
            Your new OTP is: <span style={{ fontSize: '18px', fontWeight: '900', color: '#FDBA74', letterSpacing: '3px', fontFamily: 'monospace' }}>{newOtp}</span>
          </div>
        </div>
        <button
          onClick={() => {
            setOtpValue(newOtp);
            toast.dismiss(t.id);
            toast.success('New OTP auto-filled!');
          }}
          style={{
            background: 'var(--primary-terra)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Auto-Fill
        </button>
      </div>
    ), { duration: 15000, position: 'top-center' });
  };

  // Step 2: Finalize Payment Verification & Generate Ticket
  const handleConfirmAuthorization = async (overrideSignature = null) => {
    if (isVerifying) return;

    // Strict validation: if using the bank OTP form, require the exact generated OTP
    if (!overrideSignature) {
      if (!otpValue || otpValue.trim().length !== 6) {
        toast.error('Please enter the 6-digit OTP code');
        return;
      }
      if (otpValue.trim() !== generatedOtp) {
        toast.error(`Invalid OTP! Please enter the exact 6-digit code: ${generatedOtp}`);
        return;
      }
    }

    // Prevent duplicate verify-payment API calls (ref persists across renders)
    if (hasVerified.current) {
      if (paymentStatus === 'success' || generatedTicket) return;
      // Already paid in DB but state not updated yet — fetch fresh
      try {
        const fresh = await getRegistrationById(registrationId);
        if (fresh.data?.data?.registration?.paymentStatus === 'paid') {
          setRegistration(fresh.data.data.registration);
          setGeneratedTicket(fresh.data.data.registration);
          setPaymentStatus('success');
          setActiveStep(3);
        }
      } catch (_) {}
      return;
    }
    hasVerified.current = true;

    setIsVerifying(true);
    setPaymentStatus('processing');

    const orderIdToUse = orderId || registration?.orderId || navState.orderId || `order_sim_${Date.now()}`;
    const paymentIdToUse = overrideSignature?.paymentId || `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const signatureToUse = overrideSignature?.signature || 'sim_verified_signature';

    try {
      // Simulate real bank authorization delay
      await new Promise(r => setTimeout(r, 1200));

      const res = await verifyPayment({
        razorpayOrderId: overrideSignature?.orderId || orderIdToUse,
        razorpayPaymentId: paymentIdToUse,
        razorpaySignature: signatureToUse,
        registrationId: registrationId,
      });

      const updatedReg = res.data?.data?.registration || registration;
      setRegistration(updatedReg);
      setGeneratedTicket(updatedReg);
      setPaymentStatus('success');
      setActiveStep(3);
      toast.success('🎉 Payment Verified & Official Ticket Generated!');
    } catch (err) {
      // Fallback check: if registration was updated or already paid in DB
      try {
        const fresh = await getRegistrationById(registrationId);
        if (fresh.data?.data?.registration?.paymentStatus === 'paid') {
          setRegistration(fresh.data.data.registration);
          setGeneratedTicket(fresh.data.data.registration);
          setPaymentStatus('success');
          setActiveStep(3);
          toast.success('🎉 Payment Verified & Official Ticket Generated!');
          return;
        }
      } catch (_) {
        // Ignore fallback fetch error
      }
      console.warn('Payment verification issue:', err?.response?.data?.message || err.message);
      hasVerified.current = false;
      setPaymentStatus('failed');
      toast.error(err.response?.data?.message || 'Payment verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Launch official Razorpay standard popup
  const handleLaunchRazorpayGateway = useCallback(async () => {
    try {
      const orderIdToUse = orderId || registration?.orderId;
      const amountToUse = amount || registration?.totalAmount || 0;
      const razorpayKey = keyId || navState.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

      const isMock =
        !orderIdToUse ||
        orderIdToUse.startsWith('mock_order_') ||
        !razorpayKey ||
        razorpayKey === 'your_razorpay_key_id';

      if (isMock) {
        // Only call confirm if the custom UI hasn't already initiated it
        if (!hasVerified.current) {
          toast('Using secure simulation mode', { icon: '⚡' });
          await handleConfirmAuthorization();
        }
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Payment gateway failed to load. Using simulated gateway.');
        await handleConfirmAuthorization();
        return;
      }

      const options = {
        key: razorpayKey,
        amount: amountToUse * 100,
        currency: currency,
        name: 'EventVerse',
        description: event?.title || 'Event Registration',
        order_id: orderIdToUse,
        handler: async (response) => {
          await handleConfirmAuthorization({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus('idle');
            toast('Payment window closed', { icon: '⚠️' });
          },
        },
        prefill: {
          name: cardHolder || user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
          method: selectedMethod,
        },
        theme: { color: '#D4522A' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setPaymentStatus('failed');
        toast.error('Payment failed at gateway.');
      });
      rzp.open();
    } catch (err) {
      console.warn('Razorpay popup error, proceeding with 3D Secure verification:', err);
      await handleConfirmAuthorization();
    }
  }, [orderId, registration, amount, keyId, navState.keyId, currency, event, cardHolder, user, selectedMethod]);

  if (loading) return <FullscreenLoader />;

  const displayAmount = amount || registration?.totalAmount || 0;
  const timerPercent = (timeLeft / 600) * 100;
  const isUrgent = timeLeft < 120;
  const activeBankObj = POPULAR_BANKS.find(b => b.id === selectedBank) || ALL_BANKS.find(b => b.id === selectedBank) || { name: 'Net Banking Partner' };

  // ─── STYLES ──────────────────────────────
  const pageStyle = {
    minHeight: '100vh',
    background: 'var(--bg-light)',
    paddingTop: '96px',
    paddingBottom: '80px',
  };
  const containerStyle = {
    maxWidth: '1060px',
    margin: '0 auto',
    padding: '0 20px',
  };
  const cardStyle = {
    background: 'var(--bg-lighter)',
    border: '1.5px solid var(--border-light)',
    borderRadius: '20px',
    padding: '28px',
    boxShadow: 'var(--shadow-sm)',
  };

  // ─── STEP 3: TICKET GENERATED VIEW ──────────────────────
  if (activeStep === 3 || paymentStatus === 'success') {
    const ticketData = generatedTicket || registration;
    const eventData = event || ticketData?.event;
    const ticketIdStr = ticketData?._id ? ticketData._id.slice(-8).toUpperCase() : 'CONFIRMED';

    return (
      <div style={pageStyle}>
        <div style={{ ...containerStyle, maxWidth: '780px' }}>
          
          {/* Stepper Header in Confirmed State */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '12px', marginBottom: '28px', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--sage)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>✓</div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--sage)' }}>1. Method</span>
            </div>
            <div style={{ width: '32px', height: '2px', background: 'var(--sage)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--sage)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>✓</div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--sage)' }}>2. 2FA Verification</span>
            </div>
            <div style={{ width: '32px', height: '2px', background: 'var(--sage)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gradient-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>3</div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-terra)' }}>3. Ticket Generated 🎉</span>
            </div>
          </div>

          {/* Success Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(107,141,94,0.14) 0%, rgba(107,141,94,0.06) 100%)',
            border: '1.5px solid rgba(107,141,94,0.3)',
            borderRadius: '18px', padding: '20px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '24px', flexWrap: 'wrap', gap: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '50%',
                background: 'var(--sage)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(107,141,94,0.3)',
              }}>
                <HiOutlineCheckCircle style={{ width: '28px', height: '28px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: "'Poppins', sans-serif" }}>
                  Payment Complete • Official Ticket Issued!
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-gray)', fontFamily: "'Poppins', sans-serif" }}>
                  Your seat is reserved. A confirmation email with QR ticket has been sent to <strong>{user?.email}</strong>.
                </p>
              </div>
            </div>
            <span style={{
              background: 'white', color: 'var(--sage)',
              padding: '6px 14px', borderRadius: '20px',
              fontSize: '12px', fontWeight: '700', border: '1px solid rgba(107,141,94,0.3)',
            }}>
              PAID ₹{displayAmount}
            </span>
          </div>

          {/* Digital Ticket / Entry Pass */}
          <div id="printable-ticket" style={{
            background: 'var(--bg-lighter)',
            borderRadius: '24px',
            border: '2px solid var(--border-light)',
            boxShadow: '0 20px 50px rgba(26,21,16,0.1)',
            overflow: 'hidden',
            marginBottom: '28px',
          }}>
            {/* Ticket Header Graphic */}
            <div style={{
              background: 'linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 60%, var(--gold) 100%)',
              padding: '24px 28px', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'relative',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '20px' }}>🎟️</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.9 }}>
                    EVENTVERSE OFFICIAL PASS
                  </span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', fontFamily: "'Playfair Display', serif" }}>
                  {eventData?.title || 'Event Pass'}
                </h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: '700', backdropFilter: 'blur(4px)',
                }}>
                  {ticketData?.ticketType ? ticketData.ticketType.toUpperCase() : 'GENERAL ADMISSION'}
                </span>
                <p style={{ fontSize: '11px', marginTop: '6px', opacity: 0.85, fontFamily: 'monospace' }}>
                  PASS #{ticketIdStr}
                </p>
              </div>
            </div>

            {/* Ticket Perforated Divider with Notches */}
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative', margin: '-10px 0', zIndex: 2 }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-light)',
                marginLeft: '-12px', border: '2px solid var(--border-light)', borderLeft: 'none'
              }} />
              <div style={{ flex: 1, borderTop: '2px dashed var(--border-light)' }} />
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-light)',
                marginRight: '-12px', border: '2px solid var(--border-light)', borderRight: 'none'
              }} />
            </div>

            {/* Ticket Body Content */}
            <div style={{ padding: '32px 28px', display: 'grid', gridTemplateColumns: window.innerWidth > 640 ? '1.4fr 1fr' : '1fr', gap: '24px' }}>
              
              {/* Left Column: Event & Attendee Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.08em' }}>Date</span>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)', marginTop: '2px' }}>
                      {eventData?.date ? formatDate(eventData.date) : 'Upcoming'}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.08em' }}>Time</span>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)', marginTop: '2px' }}>
                      {eventData?.time || 'Door Open'}
                    </p>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.08em' }}>Venue Location</span>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HiOutlineLocationMarker style={{ color: 'var(--primary-terra)', flexShrink: 0 }} />
                    {eventData?.venue || 'Venue'}{eventData?.city ? `, ${eventData.city}` : ''}
                  </p>
                </div>

                <div style={{ height: '1px', background: 'var(--border-lighter)' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.08em' }}>Attendee</span>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', marginTop: '2px' }}>
                      {ticketData?.attendeeName || user?.name}
                    </p>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>{user?.email}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.08em' }}>Quantity</span>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', marginTop: '2px' }}>
                      {ticketData?.ticketsCount || 1} {ticketData?.ticketsCount === 1 ? 'Person' : 'Persons'}
                    </p>
                    <span style={{ fontSize: '12px', color: 'var(--sage)', fontWeight: '600' }}>✓ Verified Entry</span>
                  </div>
                </div>

                {/* Payment meta */}
                <div style={{ background: 'var(--bg-light)', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>Payment Ref:</span>
                    <p style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: '600', color: 'var(--text-dark)' }}>
                      {ticketData?.paymentId || 'RAZORPAY_CONFIRMED'}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: '800', background: 'rgba(107,141,94,0.12)',
                    color: 'var(--sage)', padding: '4px 10px', borderRadius: '12px',
                  }}>
                    PAID ₹{displayAmount}
                  </span>
                </div>

              </div>

              {/* Right Column: QR Code & Verification Frame */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(212,82,42,0.03) 0%, rgba(201,168,76,0.05) 100%)',
                borderRadius: '16px',
                border: '1.5px solid var(--border-light)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}>
                <div style={{
                  background: 'white',
                  padding: '12px',
                  borderRadius: '16px',
                  boxShadow: '0 8px 24px rgba(26,21,16,0.08)',
                  border: '1px solid var(--border-lighter)',
                  marginBottom: '12px',
                }}>
                  {ticketData?.qrCode ? (
                    <img
                      src={ticketData.qrCode}
                      alt="Event Entry QR"
                      style={{ width: '160px', height: '160px', display: 'block' }}
                    />
                  ) : (
                    <div style={{
                      width: '160px', height: '160px',
                      background: 'var(--bg-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'column', gap: '8px',
                    }}>
                      <HiOutlineTicket style={{ width: '36px', height: '36px', color: 'var(--primary-terra)' }} />
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)' }}>#{ticketIdStr}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--sage)', animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--sage)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Active Scan Code
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-light)', maxWidth: '180px' }}>
                  Show this digital pass at the entrance scanner
                </p>
              </div>

            </div>
          </div>

          {/* Ticket Action Buttons */}
          <div style={{
            display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center',
          }}>
            {ticketData?.qrCode && (
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = ticketData.qrCode;
                  link.download = `eventverse-ticket-${ticketIdStr}.png`;
                  link.click();
                  toast.success('Ticket QR downloaded!');
                }}
                style={{
                  padding: '14px 24px', borderRadius: '12px',
                  background: 'var(--gradient-primary)', color: 'white',
                  border: 'none', fontSize: '14px', fontWeight: '700',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 6px 20px rgba(212,82,42,0.25)',
                }}
              >
                <HiOutlineDownload style={{ width: '18px', height: '18px' }} />
                Download Ticket (PNG)
              </button>
            )}

            <button
              onClick={handleEmailTicket}
              disabled={emailingTicket}
              style={{
                padding: '14px 24px', borderRadius: '12px',
                background: 'rgba(212,82,42,0.08)', color: 'var(--primary-terra)',
                border: '1.5px solid rgba(212,82,42,0.3)',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <HiOutlineMail style={{ width: '18px', height: '18px' }} />
              {emailingTicket ? 'Sending email…' : 'Email Ticket'}
            </button>

            <button
              onClick={() => window.print()}
              style={{
                padding: '14px 24px', borderRadius: '12px',
                background: 'var(--bg-lighter)', color: 'var(--text-dark)',
                border: '1.5px solid var(--border-light)',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <HiOutlinePrinter style={{ width: '18px', height: '18px' }} />
              Print Ticket
            </button>

            <button
              onClick={() => navigate('/dashboard?ticket=' + registrationId)}
              style={{
                padding: '14px 24px', borderRadius: '12px',
                background: 'var(--bg-lighter)', color: 'var(--primary-terra)',
                border: '1.5px solid var(--primary-terra)',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <HiOutlineTicket style={{ width: '18px', height: '18px' }} />
              View in My Tickets
            </button>

            <button
              onClick={() => navigate('/events')}
              style={{
                padding: '14px 24px', borderRadius: '12px',
                background: 'transparent', color: 'var(--text-light)',
                border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              Explore More Events →
            </button>
          </div>

        </div>

        <style>{`
          @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
          @media print {
            body * { visibility: hidden; }
            #printable-ticket, #printable-ticket * { visibility: visible; }
            #printable-ticket { position: absolute; left: 0; top: 0; width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  // ─── STEP 2: 3D SECURE & 2FA / RAZORPAY AUTHENTICATION VIEW ──────────────────────
  if (activeStep === 2) {
    const brandInfo = selectedMethod === 'card' ? getCardBrand(cardNumber) : null;

    return (
      <div style={pageStyle}>
        <div style={{ ...containerStyle, maxWidth: '640px' }}>

          {/* Stepper Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '12px', marginBottom: '28px', flexWrap: 'wrap',
          }}>
            <button
              onClick={() => setActiveStep(1)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--sage)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>✓</div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--sage)' }}>1. Method</span>
            </button>
            <div style={{ width: '32px', height: '2px', background: 'var(--primary-terra)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gradient-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>2</div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-terra)' }}>2. 2FA Verification</span>
            </div>
            <div style={{ width: '32px', height: '2px', background: 'var(--border-light)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border-light)', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>3</div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-gray)' }}>3. Ticket</span>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '36px 32px' }}>
            {/* Bank / Gateway Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1.5px solid var(--border-lighter)', paddingBottom: '20px',
              marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: selectedMethod === 'card' ? 'rgba(212,82,42,0.1)' : activeBankObj.bg || 'rgba(0,75,141,0.1)',
                  color: selectedMethod === 'card' ? 'var(--primary-terra)' : activeBankObj.color || '#004B8D',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800',
                }}>
                  {selectedMethod === 'card' ? <HiOutlineCreditCard /> : <HiOutlineOfficeBuilding />}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-dark)', fontFamily: "'Poppins', sans-serif" }}>
                    {selectedMethod === 'card'
                      ? `${brandInfo.name} 3D-Secure 2FA`
                      : `${activeBankObj.name} NetBanking Gateway`}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HiOutlineShieldCheck style={{ color: 'var(--sage)' }} /> 256-Bit SSL Bank Authorization
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Amount</span>
                <p style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary-terra)' }}>₹{displayAmount}</p>
              </div>
            </div>

            {/* Transaction Details Pill */}
            <div style={{
              background: 'var(--bg-light)', borderRadius: '14px',
              padding: '16px', marginBottom: '24px',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px',
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>Merchant</span>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>EventVerse India</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>Payment Method</span>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>
                  {selectedMethod === 'card' ? `Card (•••• ${cardNumber.slice(-4)})` : `${activeBankObj.name}`}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>Auth Mobile</span>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>+91 •••••• 4892</p>
              </div>
            </div>

            {/* Dynamic Security OTP Alert Banner */}
            {generatedOtp && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(212,82,42,0.1), rgba(201,168,76,0.12))',
                border: '1.5px solid rgba(212,82,42,0.3)',
                borderRadius: '14px',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                textAlign: 'left',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '26px' }}>🔔</span>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-terra)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Bank Authentication Alert — OTP Generated:
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-dark)', letterSpacing: '4px', fontFamily: 'monospace', marginTop: '2px' }}>
                      {generatedOtp}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpValue(generatedOtp);
                    toast.success('OTP Auto-filled!');
                  }}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(212,82,42,0.2)',
                  }}
                >
                  ⚡ Auto-Fill
                </button>
              </div>
            )}

            {/* OTP Prompt */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h4 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>
                Enter One-Time Password (OTP)
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-gray)', maxWidth: '420px', margin: '0 auto 16px' }}>
                Please enter the exact 6-digit OTP code generated above. Only this code will authorize the transaction.
              </p>

              {/* 6-digit OTP Box */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="text"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                  placeholder={generatedOtp || '123456'}
                  style={{
                    width: '240px', height: '52px',
                    textAlign: 'center', fontSize: '24px', fontWeight: '800',
                    letterSpacing: '8px',
                    borderRadius: '12px',
                    border: '2px solid var(--primary-terra)',
                    background: 'var(--bg-lighter)',
                    color: 'var(--text-dark)',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxShadow: '0 0 0 4px rgba(212,82,42,0.1)',
                  }}
                />
              </div>

              {/* Fast test auto-fill helper */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setOtpValue(generatedOtp);
                    toast.success('OTP auto-filled!');
                  }}
                  style={{
                    fontSize: '12px', color: 'var(--primary-terra)',
                    background: 'rgba(212,82,42,0.08)', border: '1px dashed var(--primary-terra)',
                    padding: '4px 12px', borderRadius: '8px', cursor: 'pointer',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  ⚡ Auto-fill OTP ({generatedOtp || 'Generated'})
                </button>

                {otpTimer > 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                    Resend in {otpTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    style={{ fontSize: '12px', color: 'var(--sage)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handleConfirmAuthorization()}
                disabled={isVerifying}
                style={{
                  width: '100%', height: '54px', borderRadius: '12px',
                  background: isVerifying ? 'var(--text-light)' : 'var(--gradient-primary)',
                  color: 'white', border: 'none', fontSize: '16px', fontWeight: '700',
                  cursor: isVerifying ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: '0 6px 20px rgba(212,82,42,0.25)',
                  transition: 'all 0.2s ease',
                }}
              >
                {isVerifying ? (
                  <>
                    <div style={{
                      width: '20px', height: '20px', border: '2.5px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Verifying with Bank...
                  </>
                ) : (
                  <>
                    <HiOutlineLockClosed style={{ width: '18px', height: '18px' }} />
                    Authorize & Confirm ₹{displayAmount}
                  </>
                )}
              </button>

              {/* Or switch to official Razorpay popup modal */}
              <button
                type="button"
                onClick={handleLaunchRazorpayGateway}
                disabled={isVerifying}
                style={{
                  width: '100%', height: '46px', borderRadius: '12px',
                  background: 'var(--bg-light)', color: 'var(--text-dark)',
                  border: '1.5px solid var(--border-light)', fontSize: '13px', fontWeight: '600',
                  cursor: isVerifying ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <HiOutlineExternalLink style={{ width: '16px', height: '16px', color: 'var(--primary-terra)' }} />
                Open Official Razorpay Checkout Modal
              </button>

              <button
                type="button"
                onClick={() => setActiveStep(1)}
                disabled={isVerifying}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-light)',
                  fontSize: '13px', cursor: 'pointer', padding: '6px',
                }}
              >
                ← Back to change payment method
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 1: PAYMENT METHOD & DETAILS SELECTION VIEW ──────────────────────
  const cardBrand = getCardBrand(cardNumber);

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>

        {/* Stepper Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '12px', marginBottom: '28px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gradient-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>1</div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-terra)' }}>1. Payment Method & Details</span>
          </div>
          <div style={{ width: '32px', height: '2px', background: 'var(--border-light)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border-light)', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>2</div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-gray)' }}>2. 2FA Verification</span>
          </div>
          <div style={{ width: '32px', height: '2px', background: 'var(--border-light)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border-light)', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>3</div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-gray)' }}>3. Ticket</span>
          </div>
        </div>

        {/* Grid: Left Order Info / Right Payment UI */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 920 ? '1fr 1.35fr' : '1fr',
          gap: '28px',
          alignItems: 'start',
        }}>

          {/* LEFT: Order Summary & Timer */}
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

            {/* Session Timer Card */}
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
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-gray)' }}>
                  Session expires in
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '20px', fontWeight: '800',
                  color: isUrgent ? 'var(--primary-terra)' : 'var(--text-dark)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {formatTimer(timeLeft)}
                </span>
                <div style={{
                  width: '54px', height: '4px', borderRadius: '2px',
                  background: 'var(--border-light)', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${timerPercent}%`, height: '100%',
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
                fontWeight: '800', color: 'var(--text-dark)', marginBottom: '18px',
              }}>
                Order Summary
              </h3>

              {/* Event Info Card */}
              <div style={{
                background: 'var(--bg-light)', borderRadius: '14px',
                padding: '18px', marginBottom: '20px',
              }}>
                <h4 style={{
                  fontSize: '17px', fontWeight: '700', color: 'var(--text-dark)',
                  fontFamily: "'Poppins', sans-serif", marginBottom: '14px',
                }}>
                  {event?.title}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {event?.date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <HiOutlineCalendar style={{ width: '16px', height: '16px', color: 'var(--primary-terra)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-dark)', fontWeight: '600' }}>{formatDate(event.date)}</span>
                    </div>
                  )}
                  {event?.time && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <HiOutlineClock style={{ width: '16px', height: '16px', color: 'var(--primary-terra)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-dark)', fontWeight: '600' }}>{event.time}</span>
                    </div>
                  )}
                  {event?.venue && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <HiOutlineLocationMarker style={{ width: '16px', height: '16px', color: 'var(--primary-terra)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-dark)', fontWeight: '600' }}>{event.venue}{event.city ? `, ${event.city}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Attendee Details */}
              <div style={{
                background: 'var(--bg-light)', borderRadius: '14px',
                padding: '14px 18px', marginBottom: '20px',
              }}>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.08em' }}>Attendee Info</span>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', marginTop: '2px' }}>{user?.name}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>{user?.email}</p>
              </div>

              {/* Price Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>
                    Ticket ({registration?.ticketType || 'general'}) × {registration?.ticketsCount || 1}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)' }}>
                    ₹{displayAmount}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Platform & Booking Fee</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--sage)' }}>FREE</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-dark)' }}>Total Payable</span>
                  <span style={{
                    fontSize: '24px', fontWeight: '800',
                    background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    ₹{displayAmount}
                  </span>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-around',
              padding: '12px 16px', background: 'var(--bg-lighter)',
              borderRadius: '14px', border: '1.5px solid var(--border-light)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600', color: 'var(--text-light)' }}>
                <HiOutlineShieldCheck style={{ width: '16px', height: '16px', color: 'var(--sage)' }} />
                Razorpay Secured
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600', color: 'var(--text-light)' }}>
                <HiOutlineLockClosed style={{ width: '16px', height: '16px', color: 'var(--primary-terra)' }} />
                256-Bit Encryption
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600', color: 'var(--text-light)' }}>
                <HiOutlineTicket style={{ width: '16px', height: '16px', color: 'var(--gold)' }} />
                Instant Ticket QR
              </div>
            </div>

          </div>

          {/* RIGHT: Dedicated Interactive Payment UI (Card, Net Banking, UPI) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Method Tabs */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
            }}>
              {[
                { id: 'card', label: 'Debit / Credit Card', icon: '💳' },
                { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
                { id: 'upi', label: 'UPI / QR', icon: '📱' },
              ].map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '14px 10px', borderRadius: '14px', cursor: 'pointer',
                    border: selectedMethod === method.id
                      ? '2px solid var(--primary-terra)'
                      : '1.5px solid var(--border-light)',
                    background: selectedMethod === method.id
                      ? 'rgba(212,82,42,0.05)'
                      : 'var(--bg-lighter)',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedMethod === method.id ? '0 4px 16px rgba(212,82,42,0.12)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '24px', marginBottom: '4px' }}>{method.icon}</span>
                  <span style={{
                    fontSize: '12px', fontWeight: '700',
                    color: selectedMethod === method.id ? 'var(--primary-terra)' : 'var(--text-dark)',
                    textAlign: 'center',
                  }}>
                    {method.label}
                  </span>
                </button>
              ))}
            </div>

            {/* 💳 DEDICATED DEBIT / CREDIT CARD UI */}
            {selectedMethod === 'card' && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>
                    Card Details
                  </h3>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', background: 'rgba(27,100,171,0.1)', color: '#1B64AB', padding: '3px 8px', borderRadius: '6px' }}>VISA</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', background: 'rgba(235,0,27,0.1)', color: '#EB001B', padding: '3px 8px', borderRadius: '6px' }}>MC</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', background: 'rgba(9,121,57,0.1)', color: '#097939', padding: '3px 8px', borderRadius: '6px' }}>RuPay</span>
                  </div>
                </div>

                {/* 3D Interactive Card Preview */}
                <div style={{
                  background: cardBrand.bg,
                  borderRadius: '18px',
                  padding: '22px 24px',
                  color: 'white',
                  marginBottom: '24px',
                  boxShadow: '0 12px 32px rgba(26,21,16,0.25)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Background decoration elements */}
                  <div style={{
                    position: 'absolute', right: '-40px', bottom: '-40px',
                    width: '180px', height: '180px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    {/* Chip Graphic */}
                    <div style={{
                      width: '42px', height: '32px', borderRadius: '6px',
                      background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                      border: '1px solid #B8860B', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: '28px', height: '18px', border: '1px solid rgba(0,0,0,0.3)', borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {cardBrand.name}
                    </span>
                  </div>

                  {/* Card Number Preview */}
                  <p style={{
                    fontSize: '20px', fontWeight: '700', letterSpacing: '3px',
                    fontFamily: 'monospace', marginBottom: '20px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                  }}>
                    {cardNumber || '•••• •••• •••• ••••'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.75, display: 'block' }}>CARDHOLDER</span>
                      <p style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        {cardHolder || 'FULL NAME'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.75, display: 'block' }}>EXPIRES</span>
                      <p style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'monospace' }}>
                        {cardExpiry || 'MM/YY'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Input Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                  
                  {/* Card Number */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', display: 'block', marginBottom: '6px' }}>
                      Card Number
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        maxLength={19}
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4532 •••• •••• ••••"
                        style={{
                          width: '100%', height: '48px', padding: '0 14px', paddingRight: '50px',
                          borderRadius: '10px', border: '1.5px solid var(--border-light)',
                          fontSize: '15px', fontFamily: 'monospace', color: 'var(--text-dark)',
                          background: 'var(--bg-lighter)', outline: 'none',
                        }}
                      />
                      <span style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        fontSize: '11px', fontWeight: '800', color: cardBrand.color,
                      }}>
                        {cardBrand.name}
                      </span>
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', display: 'block', marginBottom: '6px' }}>
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      placeholder="NAME AS PRINTED ON CARD"
                      style={{
                        width: '100%', height: '48px', padding: '0 14px',
                        borderRadius: '10px', border: '1.5px solid var(--border-light)',
                        fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)',
                        background: 'var(--bg-lighter)', outline: 'none',
                        textTransform: 'uppercase',
                      }}
                    />
                  </div>

                  {/* Expiry & CVV in 2 columns */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', display: 'block', marginBottom: '6px' }}>
                        Valid Thru (MM/YY)
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        style={{
                          width: '100%', height: '48px', padding: '0 14px',
                          borderRadius: '10px', border: '1.5px solid var(--border-light)',
                          fontSize: '14px', fontFamily: 'monospace', color: 'var(--text-dark)',
                          background: 'var(--bg-lighter)', outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)' }}>
                          CVV / CVC
                        </label>
                        <span title="3 digits on back of card" style={{ fontSize: '11px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <HiOutlineInformationCircle /> 3 digits
                        </span>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showCvv ? 'text' : 'password'}
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          placeholder="•••"
                          style={{
                            width: '100%', height: '48px', padding: '0 14px', paddingRight: '42px',
                            borderRadius: '10px', border: '1.5px solid var(--border-light)',
                            fontSize: '15px', fontFamily: 'monospace', color: 'var(--text-dark)',
                            background: 'var(--bg-lighter)', outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCvv(!showCvv)}
                          style={{
                            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)',
                          }}
                        >
                          {showCvv ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Save Card Checkbox */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '4px' }}>
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary-terra)' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>
                      Save card securely according to RBI guidelines (PCI-DSS compliant)
                    </span>
                  </label>

                </div>

                {/* Submit to Step 2 */}
                <button
                  type="button"
                  onClick={handleProceedToAuth}
                  style={{
                    width: '100%', height: '54px', borderRadius: '12px',
                    background: 'var(--gradient-primary)', color: 'white',
                    border: 'none', fontSize: '16px', fontWeight: '700',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 6px 20px rgba(212,82,42,0.25)',
                  }}
                >
                  <HiOutlineLockClosed style={{ width: '18px', height: '18px' }} />
                  Proceed to Pay ₹{displayAmount}
                </button>
              </div>
            )}

            {/* 🏦 DEDICATED NET BANKING UI */}
            {selectedMethod === 'netbanking' && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>
                    Net Banking
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--sage)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HiOutlineShieldCheck /> Instant Bank Verification
                  </span>
                </div>

                {/* Popular Banks Grid */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', display: 'block', marginBottom: '10px' }}>
                    Select Popular Bank
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {POPULAR_BANKS.map(bank => {
                      const isSelected = selectedBank === bank.id;
                      return (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setSelectedBank(bank.id)}
                          style={{
                            padding: '12px 8px', borderRadius: '12px', cursor: 'pointer',
                            border: isSelected ? '2px solid var(--primary-terra)' : '1.5px solid var(--border-light)',
                            background: isSelected ? 'rgba(212,82,42,0.06)' : 'var(--bg-lighter)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: bank.bg, color: bank.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: '900',
                          }}>
                            {bank.short}
                          </div>
                          <span style={{
                            fontSize: '11px', fontWeight: '700',
                            color: isSelected ? 'var(--primary-terra)' : 'var(--text-dark)',
                            textAlign: 'center', lineHeight: '1.2',
                          }}>
                            {bank.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* All Other Banks Dropdown */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', display: 'block', marginBottom: '6px' }}>
                    Or Choose from All Indian Banks
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    style={{
                      width: '100%', height: '48px', padding: '0 14px',
                      borderRadius: '10px', border: '1.5px solid var(--border-light)',
                      fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)',
                      background: 'var(--bg-lighter)', outline: 'none',
                    }}
                  >
                    <option value="" disabled>Select other bank...</option>
                    {ALL_BANKS.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Account Type (Retail vs Corporate) */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', display: 'block', marginBottom: '8px' }}>
                    Banking Account Type
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { id: 'retail', label: 'Retail Banking (Personal)', icon: '👤' },
                      { id: 'corporate', label: 'Corporate Banking (Business)', icon: '🏢' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setBankingType(t.id)}
                        style={{
                          padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                          border: bankingType === t.id ? '2px solid var(--primary-terra)' : '1.5px solid var(--border-light)',
                          background: bankingType === t.id ? 'rgba(212,82,42,0.06)' : 'var(--bg-lighter)',
                          display: 'flex', alignItems: 'center', gap: '8px',
                          fontSize: '12px', fontWeight: '700',
                          color: bankingType === t.id ? 'var(--primary-terra)' : 'var(--text-dark)',
                        }}
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bank User ID / Customer ID (Optional simulation) */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', display: 'block', marginBottom: '6px' }}>
                    Customer ID / Username (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder="Enter Customer ID for fast prefill"
                    style={{
                      width: '100%', height: '48px', padding: '0 14px',
                      borderRadius: '10px', border: '1.5px solid var(--border-light)',
                      fontSize: '14px', color: 'var(--text-dark)',
                      background: 'var(--bg-lighter)', outline: 'none',
                    }}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>
                    🔒 You will be securely routed to your bank's 2FA portal to complete authentication.
                  </p>
                </div>

                {/* Submit to Step 2 */}
                <button
                  type="button"
                  onClick={handleProceedToAuth}
                  style={{
                    width: '100%', height: '54px', borderRadius: '12px',
                    background: 'var(--gradient-primary)', color: 'white',
                    border: 'none', fontSize: '16px', fontWeight: '700',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 6px 20px rgba(212,82,42,0.25)',
                  }}
                >
                  <HiOutlineLockClosed style={{ width: '18px', height: '18px' }} />
                  Proceed to Bank Verification ₹{displayAmount}
                </button>
              </div>
            )}

            {/* 📱 DEDICATED UPI / QR CODE UI */}
            {selectedMethod === 'upi' && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>
                    UPI / Instant Pay
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--sage)', fontWeight: '700' }}>Zero Surcharge</span>
                </div>

                {/* UPI Mode Toggle */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setUpiMode('id')}
                    style={{
                      padding: '12px', borderRadius: '10px', cursor: 'pointer',
                      border: upiMode === 'id' ? '2px solid var(--primary-terra)' : '1.5px solid var(--border-light)',
                      background: upiMode === 'id' ? 'rgba(212,82,42,0.06)' : 'var(--bg-lighter)',
                      fontSize: '13px', fontWeight: '700',
                      color: upiMode === 'id' ? 'var(--primary-terra)' : 'var(--text-dark)',
                    }}
                  >
                    Enter UPI ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpiMode('qr')}
                    style={{
                      padding: '12px', borderRadius: '10px', cursor: 'pointer',
                      border: upiMode === 'qr' ? '2px solid var(--primary-terra)' : '1.5px solid var(--border-light)',
                      background: upiMode === 'qr' ? 'rgba(212,82,42,0.06)' : 'var(--bg-lighter)',
                      fontSize: '13px', fontWeight: '700',
                      color: upiMode === 'qr' ? 'var(--primary-terra)' : 'var(--text-dark)',
                    }}
                  >
                    Scan QR Code
                  </button>
                </div>

                {upiMode === 'id' ? (
                  <div style={{ marginBottom: '22px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', display: 'block', marginBottom: '6px' }}>
                      Virtual Payment Address (VPA / UPI ID)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. mobile@okhdfcbank or user@upi"
                      style={{
                        width: '100%', height: '48px', padding: '0 14px',
                        borderRadius: '10px', border: '1.5px solid var(--border-light)',
                        fontSize: '14px', color: 'var(--text-dark)',
                        background: 'var(--bg-lighter)', outline: 'none', marginBottom: '10px',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['@okhdfcbank', '@oksbi', '@okaxis', '@okicici', '@paytm', '@ybl'].map(handle => (
                        <button
                          key={handle}
                          type="button"
                          onClick={() => {
                            const base = upiId.split('@')[0] || user?.email?.split('@')[0] || 'user';
                            setUpiId(`${base}${handle}`);
                          }}
                          style={{
                            fontSize: '11px', fontWeight: '600', color: 'var(--text-dark)',
                            background: 'var(--bg-light)', border: '1px solid var(--border-light)',
                            padding: '4px 10px', borderRadius: '14px', cursor: 'pointer',
                          }}
                        >
                          {handle}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-light)', borderRadius: '14px', marginBottom: '22px' }}>
                    <div style={{
                      width: '160px', height: '160px', margin: '0 auto 12px',
                      background: 'white', padding: '10px', borderRadius: '12px',
                      border: '1.5px solid var(--border-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=eventverse@razorpay&pn=EventVerse&am=${displayAmount}&cu=INR`}
                        alt="Scan UPI QR"
                        style={{ width: '100%', height: '100%', display: 'block' }}
                      />
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)' }}>
                      Scan with Google Pay, PhonePe, Paytm or any UPI app
                    </p>
                  </div>
                )}

                {/* Submit to Step 2 */}
                <button
                  type="button"
                  onClick={handleProceedToAuth}
                  style={{
                    width: '100%', height: '54px', borderRadius: '12px',
                    background: 'var(--gradient-primary)', color: 'white',
                    border: 'none', fontSize: '16px', fontWeight: '700',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 6px 20px rgba(212,82,42,0.25)',
                  }}
                >
                  <HiOutlineLockClosed style={{ width: '18px', height: '18px' }} />
                  Proceed with UPI ₹{displayAmount}
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default PaymentPage;
