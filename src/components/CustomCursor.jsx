import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [cursorState, setCursorState] = useState({
    variant: 'default', // 'default', 'hover-button', 'hover-text', 'hover-card'
    text: '',
    visible: false,
  });

  const mouseX = useSpring(-100, { stiffness: 400, damping: 28 });
  const mouseY = useSpring(-100, { stiffness: 400, damping: 28 });

  useEffect(() => {
    // Only enable on desktop/pointer-fine devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      if (!cursorState.visible) {
        setCursorState((prev) => ({ ...prev, visible: true }));
      }

      // Check target element data attributes or classes
      const target = e.target;
      if (!target) return;

      const clickable = target.closest('button, a, input, select, textarea, [role="button"]');
      const cursorText = target.closest('[data-cursor-text]')?.getAttribute('data-cursor-text');

      if (cursorText) {
        setCursorState((prev) => ({
          ...prev,
          variant: 'labeled',
          text: cursorText,
        }));
      } else if (clickable) {
        setCursorState((prev) => ({
          ...prev,
          variant: 'hover-button',
          text: '',
        }));
      } else {
        setCursorState((prev) => ({
          ...prev,
          variant: 'default',
          text: '',
        }));
      }
    };

    const handleMouseLeave = () => {
      setCursorState((prev) => ({ ...prev, visible: false }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mouseX, mouseY, cursorState.visible]);

  if (!cursorState.visible) return null;

  const variants = {
    default: {
      width: 14,
      height: 14,
      backgroundColor: 'rgba(199, 164, 81, 0.7)',
      border: '1px solid rgba(199, 164, 81, 0.9)',
      boxShadow: '0 0 12px rgba(199, 164, 81, 0.4)',
    },
    'hover-button': {
      width: 44,
      height: 44,
      backgroundColor: 'rgba(22, 22, 22, 0.15)',
      border: '1.5px solid rgba(199, 164, 81, 0.8)',
      backdropFilter: 'blur(4px)',
    },
    labeled: {
      width: 72,
      height: 72,
      backgroundColor: '#C7A451',
      border: 'none',
      color: '#FFFFFF',
    },
  };

  return (
    <motion.div
      className="fixed top-0 left-0 z-50 pointer-events-none rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 hidden md:flex font-medium text-xs tracking-wider"
      style={{
        x: mouseX,
        y: mouseY,
      }}
      animate={cursorState.variant}
      variants={variants}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    >
      {cursorState.text && (
        <span className="text-[10px] uppercase font-semibold text-white tracking-widest animate-fade-in">
          {cursorState.text}
        </span>
      )}
    </motion.div>
  );
}
