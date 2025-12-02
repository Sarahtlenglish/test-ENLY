pageFunctions.addFunction('contactform', function() {

// ============================================
// CONTACT FORM CUSTOM SUBMIT
// ============================================
(function() {
  function initContactForm() {
    // Find the form block and custom button
    const formBlock = document.querySelector('.w-form');
    const customSubmitBtn = document.querySelector('[data-wf--button--variant="fomular-btn---no-icon"]');
    
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
    document.addEventListener('DOMContentLoaded', initContactForm);
  } else {
    initContactForm();
  }
})();

// ============================================
// NICE-SELECT DROPDOWN INITIALIZATION
// ============================================
(function() {
  function initNiceSelect() {
    // Check if jQuery and nice-select are available
    if (typeof jQuery === 'undefined' || typeof jQuery.fn.niceSelect === 'undefined') {
      console.warn('jQuery or nice-select library not loaded. Make sure to include:');
      console.warn('<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-nice-select/1.1.0/js/jquery.nice-select.min.js"></script>');
      return;
    }

    // Initialize nice-select on all select elements within forms
    const forms = document.querySelectorAll('.w-form form, form');
    
    forms.forEach(form => {
      const selects = form.querySelectorAll('select');
      
      selects.forEach(select => {
        // Check if already initialized
        if (select.classList.contains('nice-select-initialized')) {
          return;
        }
        
        // Initialize nice-select
        jQuery(select).niceSelect();
        select.classList.add('nice-select-initialized');
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNiceSelect);
  } else {
    initNiceSelect();
  }

  // Re-initialize when form container becomes visible (for dynamic content)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const target = mutation.target;
        if (target.classList.contains('w-form') || target.closest('.w-form')) {
          const computedStyle = window.getComputedStyle(target);
          if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
            setTimeout(initNiceSelect, 100);
          }
        }
      }
    });
  });

  // Observe form containers for visibility changes
  document.querySelectorAll('.w-form').forEach(formBlock => {
    observer.observe(formBlock, { attributes: true, attributeFilter: ['style'] });
  });
})();

});
