<script>
if (typeof pageFunctions !== 'undefined') {
pageFunctions.addFunction('spinnerCTA', function() {

  ///////////////////////////
  // CONFIG
  ///////////////////////////

  const ROLL_CONFIG = {
    STEP_HEIGHT_EM: 6.25,        // Desktop: .digit-box height (6.25em)
    STEP_HEIGHT_EM_TABLET: 3.75, // Tablet/Mobile landscape: 480px - 767px
    STEP_HEIGHT_EM_MOBILE: 3.11, // Mobile portrait: ≤479px
    STRIP_REPEATS: 20,           // How many times we clone the base set to allow long spins
    MIN_SPINS: 2,                // Min full revolutions before landing
    MAX_SPINS: 4,                // Max full revolutions before landing
    BASE_DURATION: 2.2,          // Base spin duration
    DURATION_INCREMENT: 0.18,    // Extra duration per position index (gives stagger feeling)
    STAGGER_DELAY: 0.1,          // Delay between each wheel start
    EASE: 'power2.out'           // Ease at the end
  };
  
  // Get current step height for this breakpoint
  function getCurrentStepHeight() {
    const width = window.innerWidth;
    if (width <= 479) {
      return ROLL_CONFIG.STEP_HEIGHT_EM_MOBILE;  // Mobile portrait
    } else if (width <= 767) {
      return ROLL_CONFIG.STEP_HEIGHT_EM_TABLET;  // Tablet / mobile landscape
    } else {
      return ROLL_CONFIG.STEP_HEIGHT_EM;         // Desktop
    }
  }
  
  // Debug function to calculate actual step height - call window.calculate404StepHeight() in console
  window.calculate404StepHeight = function() {
    const digit = document.querySelector('.digit');
    const digitBox = document.querySelector('.digit-box');
    if (!digit || !digitBox) {
      console.log('Digit elements not found');
      return null;
    }
    
    const digitComputed = getComputedStyle(digit);
    const boxComputed = getComputedStyle(digitBox);
    const digitHeightPx = parseFloat(digitComputed.height);
    const digitMarginBottomPx = parseFloat(digitComputed.marginBottom) || 0;
    const boxHeightPx = parseFloat(boxComputed.height);
    const fontSizePx = parseFloat(digitComputed.fontSize);
    
    const totalDigitHeightPx = digitHeightPx + digitMarginBottomPx;
    const digitHeightEm = totalDigitHeightPx / fontSizePx;
    const boxHeightEm = boxHeightPx / fontSizePx;
    
    const width = window.innerWidth;
    let breakpoint = 'DESKTOP';
    if (width <= 479) breakpoint = 'MOBILE (≤479px)';
    else if (width <= 767) breakpoint = 'TABLET (480-767px)';
    
    console.log(`${breakpoint} Debug Info:`);
    console.log(`  Digit height: ${digitHeightPx.toFixed(2)}px + margin: ${digitMarginBottomPx.toFixed(2)}px = ${totalDigitHeightPx.toFixed(2)}px`);
    console.log(`  Digit height in em: ${digitHeightEm.toFixed(3)}em`);
    console.log(`  Box height: ${boxHeightPx.toFixed(2)}px = ${boxHeightEm.toFixed(3)}em`);
    console.log(`  Font size: ${fontSizePx.toFixed(2)}px`);
    console.log(`  Current config STEP_HEIGHT_EM: ${getCurrentStepHeight().toFixed(3)}em`);
    console.log(`  Suggested: Use box height (${boxHeightEm.toFixed(3)}em) or digit height (${digitHeightEm.toFixed(3)}em)`);
    
    return {
      digitHeightEm: digitHeightEm,
      boxHeightEm: boxHeightEm,
      currentConfig: getCurrentStepHeight()
    };
  };
  
  ///////////////////////////
  // GLOBAL STATE
  ///////////////////////////
  
  let isAnimating = false;
  
  ///////////////////////////
  // SETUP: Clone digits to create long seamless strip
  ///////////////////////////
  
  function setupSeamlessScrolling() {
    if (typeof gsap === 'undefined') return;
    
    const digitBoxes = document.querySelectorAll('.digit-box');
  
    digitBoxes.forEach((box) => {
      const wheel = box.querySelector('.digit-wheel');
      if (!wheel) return;
  
      const originals = Array.from(wheel.children);
  
      // Clone the base set many times
      for (let r = 0; r < ROLL_CONFIG.STRIP_REPEATS; r++) {
        originals.forEach((node) => wheel.appendChild(node.cloneNode(true)));
      }
  
      // After cloning, set the wheel so "0" is showing by default
      const nodes = wheel.querySelectorAll('.digit');
      const n = 10; // 0-9 digits
  
      // Find the index of '0' inside the ORIGINAL SET (within first n items)
      let initialIndex = 0;
      for (let i = 0; i < n; i++) {
        const v = nodes[i].getAttribute('data-value');
        if (v === '0') {
          initialIndex = i;
          break;
        }
      }
  
      const stepHeight = getCurrentStepHeight();
      const initialYEm = -(initialIndex * stepHeight);
      gsap.set(wheel, { y: initialYEm + 'em' });
    });
  }
  
  ///////////////////////////
  // SETUP: will-change hint
  ///////////////////////////
  
  function optimizeWheels() {
    const digitBoxes = document.querySelectorAll('.digit-box');
    digitBoxes.forEach(box => {
      const wheel = box.querySelector('.digit-wheel');
      if (wheel) {
        wheel.style.willChange = 'transform'; // GPU hint
      }
    });
  }
  
  ///////////////////////////
  // LOGIC HELPERS
  ///////////////////////////
  
  // Each wheel has 10 base steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  function originalCountForPosition(pos) {
    return 10;
  }
  
  // Find the index (within the ORIGINAL SET, i.e. first 10 children) for the value we want to land on
  function indexOfValueInOriginals(wheel, value) {
    const n = 10;
    const nodes = wheel.querySelectorAll('.digit');
  
    for (let i = 0; i < n; i++) {
      const v = nodes[i].getAttribute('data-value');
      if (String(value) === v) return i;
    }
    return 0;
  }
  
  // Return the target digits for 404: [4, 0, 4]
  function get404Targets() {
    return [4, 0, 4];
  }
  
  ///////////////////////////
  // ANIMATION CORE
  ///////////////////////////
  
  function animateWheel(box, pos, targetValue, startDelay) {
    if (typeof gsap === 'undefined') return;
    
    const wheel = box.querySelector('.digit-wheel');
    const perSet = originalCountForPosition(pos);
    const { MIN_SPINS, MAX_SPINS, BASE_DURATION, DURATION_INCREMENT, EASE } = ROLL_CONFIG;
    const STEP_HEIGHT_EM = getCurrentStepHeight();
    
    // Current translateY in px -> convert to em
    const currentY = gsap.getProperty(wheel, 'y');
    const fontSize = parseFloat(getComputedStyle(wheel).fontSize);
    const currentYEm = parseFloat(currentY) / fontSize;
    
    // Which logical index are we "showing" now?
    const currentIndex = Math.abs(Math.round(currentYEm / STEP_HEIGHT_EM)) % perSet;
    
    // Where is our target in the base set?
    const targetIndex = indexOfValueInOriginals(wheel, targetValue);
    
    // Steps forward to get from currentIndex -> targetIndex
    let forwardSteps = (targetIndex - currentIndex + perSet) % perSet;
    
    // Random extra full rotations (for drama)
    const spins = MIN_SPINS + Math.floor(Math.random() * (MAX_SPINS - MIN_SPINS + 1));
    
    const totalSteps = spins * perSet + forwardSteps;
    const travelDistance = totalSteps * STEP_HEIGHT_EM;
    const finalYEm = currentYEm - travelDistance;
    
    // Staggered durations: columns to the right land later
    const duration = BASE_DURATION + (pos * DURATION_INCREMENT);
    
    // Kill any existing tween on this wheel before starting a new one
    gsap.killTweensOf(wheel);
    
    // Two-phase animation:
    // 1) fast linear spin ~85%
    // 2) slow eased settle ~15%
    const tl = gsap.timeline({ delay: startDelay });
    
    const fastDuration = duration * 0.85;
    const slowDuration = duration * 0.15;
    const fastTargetYEm = currentYEm + (finalYEm - currentYEm) * 0.95;
    
    // Phase 1: fast spin
    tl.to(wheel, {
      y: fastTargetYEm + 'em',
      duration: fastDuration,
      ease: 'none'
    });
    
    // Phase 2: slow ease-in to exact alignment
    tl.to(wheel, {
      y: finalYEm + 'em',
      duration: slowDuration,
      ease: EASE,
      onComplete: function() {
        // Ensure perfect alignment by recalculating final position
        const targetIndex = indexOfValueInOriginals(wheel, targetValue);
        const preciseYEm = -(targetIndex * STEP_HEIGHT_EM);
        gsap.set(wheel, { y: preciseYEm + 'em' });
      }
    });
  }
  
  ///////////////////////////
  // RUNNING THE WHOLE SEQUENCE
  ///////////////////////////
  
  function startAnimationWithTargets(targets) {
    const digitBoxes = Array.from(document.querySelectorAll('.digit-box'));
    
    // Reset any visual overrides from previous runs
    document.querySelectorAll('.digit-wheel .digit').forEach(el => {
      el.style.opacity = '';
      el.style.color = '';
      el.style.textShadow = '';
    });
    
    // Spin each wheel toward its target
    digitBoxes.forEach((box, i) => {
      const startDelay = i * ROLL_CONFIG.STAGGER_DELAY;
      animateWheel(box, i, targets[i], startDelay);
    });
    
    // Figure out when the WHOLE sequence will be done
    const lastWheelDuration = ROLL_CONFIG.BASE_DURATION + ((digitBoxes.length - 1) * ROLL_CONFIG.DURATION_INCREMENT);
    const lastWheelDelay = (digitBoxes.length - 1) * ROLL_CONFIG.STAGGER_DELAY;
    const totalDuration = (lastWheelDuration + lastWheelDelay) * 1000;
    
    // After it's done, unlock and remove will-change to save perf
    setTimeout(() => {
      isAnimating = false;
      digitBoxes.forEach(box => {
        const wheel = box.querySelector('.digit-wheel');
        if (wheel) wheel.style.willChange = 'auto';
      });
    }, totalDuration + 100);
  }
  
  // Start the 404 animation
  function startAnimation() {
    if (typeof gsap === 'undefined') return;
    if (isAnimating) return;
    isAnimating = true;
    
    // kill any in-flight tweens first
    const wheels = document.querySelectorAll('.digit-wheel');
    wheels.forEach(wheel => gsap.killTweensOf(wheel));
    
    const targets = get404Targets(); // [4, 0, 4]
    startAnimationWithTargets(targets);
  }
  
  ///////////////////////////
  // RESPONSIVE BEHAVIOR
  ///////////////////////////
  
  function getCurrentBreakpoint() {
    const width = window.innerWidth;
    if (width <= 479) return 'mobile';
    if (width <= 767) return 'tablet';
    return 'desktop';
  }
  
  let lastBreakpoint = getCurrentBreakpoint();
  
  // Align all wheels so "0" is visible again, based on the *current* step height
  function resetWheelsToInitial() {
    if (typeof gsap === 'undefined') return;
    
    const digitBoxes = document.querySelectorAll('.digit-box');
    const stepHeight = getCurrentStepHeight();
  
    digitBoxes.forEach((box) => {
      const wheel = box.querySelector('.digit-wheel');
      if (!wheel) return;
  
      const nodes = wheel.querySelectorAll('.digit');
      const n = 10;
      let initialIndex = 0;
  
      // Find the '0' digit index from the "original set"
      for (let i = 0; i < n; i++) {
        const v = nodes[i].getAttribute('data-value');
        if (v === '0') { initialIndex = i; break; }
      }
  
      const initialYEm = -(initialIndex * stepHeight);
      gsap.set(wheel, { y: initialYEm + 'em' });
    });
  }
  
  // When breakpoint changes, reset wheels and replay animation
  window.addEventListener('resize', () => {
    if (typeof gsap === 'undefined') return;
    
    const currentBreakpoint = getCurrentBreakpoint();
  
    if (currentBreakpoint !== lastBreakpoint) {
      lastBreakpoint = currentBreakpoint;
      
      gsap.killTweensOf('.digit-wheel');
      resetWheelsToInitial();
      isAnimating = false; // allow replay
      setTimeout(() => startAnimation(), 50);
    }
  });
  
  ///////////////////////////
  // INIT ON LOAD
  ///////////////////////////
  
  function init404Animation() {
    // Check if GSAP is available
    if (typeof gsap === 'undefined') {
      console.warn('GSAP ikke tilgængelig - 404 animation kan ikke køre');
      return;
    }
    
    optimizeWheels();
    setupSeamlessScrolling();
    // Start animation immediately on page load
    startAnimation();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init404Animation);
  } else {
    init404Animation();
  }
});
}
</script>
