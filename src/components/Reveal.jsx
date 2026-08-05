import { motion } from 'framer-motion';

export default function Reveal({
  children,
  className = '',
  delay = 0,
  y = 60,
  blur = 8,
  duration = 1.0,
  once = true
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: y,
        rotateX: -12,
        scale: 0.98,
        filter: `blur(${blur}px)`,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        rotateX: 0,
        scale: 1,
        filter: 'blur(0px)',
      }}
      viewport={{ once, margin: '-60px' }}
      transition={{
        duration,
        delay: delay / 1000,
        ease: [0.16, 1, 0.3, 1], // Power4.out equivalent cubic bezier
      }}
      className={className}
      style={{ perspective: 1200, transformStyle: 'preserve-3d' }}
    >
      {children}
    </motion.div>
  );
}