import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { register as registerApi } from '../services/authservice';
import { HiOutlineEye, HiOutlineEyeOff, HiExclamationCircle } from 'react-icons/hi';

const Register = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const getPasswordStrength = (pw) => {
        if (!pw) return { level: 0, label: '', color: '' };
        let score = 0;
        if (pw.length >= 6) score++;
        if (pw.length >= 8) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;

        if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-danger' };
        if (score <= 3) return { level: 2, label: 'Medium', color: 'bg-warning' };
        return { level: 3, label: 'Strong', color: 'bg-success' };
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
            const res = await registerApi({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });
            const { user, token } = res.data.data;
            login(user, token);
            toast.success(`Namaste, ${user.name}! Welcome to SanskritiUtsav 🪔`);
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-base flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-fade-in">
            {/* Background Gradient Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[rgba(6,182,212,0.15)] rounded-full filter blur-[100px] pointer-events-none" />

            <Link to="/" className="flex items-center gap-2 mb-8 group relative z-10 hover:scale-105 transition-transform duration-300">
                <span className="text-[28px]">🪔</span>
                <span className="font-sans text-[26px] font-[800] tracking-[-0.02em] bg-accent-gradient bg-clip-text text-transparent">
                    SanskritiUtsav
                </span>
            </Link>

            <div className="w-full max-w-[420px] bg-[rgba(255,255,255,0.02)] backdrop-blur-card border border-[rgba(255,255,255,0.08)] rounded-[20px] p-8 md:p-10 shadow-card relative z-10">
                <div className="text-center mb-8">
                    <h2 className="text-[28px] font-[800] text-text-primary mb-2">Join SanskritiUtsav</h2>
                    <p className="text-[15px] text-text-muted">Create your account to start exploring</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[13px] font-[600] text-text-muted tracking-[0.02em] mb-1.5 uppercase">Full Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={`w-full h-[46px] px-[14px] bg-[rgba(255,255,255,0.06)] border rounded-[10px] text-text-primary text-[15px] placeholder-[rgba(255,255,255,0.2)] focus:outline-none transition-all duration-200 ${
                                    errors.name 
                                        ? 'border-danger shadow-[0_0_0_3px_rgba(239,68,68,0.12)] animate-shake' 
                                        : 'border-[rgba(255,255,255,0.1)] focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]'
                                }`}
                                placeholder="Your full name"
                            />
                        </div>
                        {errors.name && (
                            <p className="mt-1.5 text-[12px] text-danger animate-slide-up flex items-center gap-1">
                                <HiExclamationCircle className="w-4 h-4" /> {errors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[13px] font-[600] text-text-muted tracking-[0.02em] mb-1.5 uppercase">Email Address</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={`w-full h-[46px] px-[14px] bg-[rgba(255,255,255,0.06)] border rounded-[10px] text-text-primary text-[15px] placeholder-[rgba(255,255,255,0.2)] focus:outline-none transition-all duration-200 ${
                                    errors.email 
                                        ? 'border-danger shadow-[0_0_0_3px_rgba(239,68,68,0.12)] animate-shake' 
                                        : 'border-[rgba(255,255,255,0.1)] focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]'
                                }`}
                                placeholder="you@example.com"
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1.5 text-[12px] text-danger animate-slide-up flex items-center gap-1">
                                <HiExclamationCircle className="w-4 h-4" /> {errors.email}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[13px] font-[600] text-text-muted tracking-[0.02em] mb-1.5 uppercase">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className={`w-full h-[46px] pl-[14px] pr-[40px] bg-[rgba(255,255,255,0.06)] border rounded-[10px] text-text-primary text-[15px] placeholder-[rgba(255,255,255,0.2)] focus:outline-none transition-all duration-200 ${
                                    errors.password 
                                        ? 'border-danger shadow-[0_0_0_3px_rgba(239,68,68,0.12)] animate-shake' 
                                        : 'border-[rgba(255,255,255,0.1)] focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]'
                                }`}
                                placeholder="At least 6 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 inline-flex items-center justify-center text-text-muted hover:text-white transition-colors"
                            >
                                {showPassword ? <HiOutlineEyeOff className="w-5 h-5 flex-shrink-0" /> : <HiOutlineEye className="w-5 h-5 flex-shrink-0" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1.5 text-[12px] text-danger animate-slide-up flex items-center gap-1">
                                <HiExclamationCircle className="w-4 h-4" /> {errors.password}
                            </p>
                        )}
                        {formData.password && !errors.password && (
                            <div className="mt-2 animate-slide-up">
                                <div className="flex gap-1 h-1.5">
                                    {[1, 2, 3].map((level) => (
                                        <div
                                            key={level}
                                            className={`flex-1 rounded-full transition-colors duration-300 ${
                                                level <= strength.level ? strength.color : 'bg-[rgba(255,255,255,0.1)]'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-[11px] text-text-subtle mt-1.5 uppercase tracking-wider font-[600]">
                                    Strength: <span className={strength.color.replace('bg-', 'text-')}>{strength.label}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-[13px] font-[600] text-text-muted tracking-[0.02em] mb-1.5 uppercase">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className={`w-full h-[46px] pl-[14px] pr-[40px] bg-[rgba(255,255,255,0.06)] border rounded-[10px] text-text-primary text-[15px] placeholder-[rgba(255,255,255,0.2)] focus:outline-none transition-all duration-200 ${
                                    errors.confirmPassword 
                                        ? 'border-danger shadow-[0_0_0_3px_rgba(239,68,68,0.12)] animate-shake' 
                                        : 'border-[rgba(255,255,255,0.1)] focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]'
                                }`}
                                placeholder="Re-enter your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 inline-flex items-center justify-center text-text-muted hover:text-white transition-colors"
                            >
                                {showConfirmPassword ? <HiOutlineEyeOff className="w-5 h-5 flex-shrink-0" /> : <HiOutlineEye className="w-5 h-5 flex-shrink-0" />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="mt-1.5 text-[12px] text-danger animate-slide-up flex items-center gap-1">
                                <HiExclamationCircle className="w-4 h-4" /> {errors.confirmPassword}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 w-full h-[48px] bg-accent-gradient text-white rounded-[10px] font-[700] text-[15px] mt-2 hover:shadow-glow-primary transition-all duration-300 active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                                Creating account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="mt-8 flex items-center justify-center gap-3">
                    <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
                    <span className="text-[13px] font-[500] text-text-muted flex-shrink-0">or continue with</span>
                    <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
                </div>

                <div className="mt-6 flex justify-center gap-4">
                    <button className="inline-flex items-center justify-center gap-2 flex-1 h-[44px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-text-primary text-[14px] font-[500] hover:bg-[rgba(255,255,255,0.08)] transition-all active:scale-[0.98] whitespace-nowrap">
                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Google
                    </button>
                </div>

                <p className="mt-8 text-center text-[14px] text-text-muted">
                    Already have an account?{' '}
                    <Link to="/login" className="font-[600] text-white hover:text-accent-cyan transition-colors">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
