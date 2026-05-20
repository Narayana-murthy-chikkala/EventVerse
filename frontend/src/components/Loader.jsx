import React from 'react';

export const FullscreenLoader = () => {
  return (
    <div style={{
      width: '100%',
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      background: 'var(--bg-light)'
    }}>
      {/* Decorative ambient background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(212,82,42,0.06) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        zIndex: 10
      }}>
        {/* Real-time multi-ring loader */}
        <div style={{
          position: 'relative',
          width: '80px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Outer ring */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'var(--primary-terra)',
            borderRightColor: 'var(--gold)',
            animation: 'spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite'
          }} />
          
          {/* Middle ring */}
          <div style={{
            position: 'absolute',
            inset: '10px',
            borderRadius: '50%',
            border: '2px solid transparent',
            borderBottomColor: 'var(--primary-light)',
            borderLeftColor: 'var(--gold-light)',
            animation: 'spin-reverse 2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite'
          }} />

          {/* Inner pulse core */}
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            boxShadow: '0 0 20px rgba(212,82,42,0.4)',
            animation: 'pulse-glow 1.5s ease-in-out infinite'
          }} />
        </div>

        {/* Text with dynamic scanning effect */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '14px',
            fontWeight: '700',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--text-gray)',
            margin: 0
          }}>
            Loading
          </p>
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-50%',
            width: '200%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent 0%, var(--primary-terra) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            animation: 'scan-text 2s linear infinite',
            fontFamily: "'Poppins', sans-serif",
            fontSize: '14px',
            fontWeight: '700',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            textAlign: 'center',
            pointerEvents: 'none'
          }}>
            Loading
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(0.8); opacity: 0.8; box-shadow: 0 0 10px rgba(212,82,42,0.2); }
          50% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 25px rgba(212,82,42,0.6); }
        }
        @keyframes scan-text {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes shimmer-light {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export const SkeletonCard = () => {
  const shimmerStyle = {
    background: 'linear-gradient(90deg, var(--bg-soft) 25%, var(--border-light) 50%, var(--bg-soft) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer-light 1.5s infinite linear',
    borderRadius: 'var(--radius-sm)'
  };

  return (
    <div className="card" style={{ height: '380px', display: 'flex', flexDirection: 'column', padding: 0 }}>
      {/* Image Skeleton */}
      <div style={{ ...shimmerStyle, height: '200px', width: '100%', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', flexShrink: 0 }} />
      
      <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Title Skeleton */}
        <div style={{ ...shimmerStyle, height: '24px', width: '75%', marginBottom: '16px' }} />
        {/* Subtitle Skeleton */}
        <div style={{ ...shimmerStyle, height: '16px', width: '50%', marginBottom: '24px' }} />
        
        {/* Footer Skeleton */}
        <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', flexDirection: 'column' }}>
          <div style={{ ...shimmerStyle, height: '12px', width: '60%' }} />
          <div style={{ ...shimmerStyle, height: '12px', width: '40%' }} />
        </div>
      </div>
    </div>
  );
};

export default FullscreenLoader;
