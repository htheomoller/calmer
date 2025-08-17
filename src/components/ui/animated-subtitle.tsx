import { useEffect, useRef, useState } from "react";

interface AnimatedSubtitleProps {
  children: React.ReactNode;
  delay?: number;
  index?: number;
}

export function AnimatedSubtitle({ children, delay = 0, index = 0 }: AnimatedSubtitleProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDarkened, setIsDarkened] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Initial animation setup
    element.classList.add("opacity-0", "translate-y-1", "transition-all", "duration-700");
    element.style.transitionDelay = `${delay}ms`;

    // Single scroll listener for better performance
    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Fade in when element comes into view
      if (rect.top < windowHeight * 0.8 && rect.bottom > 0 && !isVisible) {
        setIsVisible(true);
        element.classList.remove("opacity-0", "translate-y-1");
        element.classList.add("opacity-100", "translate-y-0");
      }
      
      // Color change when element is in center (one-way only)
      const centerZone = windowHeight * 0.3; // 30% zone in center
      const isInCenter = rect.top < centerZone && rect.bottom > centerZone;
      
      if (isInCenter && !isDarkened) {
        // Add staggered delay for desktop to prevent all changing at once
        const staggerDelay = window.innerWidth > 768 ? index * 200 : 0;
        setTimeout(() => {
          setIsDarkened(true);
        }, staggerDelay);
      }
    };

    // Throttled scroll for better performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [delay, isVisible, isDarkened, index]);

  return (
    <p
      ref={ref}
      style={{ fontFamily: 'Inter, sans-serif' }}
      className={`leading-tight md:leading-snug tracking-tight text-2xl transition-colors duration-500 ${
        isDarkened ? 'text-foreground' : 'text-white'
      }`}
    >
      {children}
    </p>
  );
}