// GSAP version – replicates Webflow Interactions (a/a-2 open, a-3/a-4 close)
(function () {
  function start() {
    const gsapRef = window.gsap;

    // Fallback: hvis GSAP mangler, brug simpel toggle af body-klasse
    if (!gsapRef) {
      document.addEventListener('click', (e) => {
        if (e.target.closest('.menu-button')) { e.preventDefault(); document.body.classList.toggle('is-menu-open'); }
        if (e.target.closest('.close-button') || e.target.closest('.side-menu-overlay')) { e.preventDefault(); document.body.classList.remove('is-menu-open'); }
      });
      return;
    }

    const qs = (s) => document.querySelector(s);
    const menuBtn = qs('.menu-button');
    const overlay = qs('.side-menu-overlay');
    const bg = qs('.side-menu-background');
    const panel = qs('.side-menu_component');
    if (!menuBtn || !bg || !panel || !overlay) return;

    const isTiny = () => window.matchMedia('(max-width: 479px)').matches;
    let openTl, closeTl, open = false, currentTiny = isTiny();

    function baseInit() {
      gsapRef.set([overlay, panel, bg].filter(Boolean), { clearProps: 'all' });
      gsapRef.set(overlay, { opacity: 0, pointerEvents: 'none' });
      gsapRef.set(panel, { opacity: 0, display: 'none', visibility: 'visible', width: currentTiny ? '100%' : '28rem' });
      gsapRef.set(bg, { xPercent: currentTiny ? 120 : 130, rotation: currentTiny ? -5 : -7 });
    }

    function buildTimelines() {
      if (openTl) openTl.kill();
      if (closeTl) closeTl.kill();

      baseInit();
      requestAnimationFrame(baseInit);
      setTimeout(baseInit, 50);

      // ÅBN timeline – alting starter samtidig for maksimal sync
      openTl = gsapRef.timeline({ paused: true, overwrite: 'auto' });
      openTl
        .set(panel, { display: 'flex' }, 0)
        .add(() => { gsapRef.set(overlay, { pointerEvents: 'auto' }); }, 0)
        .to(bg, { xPercent: 0, rotation: 0, duration: 0.9, ease: 'cubic-bezier(0.45, 0.2, 0.1, 1)' }, 0)
        .to(panel, { opacity: 1, duration: 0.35, ease: 'power1.out' }, 0)
        .to(overlay, { opacity: 1, duration: 0.35, ease: 'power1.out' }, 0);

      // LUK timeline – samtidig ud
      closeTl = gsapRef.timeline({ paused: true, overwrite: 'auto', onComplete: () => {
        gsapRef.set(panel, { display: 'none' });
        gsapRef.set(overlay, { pointerEvents: 'none' });
        gsapRef.set(bg, { xPercent: currentTiny ? 120 : 130, rotation: currentTiny ? -5 : -7 });
      }});
      closeTl
        .add(() => { gsapRef.set(overlay, { pointerEvents: 'none' }); }, 0)
        .to(bg, { xPercent: currentTiny ? 120 : 165, rotation: currentTiny ? -5 : -20, duration: 0.4, ease: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)' }, 0)
        .to(panel, { opacity: 0, duration: 0.28, ease: 'power1.in' }, 0)
        .to(overlay, { opacity: 0, duration: 0.2, ease: 'power1.in' }, 0)
        .to(panel, { width: '0', duration: 0.45, ease: 'cubic-bezier(0.895, 0.007, 0.596, 0.603)' }, 0);
    }

    function playOpen() { if (openTl && openTl.isActive()) return; if (closeTl) closeTl.kill(); baseInit(); open = true; openTl.restart(true); }
    function playClose() { if (closeTl && closeTl.isActive()) return; if (openTl) openTl.kill(); open = false; closeTl.restart(true); }
    function toggle() { open ? playClose() : playOpen(); }

    function handleResize() { const tinyNow = isTiny(); if (tinyNow !== currentTiny) { currentTiny = tinyNow; buildTimelines(); } }

    buildTimelines();

    menuBtn.addEventListener('click', (e) => { e.preventDefault(); if (e.stopImmediatePropagation) e.stopImmediatePropagation(); e.stopPropagation(); toggle(); });
    document.addEventListener('click', (e) => {
      if (e.target.closest('.close-button')) { e.preventDefault(); e.stopPropagation(); if (open) playClose(); }
      if (e.target.closest('.side-menu-overlay')) { e.preventDefault(); e.stopPropagation(); if (open) playClose(); }
    });
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); } else { start(); }
})();


