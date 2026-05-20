import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { forgotPassword, resetPassword } from '../services/authservice';
import { HiOutlineMailOpen, HiOutlineKey, HiOutlineArrowLeft } from 'react-icons/hi';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success('OTP sent to your email (if registered)');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return toast.error('Please enter the OTP');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await resetPassword({ email, otp, newPassword });
      toast.success('Password reset successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', height: '48px', padding: '0 16px',
    background: 'var(--bg-light)',
    border: '1.5px solid var(--border-light)',
    borderRadius: '10px', fontSize: '14px',
    color: 'var(--text-dark)', outline: 'none',
    transition: 'all 0.2s ease', boxSizing: 'border-box',
    fontFamily: "'Poppins', sans-serif",
  };

  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: '700',
    color: 'var(--text-gray)', letterSpacing: '0.08em',
    textTransform: 'uppercase', marginBottom: '8px',
    fontFamily: "'Poppins', sans-serif",
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-light)',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      padding: '48px 16px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-60px',
        width: '380px', height: '380px',
        background: 'radial-gradient(circle, rgba(212,82,42,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-60px', left: '-60px',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* Logo */}
      <Link to="/home" style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        marginBottom: '36px', textDecoration: 'none',
        transition: 'transform 0.3s ease',
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ fontSize: '28px' }}>🪔</span>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '26px', fontWeight: '800',
          color: 'var(--primary-terra)', letterSpacing: '-0.02em',
        }}>
          EventVerse
        </span>
      </Link>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'var(--bg-lighter)',
        border: '1.5px solid var(--border-light)',
        borderRadius: '16px', padding: '40px 36px',
        boxShadow: '0 8px 32px rgba(26,21,16,0.07)',
        position: 'relative', zIndex: 1,
        animation: 'fadeUp 0.5s ease both',
      }}>
        {/* Icon + Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(212,82,42,0.1) 0%, rgba(232,131,94,0.08) 100%)',
            border: '1.5px solid var(--border-lighter)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            {step === 1
              ? <HiOutlineMailOpen style={{ width: '28px', height: '28px', color: 'var(--primary-terra)' }} />
              : <HiOutlineKey style={{ width: '28px', height: '28px', color: 'var(--gold)' }} />
            }
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '28px', fontWeight: '800',
            color: 'var(--text-dark)', marginBottom: '8px',
          }}>
            {step === 1 ? 'Reset Password' : 'Verify OTP'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>
            {step === 1 ? 'Enter your registered email to receive an OTP' : 'Enter the 6-digit code sent to your email'}
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              background: s <= step ? 'linear-gradient(90deg, var(--primary-terra), var(--primary-light))' : 'var(--border-light)',
              transition: 'background 0.4s ease',
            }} />
          ))}
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--primary-terra)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,82,42,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: '48px',
                background: loading ? 'var(--border-light)' : 'linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%)',
                color: loading ? 'var(--text-gray)' : 'white',
                border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontFamily: "'Poppins', sans-serif",
                boxShadow: loading ? 'none' : '0 6px 20px rgba(212,82,42,0.2)',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(212,82,42,0.3)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 6px 20px rgba(212,82,42,0.2)'; }}
            >
              {loading ? (
                <>
                  <div style={{ width: '16px', height: '16px', border: '2px solid rgba(90,80,72,0.3)', borderTop: '2px solid var(--text-gray)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Sending OTP...
                </>
              ) : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                placeholder="123456"
                style={{
                  ...inputStyle,
                  fontSize: '24px', fontFamily: 'monospace',
                  letterSpacing: '0.4em', textAlign: 'center',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--primary-terra)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,82,42,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: '48px',
                background: loading ? 'var(--border-light)' : 'linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%)',
                color: loading ? 'var(--text-gray)' : 'white',
                border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontFamily: "'Poppins', sans-serif",
                boxShadow: loading ? 'none' : '0 6px 20px rgba(212,82,42,0.2)',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(212,82,42,0.3)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 6px 20px rgba(212,82,42,0.2)'; }}
            >
              {loading ? (
                <>
                  <div style={{ width: '16px', height: '16px', border: '2px solid rgba(90,80,72,0.3)', borderTop: '2px solid var(--text-gray)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Resetting...
                </>
              ) : 'Reset Password'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                width: '100%', height: '44px',
                background: 'transparent',
                border: '1.5px solid var(--border-light)',
                borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                color: 'var(--text-gray)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s ease', fontFamily: "'Poppins', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-terra)'; e.currentTarget.style.color = 'var(--primary-terra)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-gray)'; }}
            >
              <HiOutlineArrowLeft /> Back to Email
            </button>
          </form>
        )}

        <p style={{
          textAlign: 'center', marginTop: '28px',
          fontSize: '14px', color: 'var(--text-light)',
          fontFamily: "'Poppins', sans-serif",
        }}>
          Remember password?{' '}
          <Link to="/login" style={{ fontWeight: '700', color: 'var(--primary-terra)', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = 'var(--primary-dark)'}
            onMouseLeave={e => e.target.style.color = 'var(--primary-terra)'}
          >
            Sign in
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ForgotPassword;