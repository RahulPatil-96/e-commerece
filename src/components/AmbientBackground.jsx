import { useEffect, useState } from 'react';

export default function AmbientBackground({ children }) {
  const [bgClass, setBgClass] = useState('bg-[#FFFFFF]');

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const ratio = scrollY / docHeight;

      if (ratio < 0.25) {
        setBgClass('bg-[#FFFFFF]');
      } else if (ratio < 0.5) {
        setBgClass('bg-[#FDFDFB]');
      } else if (ratio < 0.75) {
        setBgClass('bg-[#F8F8F7]');
      } else if (ratio < 0.95) {
        setBgClass('bg-[#F4F4F2]');
      } else {
        setBgClass('bg-[#FFFFFF]');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`transition-colors duration-1000 ease-in-out relative ${bgClass}`}>
      {/* Fine noise overlay for luxury paper texture feel */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.015] bg-grid-pattern" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
