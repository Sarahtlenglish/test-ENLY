<script>
pageFunctions.addFunction('contactform', function() {


// ============================================
// NEWSLETTER FORM CUSTOM SUBMIT
// ============================================
(function() {
  function initNewsletterForm() {
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
    document.addEventListener('DOMContentLoaded', initNewsletterForm);
  } else {
    initNewsletterForm();
  }
})();


});
</script>