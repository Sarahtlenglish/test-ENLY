// ============================================
// WEBFLOW PROPERTY MAPPING
// ============================================
// This script maps Webflow's native properties (like links)
// to custom data attributes that can be used in your code
//
// Usage in Webflow:
// 1. Add a link to your element using Webflow's normal link property
// 2. Add class "map-link-to-data" to the element (or use data attribute)
// 3. The link will automatically be copied to data-custom-link attribute
//
// Alternative: Use data-map-link attribute directly on element
// ============================================

(function() {
  function mapWebflowProperties() {
    // Method 1: Map via class
    document.querySelectorAll('.map-link-to-data').forEach((el) => {
      mapLinkToData(el);
    });

    // Method 2: Map via data attribute (more flexible)
    document.querySelectorAll('[data-map-link]').forEach((el) => {
      mapLinkToData(el);
    });

    // Method 3: Map text content to data attribute
    document.querySelectorAll('.map-text-to-data, [data-map-text]').forEach((el) => {
      const text = el.textContent.trim();
      if (text) {
        const attrName = el.getAttribute('data-map-text') || 'data-custom-text';
        el.setAttribute(attrName, text);
      }
    });
  }

  function mapLinkToData(el) {
    // Check if element itself is a link
    if (el.tagName === 'A') {
      const href = el.getAttribute('href');
      if (href) {
        const attrName = el.getAttribute('data-map-link') || 'data-custom-link';
        el.setAttribute(attrName, href);
      }
      return;
    }

    // Find the first <a> tag inside the element (Webflow stores links here)
    const linkEl = el.querySelector('a');
    if (linkEl) {
      const href = linkEl.getAttribute('href');
      if (href) {
        const attrName = el.getAttribute('data-map-link') || 'data-custom-link';
        el.setAttribute(attrName, href);
      }
    }
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mapWebflowProperties);
  } else {
    mapWebflowProperties();
  }

  // Also run when Webflow Designer updates (for live preview)
  if (window.Webflow && window.Webflow.push) {
    window.Webflow.push(function() {
      mapWebflowProperties();
    });
  }

  // Watch for changes in Designer (MutationObserver)
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(function(mutations) {
      mapWebflowProperties();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'data-map-link']
    });
  }
})();

