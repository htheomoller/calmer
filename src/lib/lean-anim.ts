/**
 * Lean Animation System
 * Tiny IntersectionObserver-based reveal animations
 * Respects prefers-reduced-motion and uses only opacity/transform
 * Hardened for client-side navigation with safety timeouts
 */

let observer: IntersectionObserver | null = null;

export function initLeanAnimations({ rootMargin = "0px 0px -10% 0px", once = true } = {}) {
  // Enable animation system
  document.documentElement.classList.add("anim-ready");
  
  // Clean up existing observer
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll<HTMLElement>('[data-anim]').forEach(el => {
      el.classList.add('is-revealed');
    });
    return;
  }

  // Create observer for progressive reveal
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        const delay = Number(el.getAttribute("data-anim-delay") || 0);
        const y = el.getAttribute("data-anim-y");
        const scale = el.getAttribute("data-anim-scale");
        if (y) el.style.setProperty("--anim-y", y);
        if (scale) el.style.setProperty("--anim-scale", scale);
        setTimeout(() => el.classList.add("is-revealed"), delay);
        if (once) observer?.unobserve(el);
      }
    },
    { rootMargin, threshold: 0.1 }
  );

  // Observe all animated elements
  document.querySelectorAll("[data-anim]").forEach(el => observer?.observe(el));

  // Last-ditch safety: reveal anything still hidden after 1.5s
  setTimeout(() => {
    document.querySelectorAll<HTMLElement>("[data-anim]:not(.is-revealed)")
      .forEach(el => el.classList.add("is-revealed"));
  }, 1500);
}

// Cleanup function for development
export function cleanupLeanAnimations() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}