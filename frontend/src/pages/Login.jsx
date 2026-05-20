import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../services/authservice';
import { HiOutlineEye, HiOutlineEyeOff, HiExclamationCircle } from 'react-icons/hi';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const rawBackendUrl = import.meta.env.VITE_API_URL || 'https://eventverse-backend-8ue1.onrender.com';
  const BACKEND_URL = rawBackendUrl.replace(/\/+$/, '').replace(/\/api\/v1$/i, '');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Invalid email format';
    if (!formData.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await loginApi(formData);
      const { user, token } = res.data.data;
      login(user, token);
      toast.success('Welcome back! 🪔');
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-light)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background blobs */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(212,82,42,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-80px',
        width: '350px', height: '350px',
        background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* Logo */}
      <Link
        to="/home"
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '40px', textDecoration: 'none',
          transition: 'transform 0.3s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
      </Link>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'var(--bg-lighter)',
        border: '1.5px solid var(--border-light)',
        borderRadius: '16px',
        padding: '40px 36px',
        boxShadow: '0 8px 32px rgba(26,21,16,0.07)',
        position: 'relative', zIndex: 1,
        animation: 'fadeUp 0.5s ease both',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '30px', fontWeight: '800',
            color: 'var(--text-dark)', marginBottom: '8px',
          }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>
            Sign in to continue exploring cultural festivals
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Email */}
          <div>
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: '700',
              color: 'var(--text-gray)', letterSpacing: '0.08em',
              textTransform: 'uppercase', marginBottom: '8px',
              fontFamily: "'Poppins', sans-serif",
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              style={{
                width: '100%', height: '48px', padding: '0 16px',
                background: errors.email ? 'rgba(212,82,42,0.04)' : 'var(--bg-light)',
                border: `1.5px solid ${errors.email ? 'var(--primary-terra)' : 'var(--border-light)'}`,
                borderRadius: '10px', fontSize: '14px',
                color: 'var(--text-dark)', outline: 'none',
                transition: 'all 0.2s ease', boxSizing: 'border-box',
                fontFamily: "'Poppins', sans-serif",
              }}
              onFocus={e => { if (!errors.email) e.target.style.borderColor = 'var(--primary-terra)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,82,42,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = errors.email ? 'var(--primary-terra)' : 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
            />
            {errors.email && (
              <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--primary-terra)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'Poppins', sans-serif" }}>
                <HiExclamationCircle style={{ width: '14px', height: '14px', flexShrink: 0 }} /> {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: '700',
              color: 'var(--text-gray)', letterSpacing: '0.08em',
              textTransform: 'uppercase', marginBottom: '8px',
              fontFamily: "'Poppins', sans-serif",
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                style={{
                  width: '100%', height: '48px', padding: '0 48px 0 16px',
                  background: errors.password ? 'rgba(212,82,42,0.04)' : 'var(--bg-light)',
                  border: `1.5px solid ${errors.password ? 'var(--primary-terra)' : 'var(--border-light)'}`,
                  borderRadius: '10px', fontSize: '14px',
                  color: 'var(--text-dark)', outline: 'none',
                  transition: 'all 0.2s ease', boxSizing: 'border-box',
                  fontFamily: "'Poppins', sans-serif",
                }}
                onFocus={e => { if (!errors.password) e.target.style.borderColor = 'var(--primary-terra)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,82,42,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = errors.password ? 'var(--primary-terra)' : 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--text-light)',
                  display: 'flex', alignItems: 'center', padding: '4px',
                }}
              >
                {showPassword ? <HiOutlineEyeOff style={{ width: '18px', height: '18px' }} /> : <HiOutlineEye style={{ width: '18px', height: '18px' }} />}
              </button>
            </div>
            {errors.password && (
              <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--primary-terra)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'Poppins', sans-serif" }}>
                <HiExclamationCircle style={{ width: '14px', height: '14px', flexShrink: 0 }} /> {errors.password}
              </p>
            )}
          </div>

          {/* Forgot password */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
            <a href="/forgot-password" style={{
              fontSize: '13px', fontWeight: '600', color: 'var(--primary-terra)',
              textDecoration: 'none', fontFamily: "'Poppins', sans-serif",
              transition: 'color 0.2s ease',
            }}
              onMouseEnter={e => e.target.style.color = 'var(--primary-dark)'}
              onMouseLeave={e => e.target.style.color = 'var(--primary-terra)'}
            >
              Forgot password?
            </a>
          </div>

          {/* Submit */}
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
                <div style={{
                  width: '16px', height: '16px',
                  border: '2px solid rgba(90,80,72,0.3)',
                  borderTop: '2px solid var(--text-gray)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '28px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap' }}>
            or continue with
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          style={{
            width: '100%', height: '48px',
            background: 'var(--bg-lighter)',
            border: '1.5px solid var(--border-light)',
            borderRadius: '10px', fontSize: '14px', fontWeight: '600',
            color: 'var(--text-dark)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'all 0.2s ease',
            fontFamily: "'Poppins', sans-serif",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-terra)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(212,82,42,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.boxShadow = 'none'; }}
          onClick={handleGoogleLogin}
        >
          <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {/* Sign up link */}
        <p style={{
          marginTop: '28px', textAlign: 'center',
          fontSize: '14px', color: 'var(--text-light)',
          fontFamily: "'Poppins', sans-serif",
        }}>
          Don't have an account?{' '}
          <Link to="/register" style={{
            fontWeight: '700', color: 'var(--primary-terra)',
            textDecoration: 'none', transition: 'color 0.2s ease',
          }}
            onMouseEnter={e => e.target.style.color = 'var(--primary-dark)'}
            onMouseLeave={e => e.target.style.color = 'var(--primary-terra)'}
          >
            Sign up now
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;