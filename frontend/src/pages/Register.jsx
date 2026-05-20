import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { register as registerApi } from '../services/authservice';
import { HiOutlineEye, HiOutlineEyeOff, HiExclamationCircle, HiOutlineCheckCircle } from 'react-icons/hi';

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: '#E5DDD5' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 2) return { level: 1, label: 'Weak', color: '#E05C3A' };
    if (score <= 3) return { level: 2, label: 'Fair', color: '#C9A84C' };
    return { level: 3, label: 'Strong', color: '#6B8D5E' };
  };

  const strength = getPasswordStrength(formData.password);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Invalid email format';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await registerApi({ name: formData.name, email: formData.email, password: formData.password });
      const { user, token } = res.data.data;
      login(user, token);
      toast.success(`Namaste, ${user.name}! Welcome to EventVerse 🪔`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const inputStyle = (hasError) => ({
    width: '100%', height: '48px', padding: '0 16px',
    background: hasError ? 'rgba(212,82,42,0.04)' : 'var(--bg-light)',
    border: `1.5px solid ${hasError ? 'var(--primary-terra)' : 'var(--border-light)'}`,
    borderRadius: '10px', fontSize: '14px', color: 'var(--text-dark)', outline: 'none',
    transition: 'all 0.2s ease', boxSizing: 'border-box',
    fontFamily: "'Poppins', sans-serif",
  });

  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: '700',
    color: 'var(--text-gray)', letterSpacing: '0.08em',
    textTransform: 'uppercase', marginBottom: '8px',
    fontFamily: "'Poppins', sans-serif",
  };

  const errorStyle = {
    marginTop: '6px', fontSize: '12px', color: 'var(--primary-terra)',
    display: 'flex', alignItems: 'center', gap: '4px',
    fontFamily: "'Poppins', sans-serif",
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-light)',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      padding: '48px 16px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute', top: '-60px', left: '-60px',
        width: '380px', height: '380px',
        background: 'radial-gradient(circle, rgba(212,82,42,0.07) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', right: '-40px',
        width: '320px', height: '320px',
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
      </Link>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '480px',
        background: 'var(--bg-lighter)',
        border: '1.5px solid var(--border-light)',
        borderRadius: '16px', padding: '40px 36px',
        boxShadow: '0 8px 32px rgba(26,21,16,0.07)',
        position: 'relative', zIndex: 1,
        animation: 'fadeUp 0.5s ease both',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '30px', fontWeight: '800',
            color: 'var(--text-dark)', marginBottom: '8px',
          }}>
            Join EventVerse
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>
            Create your account to explore amazing cultural festivals
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your full name"
              style={inputStyle(errors.name)}
              onFocus={e => { e.target.style.borderColor = 'var(--primary-terra)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,82,42,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = errors.name ? 'var(--primary-terra)' : 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
            />
            {errors.name && <p style={errorStyle}><HiExclamationCircle style={{ flexShrink: 0 }} /> {errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              style={inputStyle(errors.email)}
              onFocus={e => { e.target.style.borderColor = 'var(--primary-terra)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,82,42,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = errors.email ? 'var(--primary-terra)' : 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
            />
            {errors.email && <p style={errorStyle}><HiExclamationCircle style={{ flexShrink: 0 }} /> {errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 6 characters"
                style={{ ...inputStyle(errors.password), paddingRight: '48px' }}
                onFocus={e => { e.target.style.borderColor = 'var(--primary-terra)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,82,42,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = errors.password ? 'var(--primary-terra)' : 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                position: 'absolute', right: '12px', top: '50%',
                transform: 'translateY(-50%)', background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--text-light)', display: 'flex', padding: '4px',
              }}>
                {showPassword ? <HiOutlineEyeOff style={{ width: '18px', height: '18px' }} /> : <HiOutlineEye style={{ width: '18px', height: '18px' }} />}
              </button>
            </div>
            {errors.password && <p style={errorStyle}><HiExclamationCircle style={{ flexShrink: 0 }} /> {errors.password}</p>}
            {formData.password && !errors.password && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  {[1, 2, 3].map(level => (
                    <div key={level} style={{
                      flex: 1, height: '4px', borderRadius: '2px',
                      background: level <= strength.level ? strength.color : 'var(--border-light)',
                      transition: 'background 0.3s ease',
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>
                  Strength: <span style={{ color: strength.color, fontWeight: '700' }}>{strength.label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label style={labelStyle}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter your password"
                style={{ ...inputStyle(errors.confirmPassword), paddingRight: '48px' }}
                onFocus={e => { e.target.style.borderColor = 'var(--primary-terra)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,82,42,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = errors.confirmPassword ? 'var(--primary-terra)' : 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{
                position: 'absolute', right: '12px', top: '50%',
                transform: 'translateY(-50%)', background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--text-light)', display: 'flex', padding: '4px',
              }}>
                {showConfirmPassword ? <HiOutlineEyeOff style={{ width: '18px', height: '18px' }} /> : <HiOutlineEye style={{ width: '18px', height: '18px' }} />}
              </button>
            </div>
            {errors.confirmPassword && <p style={errorStyle}><HiExclamationCircle style={{ flexShrink: 0 }} /> {errors.confirmPassword}</p>}
            {formData.confirmPassword && formData.password === formData.confirmPassword && !errors.confirmPassword && (
              <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--sage)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'Poppins', sans-serif" }}>
                <HiOutlineCheckCircle style={{ flexShrink: 0 }} /> Passwords match
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: '48px', marginTop: '6px',
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
                Creating account...
              </>
            ) : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={() => {
            window.open(
              "http://localhost:5000/api/auth/google",
              "_self"
            );
          }}
          disabled={loading}
          style={{
            width: '100%', height: '48px', background: 'var(--bg-lighter)',
            border: '1.5px solid var(--border-light)', borderRadius: '10px',
            fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)',
            cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'all 0.2s ease', fontFamily: "'Poppins', sans-serif",
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'var(--primary-terra)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(212,82,42,0.08)'; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {loading ? 'Creating account...' : 'Continue with Google'}
        </button>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>
          Already have an account?{' '}
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

export default Register;