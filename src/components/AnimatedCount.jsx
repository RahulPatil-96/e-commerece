import { useEffect, useState, useRef } from 'react';

export default function AnimatedCount({ value = '0', duration = 2000 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Extract numeric part and suffix/prefix (e.g., '10,000+' -> number 10000, suffix '+', comma format)
  const numericMatch = value.match(/[\d,]+/);
  const rawNumber = numericMatch ? parseInt(numericMatch[0].replace(/,/g, ''), 10) : 0;
  const prefix = value.split(numericMatch ? numericMatch[0] : '')[0] || '';
  const suffix = value.split(numericMatch ? numericMatch[0] : '')[1] || '';

  useEffect(() => {
    const node = ref.current;
    if (!node || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          let startTime = null;

          const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease out cubic
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easedProgress * rawNumber);
            setDisplayValue(current);

            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };

          window.requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rawNumber, duration, hasAnimated]);

  return (
    <span ref={ref} className="inline-block tabular-nums">
      {prefix}
      {displayValue.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}
