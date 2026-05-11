export const FullscreenLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-bg-base flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.15)_0%,_transparent_50%)] pointer-events-none" />
      <div className="flex flex-col items-center gap-4">
        <div className="w-[60px] h-[60px] rounded-full border-4 border-[rgba(255,255,255,0.05)] border-t-accent-primary animate-spin" />
        <p className="text-text-muted text-sm font-medium tracking-widest uppercase animate-pulse">Loading...</p>
      </div>
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-[14px] overflow-hidden h-[380px] flex flex-col">
      <div className="h-[200px] w-full animate-shimmer" style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%'
      }} />
      <div className="p-5 flex flex-col flex-grow">
        <div className="h-5 rounded-md w-3/4 mb-3 animate-shimmer" style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
          backgroundSize: '200% 100%'
        }} />
        <div className="h-5 rounded-md w-1/2 mb-5 animate-shimmer" style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
          backgroundSize: '200% 100%'
        }} />
        
        <div className="space-y-3 mt-auto">
          <div className="h-3 rounded-md w-2/3 animate-shimmer" style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
            backgroundSize: '200% 100%'
          }} />
          <div className="h-3 rounded-md w-1/2 animate-shimmer" style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
            backgroundSize: '200% 100%'
          }} />
        </div>
      </div>
    </div>
  );
};

export default FullscreenLoader;
