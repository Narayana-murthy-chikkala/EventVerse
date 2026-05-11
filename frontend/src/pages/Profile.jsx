import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/eventService';
import { updatePassword } from '../services/authservice';
import { HiOutlineCamera, HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi';

const CATEGORIES = [
    'Classical Music', 'Folk Dance', 'Classical Dance',
    'Art Exhibition', 'Food Festival', 'Theater & Drama',
    'Craft Fair', 'Cultural Parade', 'Literary Festival',
    'Film Festival', 'Spiritual & Religious', 'Other',
];

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        city: user?.city || '',
        bio: user?.bio || '',
        favoriteCategories: user?.favoriteCategories || [],
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [savingProfile, setSavingProfile] = useState(false);

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [savingPassword, setSavingPassword] = useState(false);

    const getInitials = (name) =>
        name
            ? name
                .split(' ')
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            : 'U';

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleCategoryToggle = (cat) => {
        setProfileData((prev) => ({
            ...prev,
            favoriteCategories: prev.favoriteCategories.includes(cat)
                ? prev.favoriteCategories.filter((c) => c !== cat)
                : [...prev.favoriteCategories, cat],
        }));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!profileData.name.trim()) return toast.error('Name is required');
        setSavingProfile(true);
        try {
            const formData = new FormData();
            formData.append('name', profileData.name);
            formData.append('phone', profileData.phone);
            formData.append('city', profileData.city);
            formData.append('bio', profileData.bio);
            formData.append('favoriteCategories', JSON.stringify(profileData.favoriteCategories));
            if (avatarFile) formData.append('image', avatarFile);

            const res = await updateProfile(formData);
            updateUser(res.data.data.user);
            toast.success('Profile updated! 🎉');
            setAvatarFile(null);
            setAvatarPreview(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!passwords.currentPassword || !passwords.newPassword) {
            return toast.error('Please fill in all password fields');
        }
        if (passwords.newPassword.length < 6) {
            return toast.error('New password must be at least 6 characters');
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        setSavingPassword(true);
        try {
            await updatePassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            });
            toast.success('Password changed successfully!');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to change password');
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-base pt-[70px] pb-20 relative overflow-hidden animate-fade-in">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[rgba(6,182,212,0.1)] rounded-full filter blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[rgba(124,58,237,0.08)] rounded-full filter blur-[120px] pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-[32px] md:text-[40px] font-[800] tracking-[-0.02em] text-text-primary mb-2">
                        Account Settings
                    </h1>
                    <p className="text-[15px] text-text-muted font-[500]">Manage your profile and security preferences</p>
                </div>

                <div className="space-y-8">
                    {/* Profile Section */}
                    <form
                        onSubmit={handleSaveProfile}
                        className="bg-[rgba(255,255,255,0.02)] backdrop-blur-card border border-[rgba(255,255,255,0.08)] rounded-[20px] p-6 sm:p-10 shadow-card relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-accent-gradient"></div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-full bg-[rgba(124,58,237,0.15)] text-accent-primary flex items-center justify-center">
                                <HiOutlineUser className="w-5 h-5" />
                            </div>
                            <h2 className="text-[20px] font-[700] text-text-primary">Profile Information</h2>
                        </div>

                        {/* Avatar */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-8 border-b border-[rgba(255,255,255,0.06)]">
                            <div className="relative group shrink-0">
                                <div className="w-[100px] h-[100px] rounded-full p-[3px] bg-accent-gradient">
                                    {avatarPreview || user?.avatar ? (
                                        <img
                                            src={avatarPreview || user.avatar}
                                            alt={user?.name}
                                            className="w-full h-full rounded-full object-cover border-2 border-bg-base"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-bg-base flex items-center justify-center text-text-primary text-[28px] font-[800]">
                                            {getInitials(user?.name)}
                                        </div>
                                    )}
                                </div>
                                <label className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(10,10,15,0.6)] backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <HiOutlineCamera className="w-6 h-6 text-white mb-1" />
                                    <span className="text-white text-[11px] font-[600] uppercase tracking-wider">Change</span>
                                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                </label>
                            </div>
                            <div className="text-center sm:text-left pt-2">
                                <p className="text-[24px] font-[700] text-text-primary mb-1">{user?.name}</p>
                                <p className="text-[14px] text-text-muted mb-2">{user?.email}</p>
                                <span className={`inline-block px-2.5 py-1 rounded-[6px] text-[11px] font-[700] uppercase tracking-wider border ${
                                    user?.role === 'admin' 
                                        ? 'bg-[rgba(124,58,237,0.15)] text-accent-primary border-[rgba(124,58,237,0.3)]' 
                                        : 'bg-[rgba(255,255,255,0.06)] text-text-muted border-[rgba(255,255,255,0.1)]'
                                }`}>
                                    {user?.role}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="sm:col-span-2">
                                <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full h-[46px] px-[14px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[15px] text-text-primary focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">Phone Number</label>
                                <input
                                    type="text"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                    className="w-full h-[46px] px-[14px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[15px] text-text-primary placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">City</label>
                                <input
                                    type="text"
                                    value={profileData.city}
                                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                                    placeholder="e.g. Mumbai"
                                    className="w-full h-[46px] px-[14px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[15px] text-text-primary placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">Bio</label>
                                <textarea
                                    value={profileData.bio}
                                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                    rows={3}
                                    placeholder="Tell us about yourself and your cultural interests..."
                                    className="w-full p-[14px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[15px] text-text-primary placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)] transition-all resize-none"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-3">Favorite Categories</label>
                                <div className="flex flex-wrap gap-2.5">
                                    {CATEGORIES.map((cat) => {
                                        const isSelected = profileData.favoriteCategories.includes(cat);
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => handleCategoryToggle(cat)}
                                                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-[13px] font-[600] transition-all border whitespace-nowrap ${
                                                    isSelected
                                                        ? 'bg-[rgba(124,58,237,0.2)] text-white border-[rgba(124,58,237,0.5)] shadow-[0_0_15px_rgba(124,58,237,0.2)]'
                                                        : 'bg-[rgba(255,255,255,0.02)] text-text-muted border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.06)] hover:text-text-primary'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex justify-end">
                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="inline-flex items-center justify-center gap-2 h-[48px] px-8 bg-accent-gradient text-white rounded-[12px] font-[600] text-[15px] hover:shadow-glow-primary transition-all active:scale-[0.98] disabled:opacity-60 min-w-[160px] whitespace-nowrap"
                            >
                                {savingProfile ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Profile'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Security Section */}
                    <form
                        onSubmit={handleChangePassword}
                        className="bg-[rgba(255,255,255,0.02)] backdrop-blur-card border border-[rgba(255,255,255,0.08)] rounded-[20px] p-6 sm:p-10 shadow-card relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-accent-cyan"></div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-full bg-[rgba(6,182,212,0.15)] text-accent-cyan flex items-center justify-center">
                                <HiOutlineLockClosed className="w-5 h-5" />
                            </div>
                            <h2 className="text-[20px] font-[700] text-text-primary">Change Password</h2>
                        </div>

                        <div className="space-y-6 max-w-md">
                            <div>
                                <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">Current Password</label>
                                <input
                                    type="password"
                                    value={passwords.currentPassword}
                                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                    className="w-full h-[46px] px-[14px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[15px] text-text-primary focus:outline-none focus:border-accent-cyan focus:shadow-[0_0_0_2px_rgba(6,182,212,0.15)] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">New Password</label>
                                <input
                                    type="password"
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                    placeholder="At least 6 characters"
                                    className="w-full h-[46px] px-[14px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[15px] text-text-primary placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:border-accent-cyan focus:shadow-[0_0_0_2px_rgba(6,182,212,0.15)] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-[600] text-text-muted tracking-wider uppercase mb-1.5">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                    className="w-full h-[46px] px-[14px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[15px] text-text-primary focus:outline-none focus:border-accent-cyan focus:shadow-[0_0_0_2px_rgba(6,182,212,0.15)] transition-all"
                                />
                            </div>
                            
                            <button
                                type="submit"
                                disabled={savingPassword}
                                className="inline-flex items-center justify-center gap-2 h-[48px] w-full bg-[rgba(6,182,212,0.15)] border border-[rgba(6,182,212,0.3)] text-accent-cyan rounded-[12px] font-[600] text-[15px] hover:bg-[rgba(6,182,212,0.25)] transition-all active:scale-[0.98] disabled:opacity-60 whitespace-nowrap"
                            >
                                {savingPassword ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-[rgba(6,182,212,0.3)] border-t-accent-cyan rounded-full animate-spin flex-shrink-0" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Password'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
