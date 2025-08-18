/**
 * Debug utility for Live Preview click blocking (dev only)
 * Logs elements that might be blocking interactions
 */
export function debugClickBlockers() {
  if (process.env.NODE_ENV === 'production') return;
  
  console.log('🔍 Detecting click blockers...');
  
  // Check what element is at the center of viewport
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const elementAtCenter = document.elementFromPoint(centerX, centerY);
  
  console.log('Element at viewport center:', elementAtCenter);
  
  // Scan for potential blocking overlays
  const potentialBlockers = document.querySelectorAll('*');
  const blockers: Array<{element: Element, styles: CSSStyleDeclaration}> = [];
  
  potentialBlockers.forEach(el => {
    const styles = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    
    // Check for full-screen overlays with blocking pointer events
    const isFullScreen = rect.width >= window.innerWidth * 0.8 && rect.height >= window.innerHeight * 0.8;
    const hasBlockingPointerEvents = styles.pointerEvents !== 'none';
    const isPositioned = ['fixed', 'absolute', 'sticky'].includes(styles.position);
    const hasHighZIndex = parseInt(styles.zIndex) > 100;
    
    if (isFullScreen && hasBlockingPointerEvents && isPositioned && hasHighZIndex) {
      blockers.push({ element: el, styles });
    }
  });
  
  console.log('Potential click blockers found:', blockers);
  
  blockers.forEach(({ element, styles }, index) => {
    console.log(`Blocker ${index + 1}:`, {
      element,
      selector: getElementSelector(element),
      styles: {
        position: styles.position,
        zIndex: styles.zIndex,
        pointerEvents: styles.pointerEvents,
        width: styles.width,
        height: styles.height
      }
    });
  });
  
  return blockers;
}

function getElementSelector(element: Element): string {
  if (element.id) return `#${element.id}`;
  if (element.className) {
    const classes = element.className.toString().split(' ').filter(c => c);
    if (classes.length > 0) return `.${classes.join('.')}`;
  }
  return element.tagName.toLowerCase();
}