<script>
// ============================================
// FEEDBACK RATING SYSTEM
// ============================================
// DEBUG: Open browser console and type: logFeedbackStructure()
// This will show you the current Webflow HTML structure
// ============================================

pageFunctions.addFunction('feedbackRating', function() {

///////////////////////////
// CONFIG
///////////////////////////

const RATING_CONFIG = {
    MAX_STARS: 5                 // Maximum number of stars
  };
  
  ///////////////////////////
  // STEP HEIGHT DEBUG
  ///////////////////////////
  
  
  // Global state
  let currentRating = 0;
  let currentStep = 'rating'; // 'rating', 'trustpilot', 'feedback'
  
  ///////////////////////////
  // STAR RATING SETUP
  ///////////////////////////
  
  function setupStarRating() {
    const containers = document.querySelectorAll('.feedback-container');

    containers.forEach(container => {
      // Create star rating interface
      createStarInterface(container);

      // Setup step navigation
      setupStepNavigation(container);
    });
  }

  // Debug function to log Webflow structure
  // Usage: Open browser console and type: logFeedbackStructure()
  function logWebflowStructure() {
    console.log('🔍 Webflow Structure:');

    const containers = document.querySelectorAll('.feedback-container');
    console.log(`Found ${containers.length} feedback container(s)`);

    containers.forEach((container, index) => {
      console.log(`\n📦 Container ${index + 1}:`);
      console.log('Structure:');

      // Log all direct children
      const children = Array.from(container.children);
      children.forEach((child, childIndex) => {
        const classes = child.className ? `.${child.className.split(' ').join('.')}` : '';
        const id = child.id ? `#${child.id}` : '';
        const dataAttrs = Array.from(child.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .map(attr => `${attr.name}="${attr.value}"`)
          .join(' ');

        console.log(`  ${childIndex + 1}. ${child.tagName}${id}${classes} ${dataAttrs}`);

        // Special logging for star boxes
        if (child.classList.contains('star-box')) {
          const starValue = child.dataset.starValue;
          const starSvg = child.querySelector('svg');
          if (starSvg) {
            console.log(`     ⭐ Star Box ${starValue}: SVG star found`);
          } else {
            console.log(`     ⚠️ Star Box ${starValue}: Missing SVG`);
          }
        }

        // Special logging for star images (fallback)
        if (child.classList.contains('star-image') && !child.closest('.star-box')) {
          const starValue = child.dataset.starValue;
          const src = child.src;
          console.log(`     ⭐ Star ${starValue}: ${src.split('/').pop()} (no box)`);
        }

        // Special logging for feedback steps
        if (child.classList.contains('feedback-step')) {
          const stepType = child.classList.contains('trustpilot-step') ? 'Trustpilot' :
                          child.classList.contains('feedback-step') && child.classList.contains('feedback-form-step') ? 'Feedback Form' : 'Unknown';
          console.log(`     📝 ${stepType} Step`);
        }

        // Log nested elements
        if (child.children.length > 0) {
          const nested = Array.from(child.children);
          nested.forEach((nestedChild, nestedIndex) => {
            const nestedClasses = nestedChild.className ? `.${nestedChild.className.split(' ').join('.')}` : '';
            const nestedId = nestedChild.id ? `#${nestedChild.id}` : '';
            console.log(`       ${nestedIndex + 1}. ${nestedChild.tagName}${nestedId}${nestedClasses}`);
          });
        }
      });

      // Check for required elements
      const starBoxes = container.querySelectorAll('.star-box');
      const trustpilotStep = document.querySelector('.trustpilot-step');
      const feedbackStep = document.querySelector('.feedback-form-step');

      console.log('\n✅ Element Check:');
      console.log(`  ⭐ Star Boxes: ${starBoxes.length} found`);
      console.log(`  🏆 Trustpilot step: ${trustpilotStep ? 'Found' : 'Missing'}`);
      console.log(`  📝 Feedback step: ${feedbackStep ? 'Found' : 'Missing'}`);

      if (starBoxes.length > 0) {
        console.log('\n⭐ Star Box Details:');
        starBoxes.forEach((box, i) => {
          const starImage = box.querySelector('.star-image');
          const starSvg = box.querySelector('svg');
          const value = starImage?.dataset.starValue || starSvg?.dataset.starValue || box.dataset.starValue;
          if (starSvg) {
            console.log(`  ${i + 1}. Star Box ${value}: SVG star`);
          } else {
            console.log(`  ${i + 1}. Star Box ${value}: Missing SVG`);
          }
        });
      }
    });


  }

  // Make it globally available
  window.logFeedbackStructure = logWebflowStructure;

  function setupStarRating() {
    // Log structure first for debugging
    logWebflowStructure();

    const containers = document.querySelectorAll('.feedback-container');

    containers.forEach(container => {
      // Find star boxes and setup click handlers
      const starBoxes = container.querySelectorAll('.star-box');

      console.log(`🔧 Setting up ${starBoxes.length} star boxes`);

      starBoxes.forEach((box) => {
        const starImage = box.querySelector('.star-image');
        const starSvg = box.querySelector('svg');
        const starValue = parseInt(starImage?.dataset.starValue || starSvg?.dataset.starValue || box.dataset.starValue);

        if (starSvg && starValue && starValue >= 1 && starValue <= RATING_CONFIG.MAX_STARS) {
          // Add click listener to star-image div (which contains the SVG)
          starImage.addEventListener('click', (event) => {
            console.log(`⭐ Star ${starValue} clicked! Event target:`, event.target);
            console.log(`⭐ Container:`, container);
            handleStarClick(starValue, container);
          });
          starSvg.style.cursor = 'pointer';
          console.log(`✅ Star ${starValue} ready in .star-box`);
      } else {
          console.warn(`⚠️ Star box missing SVG or invalid data-star-value:`, box, {
            starImage: starImage,
            starSvg: starSvg,
            starValue: starValue
          });
        }
      });

      // Initially hide all steps
      const steps = document.querySelectorAll('.feedback-step');
      steps.forEach(step => step.classList.add('hidden'));

      // Initially hide feedback containers that are NOT in rating-stars-container
      const allContainers = document.querySelectorAll('.feedback-container:not(.rating-stars-container .feedback-container)');
      allContainers.forEach(container => {
        container.style.display = 'none';
        console.log(`📦 Hidden feedback container (not in rating-stars-container)`);
      });

      // Add hover effects for star preview
      starBoxes.forEach(box => {
        const starImage = box.querySelector('.star-image');
        const starSvg = box.querySelector('svg');
        // Look for data-star-value on star-image, SVG, or box itself
        const starValue = parseInt(starImage?.dataset.starValue || starSvg?.dataset.starValue || box.dataset.starValue);

        if (starSvg && starValue) {
          // Hover effect: preview filled stars
          box.addEventListener('mouseenter', function() {
            previewStars(container, starValue);
          });

          // Mouse leave: revert to current rating
          box.addEventListener('mouseleave', function() {
            updateStarDisplay(container, currentRating);
          });
        }
      });

      // Show rating-stars-container and its feedback-container with smooth animation
      const ratingStarsContainer = document.querySelector('.rating-stars-container');
      if (ratingStarsContainer) {
        ratingStarsContainer.style.display = 'flex';
        ratingStarsContainer.style.justifyContent = 'center';
        ratingStarsContainer.style.alignItems = 'center';
        ratingStarsContainer.style.flexDirection = 'column';

        // Add show class for smooth entrance
        setTimeout(() => {
          ratingStarsContainer.classList.add('show');
        }, 10);

        const ratingContainer = ratingStarsContainer.querySelector('.feedback-container');
        if (ratingContainer) {
          ratingContainer.style.display = 'flex';
          ratingContainer.style.justifyContent = 'center';

          // Add show class to star boxes with stagger
          const starBoxes = ratingContainer.querySelectorAll('.star-box');
          starBoxes.forEach((box, index) => {
            setTimeout(() => {
              box.classList.add('show');
            }, index * 100); // Stagger delay
          });
        }
        console.log(`📦 Showing rating-stars-container with smooth animation`);
      }

      console.log(`👁️ Initially showing rating-stars-container, hiding all other steps`);
    });
  }

  function handleStarClick(rating, container) {
    console.log(`🎯 Rating selected: ${rating} stars`);
    currentRating = rating;

    // Update star visuals in the current container
    updateStarDisplay(container, rating);

    // For 5 stars, update stars in trustpilot-step
    // For 1-4 stars, update stars in feedback-form-step
    if (rating === 5) {
      // Update stars in trustpilot-step (it already has stars in the HTML)
      const targetContainer = document.querySelector('.trustpilot-step .feedback-container');
      if (targetContainer) {
        updateStarDisplay(targetContainer, rating);
        console.log(`✨ Updated stars in trustpilot-step`);
      }
    } else {
      // Update stars in feedback-form-step
      const targetContainer = document.querySelector('.feedback-form-step .feedback-container');
      if (targetContainer) {
        updateStarDisplay(targetContainer, rating);
        console.log(`✨ Also updated stars in feedback-form-step`);
      }
    }

    // Update Webflow form hidden field with rating
    updateWebflowFormRating(rating);

    // Navigate to appropriate step based on rating
    if (rating === 5) {
      console.log('🏆 5 stars! Showing Trustpilot step');
      showTrustpilotStep(container);
    } else {
      console.log('📝 Rating 1-4. Showing feedback form step');
      showFeedbackStep(container);
    }
  }

  function updateStarDisplay(container, rating) {
    console.log(`✨ Updating star display for rating: ${rating}`);
    const starBoxes = container.querySelectorAll('.star-box');
    starBoxes.forEach((box) => {
      const starImage = box.querySelector('.star-image');
      const starSvg = box.querySelector('svg');
      // Look for data-star-value on star-image, SVG, or box itself
      const starValue = parseInt(starImage?.dataset.starValue || starSvg?.dataset.starValue || box.dataset.starValue);

      if (starSvg && starValue) {
        if (starValue <= rating) {
          starSvg.classList.add('star-filled');
          console.log(`  ⭐ Star Box ${starValue}: FILLED (green)`);
        } else {
          starSvg.classList.remove('star-filled');
          console.log(`  ⭐ Star Box ${starValue}: EMPTY (gray)`);
        }
      }
    });
  }

  function previewStars(container, previewRating) {
    console.log(`👁️ Previewing stars for rating: ${previewRating}`);
    const starBoxes = container.querySelectorAll('.star-box');
    starBoxes.forEach((box) => {
      const starImage = box.querySelector('.star-image');
      const starSvg = box.querySelector('svg');
      // Look for data-star-value on star-image, SVG, or box itself
      const starValue = parseInt(starImage?.dataset.starValue || starSvg?.dataset.starValue || box.dataset.starValue);

      if (starSvg && starValue) {
        if (starValue <= previewRating) {
          starSvg.classList.add('star-filled');
          console.log(`  👁️ Star Box ${starValue}: PREVIEW FILLED`);
        } else {
          starSvg.classList.remove('star-filled');
          console.log(`  👁️ Star Box ${starValue}: PREVIEW EMPTY`);
        }
      }
    });
  }

  function addHoverEffects(container) {
    console.log(`🎯 Adding hover effects to container`);
    const starBoxes = container.querySelectorAll('.star-box');
    starBoxes.forEach(box => {
      const starImage = box.querySelector('.star-image');
      const starSvg = box.querySelector('svg');
      // Look for data-star-value on star-image, SVG, or box itself
      const starValue = parseInt(starImage?.dataset.starValue || starSvg?.dataset.starValue || box.dataset.starValue);

      if (starSvg && starValue) {
        // Remove existing hover listeners to avoid duplicates
        box.removeEventListener('mouseenter', box._hoverEnter);
        box.removeEventListener('mouseleave', box._hoverLeave);

        // Hover effect: preview filled stars
        box._hoverEnter = function() {
          previewStars(container, starValue);
        };
        box.addEventListener('mouseenter', box._hoverEnter);

        // Mouse leave: revert to current rating
        box._hoverLeave = function() {
          updateStarDisplay(container, currentRating);
        };
        box.addEventListener('mouseleave', box._hoverLeave);

        console.log(`  🎯 Added hover effects to star ${starValue}`);
      }
    });
  }

  function setupStepNavigation(container) {
    // This will be expanded when we add the step logic
  }

  function showTrustpilotStep(container) {
    console.log('🎉 Showing Trustpilot step');
    currentStep = 'trustpilot';

    // Hide all steps globally with smooth animation
    const allSteps = document.querySelectorAll('.feedback-step');
    allSteps.forEach(step => {
      step.classList.add('hidden');
      step.classList.remove('show');
      // The CSS transition will handle the smooth hiding
      console.log(`  👁️ Hidden step: ${step.className}`);
    });

    // Hide rating-stars-container
    const ratingContainer = document.querySelector('.rating-stars-container');
    if (ratingContainer) {
      ratingContainer.style.display = 'none';
      console.log(`  👁️ Hidden rating-stars-container`);
    }

    // Show trustpilot step (stars are already in the HTML and updated by handleStarClick)
    const trustpilotStep = document.querySelector('.trustpilot-step');
    if (trustpilotStep) {
      // Ensure proper positioning
      trustpilotStep.style.justifyContent = 'center';
      trustpilotStep.style.alignItems = 'center';
      trustpilotStep.style.flexDirection = 'column';

      // Remove hidden class and add show class for smooth animation
      trustpilotStep.classList.remove('hidden');
    setTimeout(() => {
        trustpilotStep.classList.add('show');
      }, 10);

      console.log(`  ✅ Shown step: ${trustpilotStep.className}`);

      // Make sure the feedback-container with stars is visible
      const feedbackContainer = trustpilotStep.querySelector('.feedback-container');
      if (feedbackContainer) {
        feedbackContainer.style.display = 'flex';
        feedbackContainer.style.justifyContent = 'center';
        console.log(`  ⭐ Shown feedback-container with stars`);
      }
    }

    // Setup feedback form if it exists
    setupFeedbackForm(container);
  }

  function showFeedbackStep(container) {
    console.log('📝 Showing feedback form step (feedback-form-step)');
    currentStep = 'feedback';

    // Hide rating interface and show feedback step (feedback-form-step)
    showStep(container, '.feedback-form-step');

    // Setup feedback form if it exists
    setupFeedbackForm(container);
  }

  function showStep(container, stepSelector, keepStarsVisible = false) {
    console.log(`🔄 Switching to step: ${stepSelector}`);

    // Hide all steps globally with smooth animation
    const allSteps = document.querySelectorAll('.feedback-step');
    allSteps.forEach(step => {
      step.classList.add('hidden');
      step.classList.remove('show');
      // The CSS transition will handle the smooth hiding
      console.log(`  👁️ Hidden step: ${step.className}`);
    });

    // Hide rating-stars-container (the initial rating step) unless keepStarsVisible is true
    const ratingContainer = document.querySelector('.rating-stars-container');
    if (ratingContainer && !keepStarsVisible) {
      ratingContainer.style.display = 'none';
      console.log(`  👁️ Hidden rating-stars-container`);
    } else if (keepStarsVisible) {
      console.log(`  👁️ Kept rating-stars-container visible`);
    }

    // Hide all feedback containers (except those in rating-stars-container)
    const allContainers = document.querySelectorAll('.feedback-container:not(.rating-stars-container .feedback-container)');
    allContainers.forEach(container => {
      container.style.display = 'none';
      console.log(`  📦 Hidden container`);
    });

    // Show the target step with smooth animation
    const targetStep = document.querySelector(stepSelector);
    if (targetStep) {
      // Ensure proper positioning (display should already be flex from CSS)
      targetStep.style.justifyContent = 'center';
      targetStep.style.alignItems = 'center';
      targetStep.style.flexDirection = 'column';

      // Remove hidden class and add show class for smooth animation
      targetStep.classList.remove('hidden');
      setTimeout(() => {
        targetStep.classList.add('show');
      }, 10); // Small delay to ensure positioning is set first

      console.log(`  ✅ Shown step: ${targetStep.className}`);

      // If showing feedback-form-step, also show its container (with filled stars)
      if (stepSelector === '.feedback-form-step') {
        const feedbackContainers = targetStep.querySelectorAll('.feedback-container');
        feedbackContainers.forEach(container => {
          container.style.display = 'flex';
          container.style.justifyContent = 'center';
          console.log(`  📦 Shown container in feedback form (with filled stars)`);
          // Add hover effects for stars in feedback step
          addHoverEffects(container);
        });
      }

      // If showing trustpilot-step, add hover effects to its stars
      if (stepSelector === '.trustpilot-step') {
        const trustpilotContainers = targetStep.querySelectorAll('.feedback-container');
        trustpilotContainers.forEach(container => {
          // Add hover effects for stars in trustpilot step
          addHoverEffects(container);
        });
      }
    } else {
      console.warn(`  ⚠️ Step not found: ${stepSelector}`);
    }
  }

  function updateWebflowFormRating(rating) {
    // Find rating field in rating-stars-container form
    const form = document.querySelector('.rating-stars-container .w-form') || 
                 document.querySelector('.rating-stars-container form');
    const hiddenRating = form ? form.querySelector('input[name="Rating"]') : 
                         document.querySelector('input[name="Rating"]');
    
    if (hiddenRating) {
      hiddenRating.value = rating;
    }
  }

  function setupFeedbackForm(container) {
    // Find buttons in the current visible step
    const customSubmitBtn = document.querySelector('.feedback-form-step [data-custom-submit]') || 
                           document.querySelector('.trustpilot-step [data-custom-submit]') ||
                           document.querySelector('[data-custom-submit]');
    const realSubmitBtn = document.querySelector('.feedback-form-step .submit-btn-feedback') || 
                         document.querySelector('.trustpilot-step .submit-btn-feedback') ||
                         document.querySelector('.submit-btn-feedback');
    
    if (customSubmitBtn && realSubmitBtn) {
      customSubmitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        updateWebflowFormRating(currentRating);
        setTimeout(() => {
          realSubmitBtn.click();
        }, 10);
      });
    }
  }
  
  ///////////////////////////
  // INIT ON LOAD
  ///////////////////////////

  function initFeedbackRating() {
    console.log('🚀 Feedback Rating System Initializing...');
    console.log('💡 Type "logFeedbackStructure()" in console to see Webflow structure');
    setupStarRating();
    console.log('✅ Feedback Rating System Ready!');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeedbackRating);
} else {
    initFeedbackRating();
}
  });

</script>