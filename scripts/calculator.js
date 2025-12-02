<script>
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
  
  ///////////////////////////
  // STEP HEIGHT DEBUG
  ///////////////////////////
  
  // Auto-calculate step height from actual DOM element to tune config.
  // Call window.calculateStepHeight() in console to inspect.
  function calculateStepHeightFromDOM() {
    const digit = document.querySelector('.digit');
    if (!digit) return null;
    
    const computed = getComputedStyle(digit);
    const heightPx = parseFloat(computed.height);
    const marginBottomPx = parseFloat(computed.marginBottom) || 0;
    const fontSizePx = parseFloat(computed.fontSize);
    
    const totalHeightPx = heightPx + marginBottomPx;
    const heightEm = totalHeightPx / fontSizePx;
    
    const width = window.innerWidth;
    let breakpoint = 'DESKTOP';
    let configKey = 'STEP_HEIGHT_EM';
    
    if (width <= 479) {
      breakpoint = 'MOBILE (≤479px)';
      configKey = 'STEP_HEIGHT_EM_MOBILE';
    } else if (width <= 767) {
      breakpoint = 'TABLET (480-767px)';
      configKey = 'STEP_HEIGHT_EM_TABLET';
    }
    
    console.log(`${breakpoint} .digit height: ${heightPx.toFixed(3)}px + margin: ${marginBottomPx.toFixed(3)}px = ${totalHeightPx.toFixed(3)}px`);
    console.log(`In em units: ${totalHeightPx.toFixed(3)}px ÷ ${fontSizePx.toFixed(3)}px = ${heightEm.toFixed(3)}em`);
    console.log(`Set ${configKey}: ${heightEm.toFixed(2)}`);
    
    return heightEm;
  }
  window.calculateStepHeight = calculateStepHeightFromDOM;
  
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
  
  ///////////////////////////
  // GLOBAL STATE
  ///////////////////////////
  
  let isAnimating = false;
  
  ///////////////////////////
  // SETUP 1: Inject consistent "empty" spacer step
  ///////////////////////////
  
  /*
  We want EVERY numeric wheel (thousands, hundreds, tens, ones, decimals) to
  have the same first child: an invisible "empty" digit step.
  
  Only the comma wheel (pos === 5) is special: it does NOT get that "empty",
  it just has [0..9, comma].
  
  Result:
  - All numeric wheels share the same structure length (11 steps).
  - The visual alignment is consistent across all columns.
  */
  function setupEmptyDigits() {
    const digitBoxes = document.querySelectorAll('.digit-box');
    digitBoxes.forEach(box => {
      const pos = parseInt(box.dataset.position, 10);
      const wheel = box.querySelector('.digit-wheel');
      if (!wheel) return;
  
      // Skip ONLY the comma wheel at position 5.
      if (pos === 5) return;
  
      // Check if we already have an "empty" at the top for this wheel.
      let emptyDigit = wheel.querySelector('.digit[data-value="empty"]');
  
      if (!emptyDigit) {
        // Create invisible spacer step
        emptyDigit = document.createElement('div');
        emptyDigit.className = 'digit';
        emptyDigit.setAttribute('data-value', 'empty');
        emptyDigit.textContent = '0'; // doesn't matter, we'll hide it
        emptyDigit.style.color = 'transparent';
        emptyDigit.style.textShadow = 'none';
  
        // Insert as the first child so index 0 is always this spacer
        wheel.insertBefore(emptyDigit, wheel.firstChild);
      } else {
        // Make sure it's visually invisible
        emptyDigit.style.color = 'transparent';
        emptyDigit.style.textShadow = 'none';
      }
    });
  }
  
  ///////////////////////////
  // SETUP 2: Clone digits to create long seamless strip
  ///////////////////////////
  
  /*
  We take each wheel's initial children (now including our injected "empty" step,
  plus 0..9, and possibly comma). Then we clone that sequence STRIP_REPEATS times
  so GSAP can translate it a long distance and it looks like an endlessly rolling reel.
  */
  function setupSeamlessScrolling() {
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
      const pos = parseInt(box.dataset.position, 10);
      let initialIndex = 0;
      const nodes = wheel.querySelectorAll('.digit');
      const n = originalCountForPosition(pos);
  
      // Find the index of '0' inside the ORIGINAL SET (within first n items)
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
  // SETUP 3: will-change hint
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
  
  /*
  All wheels now effectively have 11 base steps:
  
  - For numeric wheels (pos !== 5):
      [empty, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]  -> 11 items
  
  - For comma wheel (pos === 5):
      [0,1,2,3,4,5,6,7,8,9,comma]            -> also 11 items
  
  So we can safely say "11" for all wheels.
  */
  function originalCountForPosition(pos) {
    return 11;
  }
  
  /*
  Find the index (within that ORIGINAL SET, i.e. first `n` children)
  for the value we want to land on.
  - Numeric wheels (pos !== 5): values are 'empty' or 0-9
  - Comma wheel (pos === 5): values are 0-9 or ',' (which matches data-value="comma")
  */
  function indexOfValueInOriginals(wheel, value, pos) {
    const n = originalCountForPosition(pos);
    const nodes = wheel.querySelectorAll('.digit');
  
    for (let i = 0; i < n; i++) {
      const v = nodes[i].getAttribute('data-value');
  
      if (pos === 5) {
        // special comma wheel
        if (value === ',' && v === 'comma') return i;
        if (String(value) === v) return i;
      } else {
        // all numeric wheels, which now ALL include 'empty'
        if (value === 'empty' && v === 'empty') return i;
        if (String(value) === v) return i;
      }
    }
    return 0;
  }
  
  function numberToDisplayArray(numberString) {
    // "1421,43" => before="1421", after="43"
    const parts = numberString.split(',');
    const before = parts[0];
    const after = parts[1] || '00';
  
    const out = [];
  
    // integer side
    const digits = before.split('').map(d => parseInt(d, 10));
    const emptyCount = Math.max(0, 5 - digits.length); // we show up to 5 slots before comma
  
    for (let i = 0; i < emptyCount; i++) {
      out.push('empty');
    }
    digits.forEach(d => out.push(d));
  
    // comma
    out.push(',');
  
    // decimals (exactly two)
    const afterDigits = after.padEnd(2, '0');
    out.push(parseInt(afterDigits[0], 10));
    out.push(parseInt(afterDigits[1], 10));
  
    return out;
  }
  
  /*
  Read the number from data attributes on .calculator-container
  and normalize it to Danish format "1234,56".
  */
  function getConfiguredAmount(root) {
    const el = root || document.querySelector('.calculator-container');
    const raw = (el && (
      el.getAttribute('data-value') ||
      el.getAttribute('data-number') ||
      el.getAttribute('data-amount') ||
      el.getAttribute('data-spin')
    )) || '';
  
    const cleaned = String(raw).trim();
    if (!cleaned) return '1421,43';
  
    // normalize "1.234,56", "1234.56", "1234,56", etc → float
    const normalized = cleaned
      .replace(/\s/g, '')
      .replace(/,/g, '.')
      .replace(/[^0-9.\-]/g, '');
  
    const n = parseFloat(normalized);
    if (Number.isNaN(n) || !Number.isFinite(n)) return '1421,43';
  
    // convert back to Danish format with comma
    return n.toFixed(2).replace('.', ',');
  }
  
  ///////////////////////////
  // TEMP VISUAL MOD CLEANUP
  ///////////////////////////
  
  function resetTempMods() {
    document.querySelectorAll('.digit[data-temp="1"]').forEach(el => {
      // restore previous text/value/styles if we temporarily blanked it
      el.textContent = el.dataset.prevText == null ? el.textContent : el.dataset.prevText;
      const pv = el.dataset.prevValue;
      if (pv != null) el.setAttribute('data-value', pv);
      el.style.color = el.dataset.prevColor || '';
      el.style.textShadow = el.dataset.prevShadow || '';
  
      el.removeAttribute('data-temp');
      el.removeAttribute('data-prev-text');
      el.removeAttribute('data-prev-value');
      el.removeAttribute('data-prev-color');
      el.removeAttribute('data-prev-shadow');
    });
  }
  
  // This was used for doing a last-step blank swap. We currently don't
  // actually call animateWheel with blankAtEnd=true, but we keep it
  // in case you want that effect later.
  function makeTempStepChild(wheel, childIndex) {
    const kids = wheel.children;
    if (childIndex >= kids.length) return null;
    
    const el = kids[childIndex];
    el.dataset.temp = '1';
    el.dataset.prevText = el.textContent;
    el.dataset.prevValue = el.getAttribute('data-value') || '';
    el.dataset.prevColor = el.style.color || '';
    el.dataset.prevShadow = el.style.textShadow || '';
    
    el.setAttribute('data-value', 'empty');
    el.style.color = 'transparent';
    el.style.textShadow = 'none';
    
    return el;
  }
  
  ///////////////////////////
  // ANIMATION CORE
  ///////////////////////////
  
  /*
  animateWheel()
  - box: the .digit-box for this column
  - pos: which column (0..7 etc.)
  - targetValue: what we want to land on ('empty', ',', 0..9)
  - startDelay: stagger between columns
  - blankAtEnd: optional effect where we hide the last flip (currently not used)
  */
  function animateWheel(box, pos, targetValue, startDelay, blankAtEnd = false) {
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
    const targetIndex = indexOfValueInOriginals(wheel, targetValue, pos);
    
    // Steps forward to get from currentIndex -> targetIndex
    let forwardSteps = (targetIndex - currentIndex + perSet) % perSet;
    
    // Special case: for comma wheel, force at least one full spin even if
    // we were "already" on the comma. This keeps the comma from just snapping.
    if (pos === 5 && forwardSteps === 0) {
      forwardSteps = perSet;
    }
    
    // Random extra full rotations (for drama)
    const spins = MIN_SPINS + Math.floor(Math.random() * (MAX_SPINS - MIN_SPINS + 1));
    
    // Optional "blank at end" extra step logic (not active by default)
    let extraStep = 0;
    if (blankAtEnd && pos !== 5) {
      extraStep = 1;
      const stepsBeforeExtra = spins * perSet + forwardSteps;
      const idx = (currentIndex + stepsBeforeExtra + 1) % wheel.children.length;
      makeTempStepChild(wheel, idx);
    }
    
    const totalSteps = spins * perSet + forwardSteps + extraStep;
    const travelDistance = totalSteps * STEP_HEIGHT_EM;
    const finalYEm = currentYEm - travelDistance;
    
    // Staggered durations: columns to the right land later
    const duration = BASE_DURATION + (pos * DURATION_INCREMENT);
    
    // Kill any existing tween on this wheel before starting a new one
    gsap.killTweensOf(wheel);
    
    // We'll optionally hide the "visible" digit during the last tiny ease-in
    let alreadyHidden = false;
    const HIDE_THRESHOLD_EM = 1.5 * STEP_HEIGHT_EM;
    
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
      onUpdate: blankAtEnd ? function() {
        if (alreadyHidden) return;
        
        // Check distance left in em
        const currentAnimY = gsap.getProperty(wheel, 'y');
        const currentAnimYEm = parseFloat(currentAnimY) / fontSize;
        const distanceLeft = Math.abs(finalYEm - currentAnimYEm);
        
        if (distanceLeft <= HIDE_THRESHOLD_EM) {
          // Find the digit currently most centered in this box and hide it
          const allDigits = wheel.querySelectorAll('.digit');
          let visibleDigit = null;
          let minDist = Infinity;
          
          allDigits.forEach(digit => {
            const rect = digit.getBoundingClientRect();
            const boxRect = box.getBoundingClientRect();
            const digitCenter = rect.top + rect.height / 2;
            const boxCenter = boxRect.top + boxRect.height / 2;
            const dist = Math.abs(digitCenter - boxCenter);
            if (dist < minDist) {
              minDist = dist;
              visibleDigit = digit;
            }
          });
          
          if (visibleDigit) {
            visibleDigit.style.color = 'transparent';
            visibleDigit.style.textShadow = 'none';
            alreadyHidden = true;
          }
        }
      } : null
    });
  }
  
  ///////////////////////////
  // RUNNING THE WHOLE SEQUENCE
  ///////////////////////////
  
  function startAnimationWithTargets(targets, root) {
    const scope = root || document;
    const digitBoxes = Array.from(scope.querySelectorAll('.digit-box'));
    
    // Reset any temp visual overrides from previous runs
    document.querySelectorAll('.digit-wheel .digit').forEach(el => {
      el.style.opacity = '';
      // Don't re-color permanent "empty" spacers unless they were temp-modded
      if (el.getAttribute('data-value') !== 'empty' || el.dataset.temp === '1') {
        el.style.color = '';
        el.style.textShadow = '';
      }
    });
    resetTempMods();
    
    // Spin each wheel toward its target
    digitBoxes.forEach((box, i) => {
      const startDelay = i * ROLL_CONFIG.STAGGER_DELAY;
      animateWheel(box, i, targets[i], startDelay, false /* blankAtEnd disabled */);
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
  
  /*
  Public-ish entry point:
  Reads the configured amount (data-value / data-amount / etc),
  converts it to targets, and starts the roll.
  */
  function startAnimation(root) {
    if (isAnimating) return;
    isAnimating = true;
    
    // kill any in-flight tweens first
    const wheels = document.querySelectorAll('.digit-wheel');
    wheels.forEach(wheel => gsap.killTweensOf(wheel));
    
    const configured = getConfiguredAmount(root);      // e.g. "1421,43"
    const fixedTargets = numberToDisplayArray(configured); // -> ['empty','empty',1,4,2,',',4,3]
    startAnimationWithTargets(fixedTargets, root);
  }
  
  ///////////////////////////
  // SCROLLTRIGGER HOOKUP
  ///////////////////////////
  
  function setupGSAPScrollTrigger() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP eller ScrollTrigger ikke tilgængelig');
      return;
    }
    
    gsap.registerPlugin(ScrollTrigger);
    
    const containers = Array.from(document.querySelectorAll('.calculator-container'));
    if (containers.length === 0) {
      console.warn('Calculator container ikke fundet');
      return;
    }
  
    containers.forEach((container, idx) => {
      ScrollTrigger.create({
        id: `calculator-trigger-${idx}`,
        trigger: container,
        start: 'top 80%',
        end: 'bottom 30%',
        markers: false,  // remove when you're done debugging
        once: true,
        onEnter: () => {
          startAnimation(container);
        }
      });
    });
  }
  
  ///////////////////////////
  // RESPONSIVE BEHAVIOR
  ///////////////////////////
  
  let lastBreakpoint = getCurrentBreakpoint();
  
  function getCurrentBreakpoint() {
    const width = window.innerWidth;
    if (width <= 479) return 'mobile';
    if (width <= 767) return 'tablet';
    return 'desktop';
  }
  
  // Align all wheels so "0" is visible again, based on the *current* step height.
  // This is called e.g. after a breakpoint change.
  function resetWheelsToInitial(root) {
    const scope = root || document;
    const digitBoxes = scope.querySelectorAll('.digit-box');
    const stepHeight = getCurrentStepHeight();
  
    digitBoxes.forEach((box) => {
      const wheel = box.querySelector('.digit-wheel');
      if (!wheel) return;
  
      const pos = parseInt(box.dataset.position, 10);
      const nodes = wheel.querySelectorAll('.digit');
      const n = originalCountForPosition(pos);
      let initialIndex = 0;
  
      // again: pick the '0' digit index from the "original set" of this wheel
      for (let i = 0; i < n; i++) {
        const v = nodes[i].getAttribute('data-value');
        if (v === '0') { initialIndex = i; break; }
      }
  
      const initialYEm = -(initialIndex * stepHeight);
      gsap.set(wheel, { y: initialYEm + 'em' });
    });
  }
  
  // Check if calculator is ~20% visible in viewport (just a helper if you need it)
  function isCalculatorInView(el) {
    if (!el) el = document.querySelector('.calculator-container');
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const overlap = Math.min(vh, rect.bottom) - Math.max(0, rect.top);
    return overlap > vh * 0.2;
  }
  
  // When breakpoint changes (mobile ↔ tablet ↔ desktop),
  // we recalc step height, reset wheels, refresh ScrollTrigger,
  // and immediately replay the animation.
  window.addEventListener('resize', () => {
    const currentBreakpoint = getCurrentBreakpoint();
  
    if (currentBreakpoint !== lastBreakpoint) {
      lastBreakpoint = currentBreakpoint;
      
      gsap.killTweensOf('.digit-wheel');
      resetTempMods();
  
      document.querySelectorAll('.calculator-container').forEach((container) => {
        resetWheelsToInitial(container);
      });
  
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
  
      isAnimating = false; // allow replay
      document.querySelectorAll('.calculator-container').forEach((container) => {
        setTimeout(() => startAnimation(container), 50);
      });
    }
  });
  
  ///////////////////////////
  // INIT ON LOAD
  ///////////////////////////

  
function initSlotAnimation() {
  setupEmptyDigits();
  optimizeWheels();
  setupSeamlessScrolling();
  setupGSAPScrollTrigger();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSlotAnimation);
} else {
  initSlotAnimation();
}
  });
</script>