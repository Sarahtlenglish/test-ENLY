

// ============================================
// SIDE MENU NAVIGATION
// ============================================
  (function () {
    function start() {
      const gsapRef = window.gsap;

      if (!gsapRef) {
        document.addEventListener('click', (e) => {
          if (e.target.closest('[data-wf--menu-button--variant="nav-btn"]')) { 
            e.preventDefault(); 
            document.body.classList.toggle('is-menu-open'); 
          }
          if (e.target.closest('.side-menu-overlay')) { 
            e.preventDefault(); 
            document.body.classList.remove('is-menu-open'); 
          }
        });
        return;
      }

      const qs = (s) => document.querySelector(s);
      const qsa = (s) => Array.from(document.querySelectorAll(s));

      const navBtns = qsa('[data-wf--menu-button--variant="nav-btn"]');
      const closeBtns = qsa('.side-menu_close, [data-close-menu], .btn-close-menu');
      const overlay = qs('.side-menu-overlay');
      const bg = qs('.side-menu-background');
      const panel = qs('.side-menu_component');
      const wrapper = qs('.side-menu-wrapper');
      const navWrapper = qs('.side-menu-navigation_wrapper');
      const flexHWrapper = qs('.side-menu-item-wrapper.flex-h');
      const textItems = qsa('.side-menu-text-wrap');
      
      if (!navBtns.length || !panel || !overlay) return;

      const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
      const isTiny = () => window.matchMedia('(max-width: 479px)').matches;
      const sidebarEasing = 'elastic.out(1, 0.75)';
      
      let openTl, closeTl, open = false, currentMobile = isMobile(), currentTiny = isTiny();

      function baseInit() {
        const elementsToClear = [overlay, ...textItems].filter(Boolean);
        if (bg) elementsToClear.push(bg);
        if (wrapper) elementsToClear.push(wrapper);
        if (flexHWrapper) elementsToClear.push(flexHWrapper);
        gsapRef.set(elementsToClear, { clearProps: 'all' });
        gsapRef.set(overlay, { opacity: 0, pointerEvents: 'none' });
        
        if (currentMobile) {
          gsapRef.set(panel, { opacity: 0, visibility: 'hidden', pointerEvents: 'none' });
          if (wrapper) gsapRef.set(wrapper, { opacity: 0 });
          if (flexHWrapper) gsapRef.set(flexHWrapper, { opacity: 0 });
          if (navWrapper) {
            gsapRef.set(navWrapper, { y: window.innerHeight });
          }
          gsapRef.set(textItems, { autoAlpha: 0, y: 12 });
        } else {
          gsapRef.set(panel, { x: '100%', visibility: 'hidden', pointerEvents: 'none' });
          if (bg) gsapRef.set(bg, { x: '100%', opacity: 0, visibility: 'hidden' });
        }
      }

      function buildTimelines() {
        if (openTl) openTl.kill();
        if (closeTl) closeTl.kill();
        baseInit();

        if (currentMobile) {
          openTl = gsapRef.timeline({ paused: true, overwrite: 'auto' });
          openTl
            .set(panel, { display: 'block', visibility: 'visible', pointerEvents: 'auto' }, 0)
            .set(overlay, { display: 'block', visibility: 'visible' }, 0)
            .set(document.body, { overflow: 'hidden' }, 0)
            .to(overlay, { opacity: 1, visibility: 'visible', duration: 0.3, ease: 'power1.out' }, 0)
            .to(panel, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 0);
          
          if (flexHWrapper) {
            openTl.to(flexHWrapper, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 0);
          }
          
          if (navWrapper) {
            openTl.to(navWrapper, { y: 0, duration: 0.8, ease: sidebarEasing }, 0);
          }

          closeTl = gsapRef.timeline({ paused: true, overwrite: 'auto', onComplete: () => {
            gsapRef.set(panel, { display: 'none', opacity: 0, visibility: 'hidden', pointerEvents: 'none' });
            gsapRef.set(overlay, { display: 'none', pointerEvents: 'none' });
            gsapRef.set(document.body, { overflow: '' });
            if (flexHWrapper) gsapRef.set(flexHWrapper, { opacity: 0 });
            if (navWrapper) {
              gsapRef.set(navWrapper, { y: window.innerHeight });
            }
          }});
          
          closeTl
            .to(panel, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 0);
          
          if (flexHWrapper) {
            closeTl.to(flexHWrapper, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 0);
          }
          
          if (navWrapper) {
            closeTl.to(navWrapper, { y: window.innerHeight, duration: 0.8, ease: sidebarEasing }, 0);
          }
          
          closeTl.to(overlay, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 0);
        } else {
          openTl = gsapRef.timeline({ paused: true, overwrite: 'auto' });
          openTl
            .set(panel, { display: 'block', visibility: 'visible', pointerEvents: 'auto' }, 0)
            .set(overlay, { display: 'block', visibility: 'visible' }, 0)
            .set(bg, { display: 'block', visibility: 'visible' }, 0)
            .set(document.body, { overflow: 'hidden' }, 0)
            .to(overlay, { opacity: 1, visibility: 'visible', duration: 0.3, ease: 'power1.out' }, 0)
            .to(panel, { x: 0, duration: 0.8, ease: sidebarEasing }, 0)
            .to(bg, { x: 0, opacity: 1, duration: 0.8, ease: sidebarEasing }, 0);

          closeTl = gsapRef.timeline({ paused: true, overwrite: 'auto', onComplete: () => {
            gsapRef.set(panel, { display: 'none', visibility: 'hidden', pointerEvents: 'none' });
            gsapRef.set(overlay, { display: 'none', pointerEvents: 'none' });
            gsapRef.set(document.body, { overflow: '' });
            if (bg) gsapRef.set(bg, { display: 'none', x: '100%', opacity: 0, visibility: 'hidden' });
          }});
          
          closeTl
            .to(panel, { x: '100%', duration: 0.8, ease: sidebarEasing }, 0)
            .to(bg, { x: '100%', opacity: 0, duration: 0.8, ease: sidebarEasing }, 0)
            .to(overlay, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 0);
        }
      }

      function playOpen() { 
        if (openTl && openTl.isActive()) return; 
        if (closeTl) closeTl.kill(); 
        
        if (currentMobile) {
          gsapRef.set(panel, { opacity: 0, visibility: 'visible', pointerEvents: 'auto' });
          if (wrapper) gsapRef.set(wrapper, { opacity: 1 });
          if (flexHWrapper) gsapRef.set(flexHWrapper, { opacity: 0 });
          if (navWrapper) {
            gsapRef.set(navWrapper, { y: window.innerHeight });
          }
          gsapRef.set(textItems, { autoAlpha: 0, y: 12 });
        } else {
          baseInit();
        }
        
        open = true;
        openTl.restart(true); 
      }
      
      function playClose() { 
        if (closeTl && closeTl.isActive()) return; 
        if (openTl) openTl.kill(); 
        open = false;
        closeTl.restart(true); 
      }

      function handleResize() { 
        const mobileNow = isMobile();
        const tinyNow = isTiny(); 
        
        if (mobileNow !== currentMobile || tinyNow !== currentTiny) { 
          if (openTl) openTl.kill();
          if (closeTl) closeTl.kill();
          
          open = false;
          
          gsapRef.set(document.body, { overflow: '' });
          
          const elementsToClear = [panel, overlay, ...textItems].filter(Boolean);
          if (bg) elementsToClear.push(bg);
          if (wrapper) elementsToClear.push(wrapper);
          if (navWrapper) elementsToClear.push(navWrapper);
          if (flexHWrapper) elementsToClear.push(flexHWrapper);
          
          gsapRef.set(elementsToClear, { clearProps: 'all' });
          
          currentMobile = mobileNow;
          currentTiny = tinyNow;
          
          baseInit(); 
          buildTimelines(); 
        } 
      }

      buildTimelines();

      navBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const insideSideMenu = !!e.currentTarget.closest('.side-menu_component');
          if (insideSideMenu) {
            if (open) playClose();
          } else {
            if (!open) playOpen();
          }
        });
      });

      closeBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (open) playClose();
        });
      });

      overlay.addEventListener('click', (e) => {
        e.preventDefault(); 
        e.stopPropagation(); 
        if (open) playClose();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && open) {
          e.preventDefault();
          playClose();
        }
      });

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
    }

    if (document.readyState === 'loading') { 
      document.addEventListener('DOMContentLoaded', start); 
    } else { 
      start(); 
    }
  })();


  // ============================================
  // NAVBAR SCROLL STATE
  // ============================================
  (function() {
    const SCROLL_THRESHOLD = 100;
    const sidebarEasing = 'elastic.out(1, 0.75)';
    let lastIsScrolled = null;
    let navbarTl = null;
    const navbar = document.querySelector('.navbar_component');

    function checkForcedScrolledState() {
      const bodyAttr = document.body.getAttribute('data-navbar-state');
      const htmlAttr = document.documentElement.getAttribute('data-navbar-state');
      return bodyAttr === 'scrolled' || htmlAttr === 'scrolled';
    }

    function initNavbar() {
      if (navbar && window.gsap) {
        const forceScrolled = checkForcedScrolledState();
        const isScrolled = forceScrolled || window.scrollY > SCROLL_THRESHOLD;
        lastIsScrolled = isScrolled;
        
        if (isScrolled) {
          document.body.classList.add('scrolled');
          window.gsap.set(navbar, {
            top: '1.5rem',
            paddingTop: '1rem',
            paddingBottom: '1rem',
            paddingLeft: 'clamp(1rem, 4vw, 3rem)',
            paddingRight: 'clamp(1rem, 4vw, 3rem)',
            maxWidth: '100rem',
            width: 'calc(100% - clamp(3rem, 8vw, 6rem))',
            backgroundColor: 'rgba(255, 255, 255, 1)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            borderRadius: '3px'
          });
        } else {
          document.body.classList.remove('scrolled');
          window.gsap.set(navbar, {
            top: 0,
            paddingTop: '2rem',
            paddingBottom: '2rem',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            maxWidth: '100%',
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0)',
            borderRadius: 0
          });
        }
        
        const trustpilotWidgets = document.querySelectorAll('.trustpilot-widget');
        trustpilotWidgets.forEach((widget) => {
          widget.setAttribute('data-text-color', 'dark');
        });
      }
    }

    function handleScroll() {
      const forceScrolled = checkForcedScrolledState();
      const isScrolled = forceScrolled || window.scrollY > SCROLL_THRESHOLD;
      if (isScrolled !== lastIsScrolled) {
        document.body.classList.toggle('scrolled', isScrolled);
        
        if (navbar && window.gsap) {
          if (navbarTl) navbarTl.kill();
          
          navbarTl = window.gsap.timeline();
          
          if (isScrolled) {
            navbarTl.to(navbar, {
              top: '1.5rem',
              paddingTop: '1rem',
              paddingBottom: '1rem',
              paddingLeft: 'clamp(1rem, 4vw, 3rem)',
              paddingRight: 'clamp(1rem, 4vw, 3rem)',
              maxWidth: '100rem',
              width: 'calc(100% - clamp(3rem, 8vw, 6rem))',
              backgroundColor: 'rgba(255, 255, 255, 1)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
              borderRadius: '3px',
              duration: 0.8,
              ease: sidebarEasing
            });
          } else {
            navbarTl.to(navbar, {
              top: 0,
              paddingTop: '2rem',
              paddingBottom: '2rem',
              paddingLeft: '1.5rem',
              paddingRight: '1.5rem',
              maxWidth: '100%',
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0)',
              borderRadius: 0,
              duration: 0.8,
              ease: sidebarEasing
            });
          }
        }
        
        lastIsScrolled = isScrolled;
      }
    }

    initNavbar();
    handleScroll();

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
  })();

