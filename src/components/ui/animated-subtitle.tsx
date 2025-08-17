import { useEffect, useRef, useState } from "react";

interface AnimatedSubtitleProps {
  children: React.ReactNode;
  delay?: number;
}

export function AnimatedSubtitle({ children, delay = 0 }: AnimatedSubtitleProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDarkened, setIsDarkened] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Initial animation setup
    element.classList.add("opacity-0", "translate-y-1", "transition-all", "duration-700");
    element.style.transitionDelay = `${delay}ms`;

    // Intersection observer for initial fade-in
    const fadeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            entry.target.classList.remove("opacity-0", "translate-y-1");
            entry.target.classList.add("opacity-100", "translate-y-0");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "50px"
      }
    );

    // Intersection observer for color change at center
    const colorObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsDarkened(true);
          } else {
            setIsDarkened(false);
          }
        });
      },
      {
        threshold: [0.5, 0.6, 0.7],
        rootMargin: "-40% 0px -40% 0px" // Smaller center detection zone for individual triggering
      }
    );

    const timeoutId = setTimeout(() => {
      fadeObserver.observe(element);
      colorObserver.observe(element);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      fadeObserver.disconnect();
      colorObserver.disconnect();
    };
  }, [delay, isVisible]);

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