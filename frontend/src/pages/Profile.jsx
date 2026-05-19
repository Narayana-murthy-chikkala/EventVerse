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

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  const getInitials = (name) =>
    name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const handleCategoryToggle = (cat) => {
    setProfileData(prev => ({
      ...prev,
      favoriteCategories: prev.favoriteCategories.includes(cat)
        ? prev.favoriteCategories.filter(c => c !== cat)
        : [...prev.favoriteCategories, cat],
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim()) return toast.error('Name is required');
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append('name', profileData.name);
      fd.append('phone', profileData.phone);
      fd.append('city', profileData.city);
      fd.append('bio', profileData.bio);
      fd.append('favoriteCategories', JSON.stringify(profileData.favoriteCategories));
      if (avatarFile) fd.append('image', avatarFile);
      const res = await updateProfile(fd);
      updateUser(res.data.data.user);
      toast.success('Profile updated! 🎉');
      setAvatarFile(null); setAvatarPreview(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) return toast.error('Please fill in all password fields');
    if (passwords.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match');
    setSavingPassword(true);
    try {
      await updatePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const inputStyle = {
    width: '100%', height: '48px', padding: '0 16px',
    background: 'var(--bg-light)', border: '1.5px solid var(--border-light)',
    borderRadius: '10px', fontSize: '14px', color: 'var(--text-dark)',
    outline: 'none', transition: 'all 0.2s ease', boxSizing: 'border-box',
    fontFamily: "'Poppins', sans-serif",
  };

  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: '700',
    color: 'var(--text-gray)', letterSpacing: '0.08em',
    textTransform: 'uppercase', marginBottom: '8px',
    fontFamily: "'Poppins', sans-serif",
  };

  const sectionStyle = {
    background: 'var(--bg-lighter)',
    border: '1.5px solid var(--border-light)',
    borderRadius: '16px', padding: '36px 32px',
    boxShadow: '0 2px 12px rgba(26,21,16,0.04)',
    position: 'relative', overflow: 'hidden',
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-light)',
      paddingTop: '80px', paddingBottom: '80px',
    }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Page header */}
        <div style={{ marginBottom: '40px' }}>
          <span style={{
            display: 'inline-block', fontSize: '11px', fontWeight: '700',
            color: 'var(--primary-terra)', letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: '10px', fontFamily: "'Poppins', sans-serif",
          }}>
            Your Account
          </span>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: '800',
            color: 'var(--text-dark)', marginBottom: '8px',
          }}>
            Account Settings
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>
            Manage your profile and security preferences
          </p>
          {/* Decorative line */}
          <div style={{
            height: '1px', marginTop: '20px',
            background: 'linear-gradient(90deg, transparent 0%, var(--border-light) 50%, transparent 100%)',
          }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Profile Section */}
          <form onSubmit={handleSaveProfile} style={sectionStyle}>
            {/* Left accent bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
              background: 'linear-gradient(180deg, var(--primary-terra) 0%, var(--primary-light) 100%)',
              borderRadius: '4px 0 0 4px',
            }} />

            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(212,82,42,0.2)',
              }}>
                <HiOutlineUser style={{ width: '18px', height: '18px', color: 'white' }} />
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '22px', fontWeight: '700',
                color: 'var(--text-dark)',
              }}>
                Profile Information
              </h2>
            </div>

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {avatarPreview || user?.avatar ? (
                  <img
                    src={avatarPreview || user.avatar}
                    alt={user?.name}
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-light)' }}
                  />
                ) : (
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', fontWeight: '800', color: 'white',
                    fontFamily: "'Poppins', sans-serif",
                  }}>
                    {getInitials(user?.name)}
                  </div>
                )}
                <label style={{
                  position: 'absolute', bottom: '0', right: '0',
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary-terra), var(--primary-light))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(212,82,42,0.2)',
                }}>
                  <HiOutlineCamera style={{ width: '13px', height: '13px', color: 'white' }} />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </label>
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-dark)', fontFamily: "'Poppins', sans-serif", marginBottom: '4px' }}>{user?.name}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-light)', fontFamily: "'Poppins', sans-serif" }}>Click the camera icon to change your photo</p>
              </div>
            </div>

            {/* Fields grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Your full name"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary-terra)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,82,42,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{ ...inputStyle, background: 'var(--bg-light)', color: 'var(--text-light)', cursor: 'not-allowed' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary-terra)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,82,42,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={e => setProfileData({ ...profileData, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary-terra)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,82,42,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                  rows={3}
                  placeholder="Tell us about yourself and your cultural interests..."
                  style={{
                    ...inputStyle, height: 'auto', padding: '12px 16px',
                    resize: 'none', lineHeight: '1.6',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary-terra)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,82,42,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Favorite Categories</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
                  {CATEGORIES.map(cat => {
                    const selected = profileData.favoriteCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryToggle(cat)}
                        style={{
                          padding: '7px 16px', borderRadius: '20px',
                          fontSize: '13px', fontWeight: '600',
                          cursor: 'pointer', transition: 'all 0.2s ease',
                          fontFamily: "'Poppins', sans-serif",
                          background: selected ? 'linear-gradient(135deg, var(--primary-terra), var(--primary-light))' : 'var(--bg-light)',
                          color: selected ? 'white' : 'var(--text-gray)',
                          border: selected ? 'none' : '1.5px solid var(--border-light)',
                          boxShadow: selected ? '0 4px 12px rgba(212,82,42,0.2)' : 'none',
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
              <button
                type="submit"
                disabled={savingProfile}
                style={{
                  height: '48px', padding: '0 32px',
                  background: savingProfile ? 'var(--border-light)' : 'linear-gradient(135deg, var(--primary-terra) 0%, var(--primary-light) 100%)',
                  color: savingProfile ? 'var(--text-gray)' : 'white',
                  border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: '700',
                  cursor: savingProfile ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  fontFamily: "'Poppins', sans-serif",
                  boxShadow: savingProfile ? 'none' : '0 6px 20px rgba(212,82,42,0.2)',
                  minWidth: '140px',
                }}
                onMouseEnter={e => { if (!savingProfile) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(212,82,42,0.3)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = savingProfile ? 'none' : '0 6px 20px rgba(212,82,42,0.2)'; }}
              >
                {savingProfile ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(90,80,72,0.3)', borderTop: '2px solid var(--text-gray)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Saving...
                  </>
                ) : 'Save Profile'}
              </button>
            </div>
          </form>

          {/* Security Section */}
          <form onSubmit={handleChangePassword} style={sectionStyle}>
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
              background: 'linear-gradient(180deg, var(--gold) 0%, var(--gold-light) 100%)',
              borderRadius: '4px 0 0 4px',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(201,168,76,0.2)',
              }}>
                <HiOutlineLockClosed style={{ width: '18px', height: '18px', color: 'white' }} />
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '22px', fontWeight: '700',
                color: 'var(--text-dark)',
              }}>
                Change Password
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '480px' }}>
              {[
                { label: 'Current Password', key: 'currentPassword', placeholder: '••••••••' },
                { label: 'New Password', key: 'newPassword', placeholder: 'At least 6 characters' },
                { label: 'Confirm New Password', key: 'confirmPassword', placeholder: '••••••••' },
              ].map(field => (
                <div key={field.key}>
                  <label style={labelStyle}>{field.label}</label>
                  <input
                    type="password"
                    value={passwords[field.key]}
                    onChange={e => setPasswords({ ...passwords, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={savingPassword}
                style={{
                  width: '100%', height: '48px',
                  background: 'transparent',
                  border: `1.5px solid ${savingPassword ? 'var(--border-light)' : 'var(--gold)'}`,
                  borderRadius: '10px', fontSize: '14px', fontWeight: '700',
                  color: savingPassword ? 'var(--text-light)' : 'var(--gold)',
                  cursor: savingPassword ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontFamily: "'Poppins', sans-serif",
                }}
                onMouseEnter={e => { if (!savingPassword) { e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,168,76,0.12)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {savingPassword ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(201,168,76,0.3)', borderTop: '2px solid var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Updating...
                  </>
                ) : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Profile;