/**
 * Lean Animation System
 * Tiny IntersectionObserver-based reveal animations
 * Respects prefers-reduced-motion and uses only opacity/transform
 */

let observer: IntersectionObserver | null = null;

export function initLeanAnimations() {
  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Immediately reveal all elements
    document.querySelectorAll('[data-anim]').forEach(el => {
      el.classList.add('is-revealed');
    });
    return;
  }

  // Create observer for progressive reveal
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const delay = parseInt(element.dataset.animDelay || '0', 10);
          
          setTimeout(() => {
            element.classList.add('is-revealed');
          }, delay);
          
          observer?.unobserve(element);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
  );

  // Observe all animated elements
  document.querySelectorAll('[data-anim]').forEach(el => {
    const element = el as HTMLElement;
    
    // Set CSS custom properties from data attributes
    if (element.dataset.animY) {
      element.style.setProperty('--anim-y', element.dataset.animY);
    }
    if (element.dataset.animScale) {
      element.style.setProperty('--anim-scale', element.dataset.animScale);
    }
    
    observer?.observe(element);
  });
}

// Cleanup function for development
export function cleanupLeanAnimations() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}