<script>
pageFunctions.addFunction('Newsletter', function() {



// ============================================
// NEWSLETTER MODAL ANIMATION
// ============================================
(function() {
  function initNewsletterModal() {
    const gsapRef = window.gsap;
    
    if (!gsapRef) {
      console.warn('GSAP not loaded');
      return;
    }

    const qs = (s) => document.querySelector(s);
    const qsa = (s) => Array.from(document.querySelectorAll(s));

    // Find newsletter modal elements - simple approach with minimal attributes
    // Fallback to .newsletter_button if data attribute not found
    const triggerBtns = qsa('[data-open-newsletter]');
    const fallbackBtns = triggerBtns.length === 0 ? qsa('.newsletter_button') : [];
    const allTriggerBtns = [...triggerBtns, ...fallbackBtns];
    const modal = qs('[data-newsletter]');
    const closeBtns = qsa('[data-wf--menu-button--variant="module-btn"]');
    
    if (!allTriggerBtns.length) {
      console.warn('Newsletter trigger buttons not found. Add [data-open-newsletter] to buttons or use .newsletter_button class.');
      return;
    }
    
    if (!modal) {
      console.warn('Newsletter modal not found. Add [data-newsletter] to your modal container.');
      return;
    }
    
    // Find child elements within the modal - updated naming
    const overlay = modal.querySelector('.newsletter-overlay, [data-newsletter-overlay]') || modal;
    const panel = modal.querySelector('.newsletter_component, .newsletter-panel, [data-newsletter-panel]') || modal;
    const bg = modal.querySelector('.newsletter-background, [data-newsletter-background]');
    const formWrapper = modal.querySelector('.newsletter-items_wrapper, .newsletter-form-wrapper, [data-newsletter-form-wrapper]');

    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
    const sidebarEasing = 'elastic.out(1, 0.75)';
    
    let openTl, closeTl, open = false, currentMobile = isMobile();

    function baseInit() {
      const elementsToClear = [overlay, panel].filter(Boolean);
      if (bg) elementsToClear.push(bg);
      if (formWrapper) elementsToClear.push(formWrapper);
      gsapRef.set(elementsToClear, { clearProps: 'all' });
      
      // Only hide modal if it's not already manually set to block (for testing)
      // Check if display is set via inline style (manually changed)
      const inlineDisplay = modal.style.display;
      if (!inlineDisplay || inlineDisplay === 'none') {
        // Only set to none if it's not manually set to block
        gsapRef.set(modal, { display: 'none' });
      }
      
      gsapRef.set(overlay, { opacity: 0, pointerEvents: 'none' });
      
      if (currentMobile) {
        gsapRef.set(panel, { opacity: 0, visibility: 'hidden', pointerEvents: 'none' });
        if (formWrapper) {
          gsapRef.set(formWrapper, { opacity: 0, y: window.innerHeight });
        }
      } else {
        gsapRef.set(panel, { x: '100%', visibility: 'hidden', pointerEvents: 'none' });
        if (bg) gsapRef.set(bg, { x: '100%', opacity: 0, visibility: 'hidden' });
      }
    }

    function buildTimelines(skipInit = false) {
      if (openTl) openTl.kill();
      if (closeTl) closeTl.kill();
      if (!skipInit) {
        baseInit();
      }

      if (currentMobile) {
        openTl = gsapRef.timeline({ paused: true, overwrite: 'auto' });
        openTl
          .set(modal, { display: 'block' }, 0)
          .set(panel, { display: 'block', visibility: 'visible', pointerEvents: 'auto' }, 0)
          .set(overlay, { display: 'block', visibility: 'visible' }, 0)
          .set(document.body, { overflow: 'hidden' }, 0)
          .to(overlay, { opacity: 1, visibility: 'visible', duration: 0.3, ease: 'power1.out' }, 0)
          .to(panel, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 0);
        
        if (formWrapper) {
          openTl.to(formWrapper, { y: 0, duration: 0.8, ease: sidebarEasing }, 0);
          openTl.to(formWrapper, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 0);
        }

        closeTl = gsapRef.timeline({ paused: true, overwrite: 'auto', onComplete: () => {
          gsapRef.set(modal, { display: 'none' });
          gsapRef.set(panel, { display: 'none', opacity: 0, visibility: 'hidden', pointerEvents: 'none' });
          gsapRef.set(overlay, { display: 'none', pointerEvents: 'none' });
          gsapRef.set(document.body, { overflow: '' });
          if (formWrapper) {
            gsapRef.set(formWrapper, { y: window.innerHeight, opacity: 0 });
          }
        }});
        
        closeTl
          .to(panel, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 0);
        
        if (formWrapper) {
          closeTl.to(formWrapper, { y: window.innerHeight, duration: 0.8, ease: sidebarEasing }, 0);
          closeTl.to(formWrapper, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 0);
        }
        
        closeTl.to(overlay, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 0);
      } else {
        openTl = gsapRef.timeline({ paused: true, overwrite: 'auto' });
        openTl
          .set(modal, { display: 'block' }, 0)
          .set(panel, { display: 'block', visibility: 'visible', pointerEvents: 'auto' }, 0)
          .set(overlay, { display: 'block', visibility: 'visible' }, 0)
          .set(bg, { display: 'block', visibility: 'visible' }, 0)
          .set(document.body, { overflow: 'hidden' }, 0)
          .to(overlay, { opacity: 1, visibility: 'visible', duration: 0.3, ease: 'power1.out' }, 0)
          .to(panel, { x: 0, duration: 0.8, ease: sidebarEasing }, 0);
        
        if (bg) {
          openTl.to(bg, { x: 0, opacity: 1, duration: 0.8, ease: sidebarEasing }, 0);
        }

        closeTl = gsapRef.timeline({ paused: true, overwrite: 'auto', onComplete: () => {
          gsapRef.set(modal, { display: 'none' });
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
      console.log('playOpen called');
      if (openTl && openTl.isActive()) return; 
      if (closeTl) closeTl.kill(); 
      
      // First, make elements visible
      modal.style.display = 'block';
      panel.style.display = 'block';
      overlay.style.display = 'block';
      if (bg) bg.style.display = 'block';
      
      // Set initial states
      if (currentMobile) {
        gsapRef.set(panel, { opacity: 0, visibility: 'visible', pointerEvents: 'auto' });
        gsapRef.set(overlay, { opacity: 0, pointerEvents: 'auto' });
        if (formWrapper) {
          gsapRef.set(formWrapper, { y: window.innerHeight, opacity: 0 });
        }
      } else {
        gsapRef.set(panel, { x: '100%', visibility: 'visible', pointerEvents: 'auto' });
        gsapRef.set(overlay, { opacity: 0, pointerEvents: 'auto' });
        if (bg) {
          gsapRef.set(bg, { x: '100%', opacity: 0, visibility: 'visible' });
        }
      }
      
      // Use existing timeline, don't rebuild
      open = true;
      console.log('Playing animation, openTl:', openTl);
      if (openTl) {
        openTl.restart(true);
        console.log('Timeline playing:', openTl.isActive(), 'progress:', openTl.progress());
      } else {
        console.error('openTl is null!');
      }
    }
    
    function playClose() { 
      if (closeTl && closeTl.isActive()) return; 
      if (openTl) openTl.kill(); 
      open = false;
      closeTl.restart(true); 
    }

    function handleResize() { 
      const mobileNow = isMobile();
      
      if (mobileNow !== currentMobile) { 
        if (openTl) openTl.kill();
        if (closeTl) closeTl.kill();
        
        open = false;
        
        gsapRef.set(document.body, { overflow: '' });
        
        const elementsToClear = [panel, overlay].filter(Boolean);
        if (bg) elementsToClear.push(bg);
        if (formWrapper) elementsToClear.push(formWrapper);
        
        gsapRef.set(elementsToClear, { clearProps: 'all' });
        
        currentMobile = mobileNow;
        
        baseInit(); 
        buildTimelines(); 
      } 
    }

    buildTimelines();
    
    console.log('Newsletter modal initialized:', {
      triggerBtns: triggerBtns.length,
      modal: !!modal,
      overlay: !!overlay,
      panel: !!panel,
      openTl: !!openTl,
      modalDisplay: modal ? window.getComputedStyle(modal).display : 'N/A'
    });

    triggerBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Newsletter button clicked');
        if (!open) playOpen();
      });
    });

    if (closeBtns.length) {
      closeBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (open) playClose();
        });
      });
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        e.preventDefault(); 
        e.stopPropagation(); 
        if (open) playClose();
      });
    }

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
    document.addEventListener('DOMContentLoaded', initNewsletterModal);
  } else {
    initNewsletterModal();
  }
})();

// ============================================
// NEWSLETTER FORM CUSTOM SUBMIT
// ============================================
(function() {
  function initNewsletterForm() {
    // Find the form block and custom button
    const formBlock = document.querySelector('.w-form');
    const customSubmitBtn = document.querySelector('[data-custom-submit]');
    
    if (!formBlock || !customSubmitBtn) return;
    
    const form = formBlock.querySelector('form');
    if (!form) return;
    
    // Hide default submit button (if it exists)
    const defaultSubmitBtn = form.querySelector('input[type="submit"], button[type="submit"]');
    if (defaultSubmitBtn) {
      defaultSubmitBtn.style.display = 'none';
    }
    
    // Add click handler to custom button
    customSubmitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Validate form first (optional - Webflow handles this)
      if (form.checkValidity()) {
        // Submit the form programmatically
        form.requestSubmit();
      } else {
        // Trigger validation UI
        form.reportValidity();
      }
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewsletterForm);
  } else {
    initNewsletterForm();
  }
})();



});
</script>