<script>
// Constants
const CONFIG = {
  TYPEKIT_URL: 'https://use.typekit.net',
  TYPEKIT_P_URL: 'https://p.typekit.net',
  GITHUB_IMAGE_BASE: 'https://sarahtlenglish.github.io/test-ENLY/img',
  GITHUB_RAW_BASE: 'https://raw.githubusercontent.com/Sarahtlenglish/test-ENLY/main/img',
  VERCEL_IMAGE_BASE: 'https://h8nip4886wtjcobp.public.blob.vercel-storage.com',
  
  IMAGE_HOUSE_OFF: 'https://raw.githubusercontent.com/Sarahtlenglish/test-ENLY/main/img/house_off.webp',
  IMAGE_HOUSE_ON: 'https://raw.githubusercontent.com/Sarahtlenglish/test-ENLY/main/img/house_on.webp',
  IMAGE_FLAT_OFF: 'https://raw.githubusercontent.com/Sarahtlenglish/test-ENLY/main/img/flat_off.webp',
  IMAGE_FLAT_ON: 'https://raw.githubusercontent.com/Sarahtlenglish/test-ENLY/main/img/flat_on.webp',
  
  PRODUCT_ID_HOUSE: 2024,
  PRODUCT_ID_APARTMENT: 1991,


  DELAY_BUTTON_CLICK: 30,
  DELAY_BUTTON_STATE_UPDATE: 20,
  DELAY_REORGANIZE: 30,
  
  SELECTOR_ELECTRICAL_PRODUCT: '.signup__electrical_product',
  SELECTOR_NEXT_BUTTON: '#next-button',
  SELECTOR_GROUP_CONTAINER: '#group-container',
  
  
  TOOLTIP_HELP_LABEL: 'Hjælp',
  TOOLTIP_TEXT_CHARGING: 'Uanset hvordan du lader derhjemme, skal vi vide det, hvis din faste pris skal dække opladning af elbil.',
  TOOLTIP_TEXT_NO_CHARGER: 'Vælg denne hvis du ikke har noget som helst der bruger ekstra strøm i din bolig.',
  TITLE_CHARGING: 'Jeg skal kunne lade hjemme',
  DESC_CHARGING_LINE1: 'Hvis du har ladestander er der et tillæg til din faste pris.',
  DESC_CHARGING_LINE2: 'Tilgængeld får du også en <strong>højere forbrugsgrænse</strong> på 333 kWh ekstra om måneden*',
  CHARGING_INCLUSION_TEXT: '*Inkluderer 333 kWh/md., svarende til ca. 20.000 km/år afhængigt af din elbil, kørestil, samt kørsels- og vejrforhold. Ved beregningen er forudsat et gennemsnitligt forbrug på 5-5,2 km/kWh. Inkluderede kWh, som i en måned ikke forbruges, overføres ikke til forbrug i næste måned.',
  SUBHEADING_SOLUTION: 'Skal du have en ladeboks?',
  TITLE_NO_CHARGER: 'Jeg lader ikke elbil hjemme',
  DESC_NO_CHARGER: 'Nix. Ingen elbil hjemme hos mig. Videre til min aftale.',
  MOVE_DATE_LABEL: 'Angiv din indflytningsdato.',

  KEYWORD_NO_CHARGER: ['ikke ladestander', 'har ikke'],

  GAS_DISCLAIMER_TEXT: 'Hvis du har elvarme eller varmepumpe i din bolig og/eller oplader elbil hjemme, hæves forbrugsgrænsen med <strong>333 kWh </strong> pr. måned pr. løsning, og der opkræves et fast tillæg på <strong>499 kr.</strong> pr. måned pr. løsning. Du har pligt til at oplyse, hvis du har elvarme/varmepumpe, eller hvis du oplader el-bil på ejendommen. ENLY er berettiget til at opkræve tillæggene med tilbagevirkende kraft fra tidspunktet, hvor du fik elvarme/varmepumpe og/eller elbil, som du oplader hjemme.'
};

CONFIG.PRICE_MAP = new Map([
  [CONFIG.PRODUCT_ID_HOUSE, CONFIG.PRICE_HOUSE],
  [CONFIG.PRODUCT_ID_APARTMENT, CONFIG.PRICE_APARTMENT]
]);

function getElementPath(element) {
  const path = [];
  let current = element;
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += '#' + current.id;
    }
    if (current.className && typeof current.className === 'string') {
      selector += '.' + current.className.split(' ').join('.');
    }
    path.unshift(selector);
    current = current.parentElement;
  }
  return path.join(' > ');
}

function storeSelectedProductFromId(id, subscriptionPrice) {
  if (!id) {
    return;
  }

  const existing = loadStoredSelectedProduct();

  const price = CONFIG.PRICE_MAP.get(Number(id));

  const payload = {
    id: id,
    price: Number(price || 0),
    electricalProductSubscriptionPrice: subscriptionPrice !== undefined ? subscriptionPrice : existing?.electricalProductSubscriptionPrice
  };

  window.selected_electrical_product = JSON.stringify(payload);
  localStorage.setItem('selected_electrical_product', JSON.stringify(payload));
}
function loadStoredSelectedProduct() {
  try {
    const stored = localStorage.getItem('selected_electrical_product');
    if (stored) {
      window.selected_electrical_product = stored;
      return JSON.parse(stored);
    }
    const raw = window.selected_electrical_product;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function computeMonthlyPrice() {
  const stored = loadStoredSelectedProduct();
  return stored?.electricalProductSubscriptionPrice || 0;
}

(function() {
  // Autocomplete detection and handling - fixed to not cause JSON responses
  let autocompleteActive = false;
  let blockedSubmissions = [];
  let observer = null;

  function checkAutofillStatus() {
    const autofillInputs = document.querySelectorAll('input:-webkit-autofill');
    return autofillInputs.length > 0;
  }

  function startMonitoring() {
    if (observer) return;

    observer = new MutationObserver(function(mutations) {
      let hasAutofillChange = false;

      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' &&
            (mutation.attributeName === 'value' ||
             mutation.attributeName.startsWith('data-com-') ||
             mutation.target.matches('input'))) {
          hasAutofillChange = true;
        }
      });

      if (hasAutofillChange) {
        const hasAutofill = checkAutofillStatus();

        if (hasAutofill && !autocompleteActive) {
          autocompleteActive = true;
        } else if (!hasAutofill && autocompleteActive) {
          autocompleteActive = false;
          processBlockedSubmissions();
        }
      }
    });

    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
    inputs.forEach(input => {
      observer.observe(input, {
        attributes: true,
        attributeFilter: ['value', 'data-com-*-autofill']
      });
    });

    // Safety timeout - if autocomplete doesn't complete naturally, allow submissions
    setTimeout(() => {
      if (autocompleteActive) {
        autocompleteActive = false;
        processBlockedSubmissions();
      }
    }, 3000);
  }

  function stopMonitoring() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function processBlockedSubmissions() {
    if (blockedSubmissions.length === 0) return;

    const latestSubmission = blockedSubmissions[blockedSubmissions.length - 1];
    blockedSubmissions = [];

    // Instead of clicking next button (which causes JSON response),
    // just allow the form to submit naturally after a small delay
    setTimeout(() => {
      if (latestSubmission.form) {
        // Remove any preventDefault that was applied
        latestSubmission.form.submit();
      }
    }, 100);
  }

  document.addEventListener('focusin', function(e) {
    if (e.target.matches('input[type="text"], input[type="email"], input[type="tel"]')) {
      startMonitoring();
    }
  }, true);

  // Only block submissions if autocomplete is definitely active
  document.addEventListener('submit', function(e) {
    if (autocompleteActive && checkAutofillStatus()) {
      e.preventDefault();
      e.stopImmediatePropagation();

      blockedSubmissions.push({
        form: e.target,
        timestamp: Date.now()
      });

      return false;
    }
  }, true);

  // Don't block button clicks when autocomplete is active
  // Let the backend handle it naturally
})();




// Load Aptly font from Typekit
(function() {
  // Add preconnect links for Typekit fonts
  const preconnect1 = document.createElement('link');
  preconnect1.rel = 'preconnect';
  preconnect1.href = CONFIG.TYPEKIT_URL;
  document.head.appendChild(preconnect1);

  const preconnect2 = document.createElement('link');
  preconnect2.rel = 'preconnect';
  preconnect2.href = CONFIG.TYPEKIT_P_URL;
  preconnect2.crossOrigin = 'anonymous';
  document.head.appendChild(preconnect2);

  // Load Aptly font stylesheets
  const aptlyStylesheet1 = document.createElement('link');
  aptlyStylesheet1.rel = 'stylesheet';
  aptlyStylesheet1.href = 'https://use.typekit.net/uqv7fhq.css';
  document.head.appendChild(aptlyStylesheet1);

  const aptlyStylesheet2 = document.createElement('link');
  aptlyStylesheet2.rel = 'stylesheet';
  aptlyStylesheet2.href = 'https://use.typekit.net/tik0ert.css';
  document.head.appendChild(aptlyStylesheet2);
})();


// Hus / Lejlighed radio - only run on electrical_product group
document.addEventListener('group:loaded', function(e) {
    // Only run electrical_product code if this is actually the electrical_product group
    const groupName = e?.detail?.completedGroup;
    if (groupName !== 'electrical_product' && !document.querySelector(CONFIG.SELECTOR_ELECTRICAL_PRODUCT)) {
        return; // Not electrical_product group and no container found
    }
    
    const container = document.querySelector(CONFIG.SELECTOR_ELECTRICAL_PRODUCT);
    if (!container) {
        return; // Not on electrical_product step
    }

    const allRadios = Array.from(container.querySelectorAll('input[type="radio"][name="prospect[electrical_product_name]"]'));
    if (!allRadios.length) return;
    // Always start with no preselection in the UI (even if markup/server sets one)
    allRadios.forEach(r => { r.checked = false; });

    // Build options from config (ids/images/labels); price comes from PRICE_MAP
    const options = [
        {
            id: CONFIG.PRODUCT_ID_HOUSE,
            image: CONFIG.IMAGE_HOUSE_OFF,
            selectedImage: CONFIG.IMAGE_HOUSE_ON,
            hoverImage: CONFIG.IMAGE_HOUSE_ON,
            label: 'Jeg bor i hus',
            variant: 'House',
            price: CONFIG.PRICE_MAP.get(Number(CONFIG.PRODUCT_ID_HOUSE))
        },
        {
            id: CONFIG.PRODUCT_ID_APARTMENT,
            image: CONFIG.IMAGE_FLAT_OFF,
            selectedImage: CONFIG.IMAGE_FLAT_ON,
            hoverImage: CONFIG.IMAGE_FLAT_ON,
            label: 'Jeg bor i lejlighed',
            variant: 'Apartment',
            price: CONFIG.PRICE_MAP.get(Number(CONFIG.PRODUCT_ID_APARTMENT))
        }
    ];

    window.productInfoMap = window.productInfoMap || new Map();
    window.productMap = window.productMap || {};
    options.forEach(opt => {
        window.productInfoMap.set(String(opt.id), opt);
        window.productMap[opt.id] = opt;
    });

    // Disable all hidden inputs initially; we will re-enable the selected one
    const allHiddenInputs = container.querySelectorAll('input[type="hidden"][name="prospect[electrical_product_id]"]');
    allHiddenInputs.forEach(input => {
        input.disabled = true;
    });

    // Hide original radios and their labels
    const radioGroups = container.querySelectorAll('.signup__electrical_product_name');
    radioGroups.forEach(group => group.style.display = 'none');

    // Create wrapper for the image selector UI
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'housing-type-selector';

    // Create all cards first, then add them all at once to prevent staggered animation timing issues
    const cards = [];

    options.forEach(opt => {
        const radio = allRadios.find(r => (r.dataset.productId || r.value) == opt.id);
        if (!radio) return;

        window.productMap = window.productMap || {};

        const productId = radio.dataset.productId;
        if (!window.productMap[productId]) {
          window.productMap[productId] = opt;
        }

        const originalGroup = radio.closest('.signup__electrical_product_name');
        const helpText = originalGroup?.querySelector('.signup__form-help');

        // price strictly from PRICE_MAP (colleague's approach)
        opt.price = CONFIG.PRICE_MAP.get(Number(opt.id));

        const optionContainer = document.createElement('div');
        optionContainer.className = 'housing-option-card';
        optionContainer.dataset.productId = String(opt.id);
        optionContainer.setAttribute('role', 'button');
        optionContainer.tabIndex = 0;
        const isInitiallyChecked = radio.checked;
        if (isInitiallyChecked) {
            optionContainer.classList.add('selected');
            optionContainer.setAttribute('data-selected', 'true');
        } else {
            optionContainer.classList.remove('selected');
            optionContainer.setAttribute('data-selected', 'false');
        }

    const img = document.createElement('img');
        // Always start with "off" image
    img.src = opt.image;
    img.alt = opt.label;
    img.dataset.defaultImage = opt.image;
    img.dataset.hoverImage = opt.hoverImage;
    img.dataset.selectedImage = opt.selectedImage;

        const label = document.createElement('div');
        label.className = 'housing-option-label';
        label.textContent = opt.label;

        const help = helpText ? helpText.cloneNode(true) : null;
        if (help) {
            help.className = 'housing-option-help';
        }

        const select = async () => {
            document.querySelectorAll('input[type="radio"][name="prospect[electrical_product_name]"]').forEach(r => r.checked = false);
            document.querySelectorAll('input[type="hidden"][name="prospect[electrical_product_id]"]').forEach(hi => hi.disabled = true);
            radio.checked = true;

            // Enable the hidden input matching this product ID
            const hiddenInput = container.querySelector(
                `input[type="hidden"][name="prospect[electrical_product_id]"][value="${radio.dataset.productId}"]`
            );
            if (hiddenInput) hiddenInput.disabled = false;

            // Store selection for price card/summary
            storeSelectedProductFromId(radio.dataset.productId);

            // Trigger change events to ensure form validation
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            radio.dispatchEvent(new Event('input', { bubbles: true }));
            
            const radioField = radio.closest('.signup__form-field--radio');
            if (radioField) {
                radioField.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // Update all option visuals
            imgWrapper.querySelectorAll('.housing-option-card').forEach((card) => {
                const pid = card.dataset.productId;
                const info = window.productInfoMap?.get(pid);
                const matchedRadio = allRadios.find(r => (r.dataset.productId || r.value) == pid);
                const img = card.querySelector('img');
                
                if (matchedRadio && matchedRadio.checked) {
                    card.classList.add('selected');
                    card.setAttribute('data-selected', 'true');
                    if (img && info) img.src = info.selectedImage;
                } else {
                    card.classList.remove('selected');
                    card.setAttribute('data-selected', 'false');
                    if (img && info) img.src = info.image;
                }
            });
            
            // Automatically submit and go to next step after a short delay to ensure events are processed
            setTimeout(() => {
                const nextButton = document.querySelector(CONFIG.SELECTOR_NEXT_BUTTON);
                if (nextButton) {
                    // Temporarily enable button if disabled
                    const wasDisabled = nextButton.disabled;
                    if (wasDisabled) {
                        nextButton.disabled = false;
                    }
                    nextButton.click();
                    // Restore disabled state if it was disabled
                    if (wasDisabled) {
                        setTimeout(() => {
                            nextButton.disabled = wasDisabled;
                        }, CONFIG.DELAY_BUTTON_CLICK);
                    }
                }
            }, CONFIG.DELAY_BUTTON_CLICK);
        };

        // Add hover event listeners for image switching
        optionContainer.addEventListener('mouseenter', function() {
            const isSelected = this.classList.contains('selected') || this.getAttribute('data-selected') === 'true';
            if (!isSelected) {
                img.src = opt.hoverImage;
            }
        });
        
        optionContainer.addEventListener('mouseleave', function() {
            const isSelected = this.classList.contains('selected') || this.getAttribute('data-selected') === 'true';
            if (!isSelected) {
                img.src = opt.image;
            }
        });

        // Keyboard support for accessibility
        optionContainer.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                select();
            }
        });

        optionContainer.addEventListener('click', select);
        optionContainer.appendChild(img);
        optionContainer.appendChild(label);
        if (help) optionContainer.appendChild(help);
        cards.push(optionContainer);
    });

    // Add all cards at once to DOM
    cards.forEach(card => imgWrapper.appendChild(card));
    container.appendChild(imgWrapper);

    // Initial sync: respect any prechecked radio (from server / persisted form)
    const initiallyChecked = allRadios.find(r => r.checked);
    if (initiallyChecked) {
        const hiddenInput = container.querySelector(
            `input[type="hidden"][name="prospect[electrical_product_id]"][value="${initiallyChecked.dataset.productId}"]`
        );
        if (hiddenInput) hiddenInput.disabled = false;

        imgWrapper.querySelectorAll('.housing-option-card').forEach((card) => {
            const pid = card.dataset.productId;
            const info = window.productInfoMap?.get(pid);
            const img = card.querySelector('img');
            const matchedRadio = allRadios.find(r => (r.dataset.productId || r.value) == pid);
            const isSel = matchedRadio && matchedRadio.checked;
            card.classList.toggle('selected', !!isSel);
            card.setAttribute('data-selected', isSel ? 'true' : 'false');
            if (img && info) img.src = isSel ? info.selectedImage : info.image;
        });

        storeSelectedProductFromId(initiallyChecked.dataset.productId);
    }
});

function initSituationSelector(root) {
    const scope = root || document;
    const situationContainer = scope.querySelector('.signup__situation');
    if (!situationContainer) return;
    
    // Tjek om vi allerede har oprettet selector'en
    if (situationContainer.querySelector('.situation-type-selector')) {
        return; // Allerede initialiseret
    }
    
    const situationOptions = [
        {
            value: 'change_of_supplier',
            image: `${CONFIG.VERCEL_IMAGE_BASE}/house_with_man.png`,
            label: 'Jeg ønsker at skifte elleverandør'
        },
        {
            value: 'move',
            image: `${CONFIG.VERCEL_IMAGE_BASE}/hus_og_bil.png`,
            label: 'Jeg skal flytte eller er lige flyttet ind'
        }
    ];

    // Find og skjul original radio buttons
    const radioFields = situationContainer.querySelectorAll('.signup__form-field--radio');
    radioFields.forEach(field => field.style.display = 'none');

    // Create wrapper for the image selector UI
    const situationWrapper = document.createElement('div');
    situationWrapper.className = 'situation-type-selector';

    // Create all cards first, then add them all at once to prevent staggered animation timing issues
    const situationCards = [];

    situationOptions.forEach(opt => {
        // Prøv forskellige måder at finde radio button på
        let radio = situationContainer.querySelector(`input[type="radio"][name*="situation"][value*="${opt.value}"]`);
        
        if (!radio) {
            // Prøv at finde via label tekst
            const labels = situationContainer.querySelectorAll('label');
            for (let label of labels) {
                const labelText = label.textContent.trim().toLowerCase();
                if ((opt.value === 'change_of_supplier' && (labelText.includes('skifte') || labelText.includes('elleverandør'))) ||
                    (opt.value === 'move' && (labelText.includes('flytte') || labelText.includes('flyttet')))) {
                    radio = label.querySelector('input[type="radio"]');
                    if (radio) break;
                }
            }
        }
        
        if (!radio) {
            // Hvis stadig ikke fundet, prøv at finde alle situation radios og match baseret på position
            const allRadios = situationContainer.querySelectorAll('input[type="radio"][name*="situation"]');
            if (allRadios.length >= 2) {
                radio = opt.value === 'change_of_supplier' ? allRadios[0] : allRadios[1];
            }
        }
        
        if (!radio) return;

        const optionCard = document.createElement('div');
        optionCard.className = 'situation-option-card';
        if (radio.checked) {
            optionCard.classList.add('selected');
            optionCard.setAttribute('data-selected', 'true');
        }
        optionCard.setAttribute('role', 'button');
        optionCard.tabIndex = 0;

        const img = document.createElement('img');
        img.src = opt.image;
        img.alt = opt.label;

        const label = document.createElement('div');
        label.className = 'situation-option-label';
        label.textContent = opt.label;

        const selectSituation = () => {
            // Uncheck all situation radios
            situationContainer.querySelectorAll('input[type="radio"][name*="situation"]').forEach(r => r.checked = false);
            radio.checked = true;
            
            // Trigger change event on radio to ensure form validation works
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            radio.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Update next button state (will be called automatically by event listeners)
            updateNextButtonState();

            // Update all option visuals
            situationWrapper.querySelectorAll('.situation-option-card').forEach((card) => {
                const cardRadioId = card.dataset.radioId;
                const cardRadio = cardRadioId ? document.getElementById(cardRadioId) : null;
                
                if (cardRadio && cardRadio.checked) {
                    card.classList.add('selected');
                    card.setAttribute('data-selected', 'true');
                } else {
                    card.classList.remove('selected');
                    card.setAttribute('data-selected', 'false');
                }
            });
        };

        if (!radio.id) {
            radio.id = `situation_radio_${opt.value}_${Date.now()}`;
        }
        optionCard.dataset.value = opt.value;
        optionCard.dataset.radioId = radio.id;
        optionCard.addEventListener('click', selectSituation);
        optionCard.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectSituation();
            }
        });
        optionCard.appendChild(img);
        optionCard.appendChild(label);
        
        situationCards.push(optionCard);
    });

    // Add all cards at once to DOM
    situationCards.forEach(card => situationWrapper.appendChild(card));

    // Find insert point - after section title, but ensure date/checkbox sections come AFTER cards
    const sectionTitle = situationContainer.querySelector('.signup__section-title');
    
    // Insert after title
    if (sectionTitle) {
        if (sectionTitle.nextSibling) {
            situationContainer.insertBefore(situationWrapper, sectionTitle.nextSibling);
        } else {
            situationContainer.appendChild(situationWrapper);
        }
    } else {
        // Insert at beginning if no title
        situationContainer.insertBefore(situationWrapper, situationContainer.firstChild);
    }
}

// Init situation selector on both initial DOM load (for validation error reloads) and group loads
document.addEventListener('DOMContentLoaded', () => initSituationSelector(document));
document.addEventListener('group:loaded', (e) => {
    initSituationSelector(e?.detail?.container || document);
});

// Fallback: observe DOM changes in group container to (re)init situation cards after partial updates/validation reloads
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector(CONFIG.SELECTOR_GROUP_CONTAINER);
    if (!container) return;

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            const added = Array.from(mutation.addedNodes || []);
            if (added.some(node =>
                node.nodeType === 1 &&
                (node.matches?.('.signup__situation') || node.querySelector?.('.signup__situation'))
            )) {
                initSituationSelector(container);
                break;
            }
        }
    });

    observer.observe(container, { childList: true, subtree: true });
});

// Gas product selector - konverter radio buttons til store tekst knapper
document.addEventListener('group:loaded', function() {
    const nextButton = document.querySelector(CONFIG.SELECTOR_NEXT_BUTTON);
    const gasSection = document.querySelector('.signup__section--gas_product');
    if (nextButton) {
        const gasVisible = gasSection && gasSection.offsetParent !== null;
        if (gasVisible) {
            nextButton.style.display = 'none';
        } else {
            nextButton.style.display = '';
        }
    }

    const gasContainer = document.querySelector('.signup__gas_product');
    if (!gasContainer) {
        return;
    }
    
    // Tjek om vi allerede har oprettet selector'en
    if (gasContainer.querySelector('.gas-type-selector')) {
        return; // Allerede initialiseret
    }

    // Find alle gas radio buttons
    const radioFields = gasContainer.querySelectorAll('.signup__form-field--radio');
    if (radioFields.length === 0) {
        return;
    }

    // Find og skjul original radio buttons
    radioFields.forEach(field => field.style.display = 'none');

    // Create wrapper for the button selector UI
    const gasWrapper = document.createElement('div');
    gasWrapper.className = 'gas-type-selector';

    // Find alle radio buttons og deres labels
    const allRadios = gasContainer.querySelectorAll('input[type="radio"][name*="gas"]');
    
    // Create all cards first, then add them all at once to prevent staggered animation timing issues
    const gasCards = [];
    
    allRadios.forEach((radio, index) => {
        // Find label tekst
        const radioField = radio.closest('.signup__form-field--radio');
        if (!radioField) return;
        
        const labelElement = radioField.querySelector('label');
        if (!labelElement) return;
        
        // Find label tekst (fjern radio button elementer fra teksten)
        const labelText = labelElement.cloneNode(true);
        labelText.querySelectorAll('input, span.signup__radio-wrap, span.signup__radio-pseudo').forEach(el => el.remove());
        const labelTextContent = labelText.textContent.trim();
        
        if (!labelTextContent) return;

        const optionCard = document.createElement('div');
        optionCard.className = 'gas-option-card';
        if (radio.checked) {
            optionCard.classList.add('selected');
            optionCard.setAttribute('data-selected', 'true');
        }
        optionCard.setAttribute('role', 'button');
        optionCard.tabIndex = 0;

        const label = document.createElement('div');
        label.className = 'gas-option-label';
        label.textContent = labelTextContent;

        const selectGas = () => {
            // Uncheck all gas radios with same name
            const radioName = radio.name;
            gasContainer.querySelectorAll(`input[type="radio"][name="${radioName}"]`).forEach(r => r.checked = false);
            radio.checked = true;
            
            // Trigger change event on radio to ensure form validation works
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            radio.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Also trigger on the form field container
            const radioField = radio.closest('.signup__form-field--radio');
            if (radioField) {
                radioField.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // Update next button state after selection
            setTimeout(() => {
                updateNextButtonState();
            }, CONFIG.DELAY_BUTTON_STATE_UPDATE);

            // Update all option visuals
            gasWrapper.querySelectorAll('.gas-option-card').forEach((card) => {
                const cardRadioId = card.dataset.radioId;
                const cardRadio = cardRadioId ? document.getElementById(cardRadioId) : null;
                
                if (cardRadio && cardRadio.checked) {
                    card.classList.add('selected');
                    card.setAttribute('data-selected', 'true');
                } else {
                    card.classList.remove('selected');
                    card.setAttribute('data-selected', 'false');
                }
            });

            // Auto-advance: hide next button on gas step and click it programmatically
            const nextButton = document.querySelector(CONFIG.SELECTOR_NEXT_BUTTON);
            if (nextButton) {
                nextButton.style.display = 'none';
                const wasDisabled = nextButton.disabled;
                if (wasDisabled) nextButton.disabled = false;
                setTimeout(() => {
                    nextButton.click();
                    if (wasDisabled) {
                        setTimeout(() => { nextButton.disabled = wasDisabled; }, CONFIG.DELAY_BUTTON_CLICK);
                    }
                }, CONFIG.DELAY_BUTTON_CLICK);
            }
        };

        if (!radio.id) {
            radio.id = `gas_radio_${index}_${Date.now()}`;
        }
        optionCard.dataset.radioId = radio.id;
        optionCard.addEventListener('click', selectGas);
        optionCard.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectGas();
            }
        });
        optionCard.appendChild(label);
        
        gasCards.push(optionCard);
    });

    // Add all cards at once to DOM
    gasCards.forEach(card => gasWrapper.appendChild(card));

    // Find insert point - after section title
    const sectionTitle = gasContainer.querySelector('.signup__section-title');

    // Insert after title
    if (sectionTitle) {
        if (sectionTitle.nextSibling) {
            gasContainer.insertBefore(gasWrapper, sectionTitle.nextSibling);
        } else {
            gasContainer.appendChild(gasWrapper);
        }
    } else {
        // Insert at beginning if no title
        gasContainer.insertBefore(gasWrapper, gasContainer.firstChild);
    }

    // Add gas disclaimer text AFTER the gas wrapper (not inside it)
    const gasDisclaimer = document.createElement('div');
    gasDisclaimer.className = 'gas-disclaimer-text';
    gasDisclaimer.innerHTML = CONFIG.GAS_DISCLAIMER_TEXT;

    // Insert after gasWrapper
    if (gasWrapper.nextSibling) {
        gasContainer.insertBefore(gasDisclaimer, gasWrapper.nextSibling);
    } else {
        gasContainer.appendChild(gasDisclaimer);
    }
});

// Installation address selector - konverter radio buttons til store tekst knapper
document.addEventListener('group:loaded', function() {
    const installationContainer = document.querySelector('.signup__installation_address_select');
    if (!installationContainer) return;
    
    // Tjek om vi allerede har oprettet selector'en
    if (installationContainer.querySelector('.installation-type-selector')) {
        return; // Allerede initialiseret
    }

    // Find alle radio buttons og deres labels - prøv forskellige navne
    let allRadios = installationContainer.querySelectorAll('input[type="radio"][name*="installation"]');
    
    // Hvis ingen fundet, prøv at finde alle radio buttons i containeren
    if (allRadios.length === 0) {
        allRadios = installationContainer.querySelectorAll('input[type="radio"]');
    }
    
    // Hvis stadig ingen, prøv at finde via form-group
    if (allRadios.length === 0) {
        const formGroup = installationContainer.querySelector('.signup__form-group');
        if (formGroup) {
            allRadios = formGroup.querySelectorAll('input[type="radio"]');
        }
    }
    
    if (allRadios.length === 0) {
        return;
    }

    // Find alle installation radio button fields
    const radioFields = installationContainer.querySelectorAll('.signup__form-field--radio');
    
    // Find og skjul original radio buttons (kun hvis vi har fundet nogle)
    radioFields.forEach(field => field.style.display = 'none');

    // Create wrapper for the button selector UI
    const installationWrapper = document.createElement('div');
    installationWrapper.className = 'installation-type-selector';
    
    // Create all cards first, then add them all at once to prevent staggered animation timing issues
    const installationCards = [];
    
    allRadios.forEach((radio, index) => {
        // Find label tekst
        const radioField = radio.closest('.signup__form-field--radio');
        if (!radioField) return;
        
        const labelElement = radioField.querySelector('label');
        if (!labelElement) return;
        
        // Find label tekst (fjern radio button elementer fra teksten)
        const labelText = labelElement.cloneNode(true);
        labelText.querySelectorAll('input, span.signup__radio-wrap, span.signup__radio-pseudo').forEach(el => el.remove());
        const labelTextContent = labelText.textContent.trim();
        
        if (!labelTextContent) return;

        const optionCard = document.createElement('div');
        optionCard.className = 'installation-option-card';
        if (radio.checked) {
            optionCard.classList.add('selected');
            optionCard.setAttribute('data-selected', 'true');
        }
        optionCard.setAttribute('role', 'button');
        optionCard.tabIndex = 0;

        const label = document.createElement('div');
        label.className = 'installation-option-label';
        label.textContent = labelTextContent;

        const selectInstallation = () => {
            // Uncheck all radios with same name
            const radioName = radio.name;
            installationContainer.querySelectorAll(`input[type="radio"][name="${radioName}"]`).forEach(r => r.checked = false);
            radio.checked = true;
            
            // Trigger change event on radio to ensure form validation works
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            radio.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Also trigger on the form field container
            const radioField = radio.closest('.signup__form-field--radio');
            if (radioField) {
                radioField.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // Button state will be updated automatically by event listeners

            // Update all option visuals
            installationWrapper.querySelectorAll('.installation-option-card').forEach((card) => {
                const cardRadioId = card.dataset.radioId;
                const cardRadio = cardRadioId ? document.getElementById(cardRadioId) : null;
                
                if (cardRadio && cardRadio.checked) {
                    card.classList.add('selected');
                    card.setAttribute('data-selected', 'true');
                } else {
                    card.classList.remove('selected');
                    card.setAttribute('data-selected', 'false');
                }
            });
        };

        if (!radio.id) {
            radio.id = `installation_radio_${index}_${Date.now()}`;
        }
        optionCard.dataset.radioId = radio.id;
        optionCard.addEventListener('click', selectInstallation);
        optionCard.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectInstallation();
            }
        });
        optionCard.appendChild(label);
        
        installationCards.push(optionCard);
    });

    // Add all cards at once to DOM
    installationCards.forEach(card => installationWrapper.appendChild(card));

    // Find insert point - after section title or form group
    const sectionTitle = installationContainer.querySelector('.signup__section-title');
    const formGroup = installationContainer.querySelector('.signup__form-group');
    
    // Insert after title or form group
    if (sectionTitle) {
        if (sectionTitle.nextSibling) {
            installationContainer.insertBefore(installationWrapper, sectionTitle.nextSibling);
        } else {
            installationContainer.appendChild(installationWrapper);
        }
    } else if (formGroup) {
        if (formGroup.nextSibling) {
            installationContainer.insertBefore(installationWrapper, formGroup.nextSibling);
        } else {
            installationContainer.appendChild(installationWrapper);
        }
    } else {
        // Insert at beginning if no title
        installationContainer.insertBefore(installationWrapper, installationContainer.firstChild);
    }
});

// Make date input fields fully clickable (only label and input, not entire form-field)
function makeDateInputsClickable() {
    const dateInputs = document.querySelectorAll('.signup__situation_cos_start_date input[type="date"], .signup__situation_move_start_date input[type="date"]');
    
    dateInputs.forEach(input => {
        const label = input.closest('label');
        if (!label) return;
        
        // Remove existing click handlers if any
        label.removeEventListener('click', handleDateLabelClick);
        input.removeEventListener('click', handleDateInputClick);
        
        // Add click handler to label (which contains the input)
        label.addEventListener('click', handleDateLabelClick);
        
        // Also ensure input itself triggers calendar
        input.addEventListener('click', handleDateInputClick);
    });
}

function handleDateLabelClick(e) {
    // Only trigger if clicking on the label itself or input, not nested elements
    if (e.target === e.currentTarget || e.target.type === 'date') {
        const dateInput = e.currentTarget.querySelector('input[type="date"]');
        if (dateInput && typeof dateInput.showPicker === 'function') {
            e.preventDefault();
            dateInput.focus();
            dateInput.showPicker();
        }
    }
}

function handleDateInputClick(e) {
    // Direct click on input - open calendar
    if (this.type === 'date' && typeof this.showPicker === 'function') {
        e.stopPropagation();
        this.showPicker();
    }
}

// Ensure calendar icons are visible and properly positioned
function ensureCalendarIconsVisible() {
    const dateLabels = document.querySelectorAll('.signup__situation_cos_start_date .signup__form-field:has(input[type="date"]) label, .signup__situation_move_start_date .signup__form-field:has(input[type="date"]) label');
    
    dateLabels.forEach(label => {
        // Ensure label has position relative for icon positioning
        if (window.getComputedStyle(label).position === 'static') {
            label.style.position = 'relative';
        }
        
        // Check if icon exists, if not, ensure it's visible via CSS
        const dateInput = label.querySelector('input[type="date"]');
        if (dateInput) {
            // Force calendar icon to be visible
            label.style.setProperty('position', 'relative', 'important');
            
            // Add placeholder "dd" functionality for empty date inputs
            // Since date inputs don't support placeholder, we'll add a data attribute and style it
            if (!dateInput.value) {
                dateInput.setAttribute('data-placeholder', 'dd');
            }
            
            // Update placeholder on change
            dateInput.addEventListener('change', function() {
                if (this.value) {
                    this.removeAttribute('data-placeholder');
                } else {
                    this.setAttribute('data-placeholder', 'dd');
                }
            });
        }
    });
}


// Reorganize COS and Move section elements to correct order
function reorganizeSituationElements() {
    // COS section: Checkbox -> Date picker -> Legal text
    const cosMore = document.querySelector('.signup__situation_cos_more');
    if (cosMore) {
        const checkboxField = cosMore.querySelector('.signup__form-field--checkbox');
        const dateSection = cosMore.querySelector('.signup__situation_cos_start_date');
        
        if (checkboxField && dateSection) {
            // Ensure checkbox is first, then date section
            if (cosMore.firstElementChild !== checkboxField) {
                cosMore.insertBefore(checkboxField, cosMore.firstElementChild);
            }
            
            // COS date section should be hidden by default - only show when checkbox is checked
            const checkbox = checkboxField.querySelector('input[type="checkbox"]');
            if (checkbox && !checkbox.checked) {
                dateSection.style.display = 'none';
                dateSection.style.visibility = 'hidden';
                dateSection.style.opacity = '0';
            } else if (checkbox && checkbox.checked) {
                dateSection.style.display = 'flex';
                dateSection.style.visibility = 'visible';
                dateSection.style.opacity = '1';
            }
        }
    }
    
    // Move section: Date picker -> Text -> Checkbox
    const moveStartDate = document.querySelector('.signup__situation_move_start_date');
    if (moveStartDate) {
        const dateField = moveStartDate.querySelector('.signup__form-field:not(.signup__situation_move_acknowledged)');
        const helpText = moveStartDate.querySelector('.signup__form-help');
        const checkboxField = moveStartDate.querySelector('.signup__situation_move_acknowledged');
        
        if (dateField && helpText && checkboxField) {
            const parent = moveStartDate;
            
            // Remove all elements
            const elements = [dateField, helpText, checkboxField];
            elements.forEach(el => {
                if (el && el.parentNode === parent) {
                    parent.removeChild(el);
                }
            });
            
            // Reorder: date field first, then help text, then checkbox
            parent.appendChild(dateField);
            parent.appendChild(helpText);
            parent.appendChild(checkboxField);
        }
    }
    
    // Make date inputs clickable after reorganization
    makeDateInputsClickable();
    
    // Ensure calendar icons are visible and properly positioned
    ensureCalendarIconsVisible();
}

// Initialize reorganization
document.addEventListener('DOMContentLoaded', () => {
    reorganizeSituationElements();
    makeDateInputsClickable();
    ensureCalendarIconsVisible();
});
document.addEventListener('group:loaded', () => {
    reorganizeSituationElements();
    makeDateInputsClickable();
    ensureCalendarIconsVisible();
});

// Handle COS checkbox toggle - show/hide date section
document.addEventListener('change', function(e) {
    // Handle COS checkbox toggle - show/hide date section
    if (e.target.matches('.signup__situation_cos_more input[type="checkbox"]')) {
        const dateSection = document.querySelector('.signup__situation_cos_start_date');
        if (dateSection) {
            if (e.target.checked) {
                dateSection.style.display = 'flex';
                dateSection.style.visibility = 'visible';
                dateSection.style.opacity = '1';
            } else {
                dateSection.style.display = 'none';
                dateSection.style.visibility = 'hidden';
                dateSection.style.opacity = '0';
            }
            // Update button state after toggle
            setTimeout(updateNextButtonState, 50);
        }
    }
    
    // Also reorganize when situation changes
    if (e.target.matches('input[type="radio"][name*="situation"]')) {
        setTimeout(reorganizeSituationElements, CONFIG.DELAY_REORGANIZE);
    }
});

// Also reorganize when situation changes
document.addEventListener('change', function(e) {
    if (e.target.matches('input[type="radio"][name*="situation"]')) {
        setTimeout(reorganizeSituationElements, CONFIG.DELAY_REORGANIZE);
    }
});

// Add-on products - organize into groups with titles and descriptions
function organizeAddOnProducts(root) {
  const scope = root || document;
  const container = scope.querySelector('.signup__electrical_additional_products');
  if (!container) return;

  // Check if already organized
  if (container.querySelector('.addon-group-section')) return;

  // Find all form groups with checkboxes (valgfrie produkter)
  const formGroups = container.querySelectorAll('.signup__form-group');
  if (formGroups.length === 0) return;

  // Separate products: valgfrie (alle checkboxes) vs "ikke ladestander" (skal være en simpel knap)
  const optionalProducts = [];
  const hasNoChargerProducts = [];
  
  formGroups.forEach(formGroup => {
    // Check for both checkbox and radio (since we convert checkboxes to radio) and allow original name
    const checkbox = formGroup.querySelector('input[type="checkbox"], input[type="radio"][name="prospect[product_options_radio]"], input[type="radio"][name="prospect[product_options][]"]');
    if (!checkbox) return;
    
    const checkboxText = formGroup.querySelector('.signup__checkbox-text')?.textContent?.toLowerCase() || '';
    const productName = checkbox.dataset.productName?.toLowerCase() || '';
    const fullText = (checkboxText + ' ' + productName).toLowerCase();
    
    // Check if this is "ikke ladestander" product
    const isNoChargerProduct = CONFIG.KEYWORD_NO_CHARGER.some(keyword => fullText.includes(keyword));
    if (isNoChargerProduct) {
      hasNoChargerProducts.push(formGroup);
    } else {
      // All other products are optional and go in first toggle
      optionalProducts.push(formGroup);
    }
  });

  // Clear container and rebuild with groups
  container.innerHTML = '';

  // First toggle: "Jeg har elbil..." - shows all optional products
  if (optionalProducts.length > 0) {
    const section1 = document.createElement('div');
    section1.className = 'addon-group-section';

    const headerCard1 = document.createElement('div');
    headerCard1.className = 'addon-group-header';
    headerCard1.setAttribute('role', 'button');
    headerCard1.setAttribute('tabindex', '0');
    headerCard1.setAttribute('role', 'button');
    headerCard1.setAttribute('tabindex', '0');
    
    // Tooltip icon - positioned in top right corner
    const tooltipIcon1 = document.createElement('div');
    tooltipIcon1.className = 'addon-tooltip-icon';
    tooltipIcon1.setAttribute('aria-label', CONFIG.TOOLTIP_HELP_LABEL);
    tooltipIcon1.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.3125C5.87512 1.3125 4.7755 1.64607 3.8402 2.27102C2.90489 2.89597 2.17591 3.78423 1.74544 4.82349C1.31496 5.86274 1.20233 7.00631 1.42179 8.10958C1.64124 9.21284 2.18292 10.2263 2.97833 11.0217C3.77374 11.8171 4.78716 12.3588 5.89043 12.5782C6.99369 12.7977 8.13726 12.685 9.17651 12.2546C10.2158 11.8241 11.104 11.0951 11.729 10.1598C12.3539 9.2245 12.6875 8.12488 12.6875 7C12.6861 5.49203 12.0864 4.04623 11.0201 2.97993C9.95377 1.91363 8.50798 1.31395 7 1.3125ZM7 11.8125C6.04818 11.8125 5.11773 11.5303 4.32632 11.0014C3.53491 10.4726 2.91808 9.72103 2.55383 8.84166C2.18959 7.9623 2.09428 6.99466 2.27997 6.06113C2.46566 5.12759 2.92401 4.27009 3.59705 3.59705C4.27009 2.92401 5.1276 2.46566 6.06113 2.27997C6.99466 2.09428 7.9623 2.18958 8.84167 2.55383C9.72104 2.91808 10.4726 3.53491 11.0014 4.32632C11.5303 5.11773 11.8125 6.04818 11.8125 7C11.8111 8.27591 11.3036 9.49915 10.4014 10.4014C9.49915 11.3036 8.27591 11.8111 7 11.8125ZM7.65625 9.84375C7.65625 9.97354 7.61776 10.1004 7.54565 10.2083C7.47354 10.3163 7.37105 10.4004 7.25114 10.45C7.13122 10.4997 6.99927 10.5127 6.87197 10.4874C6.74467 10.4621 6.62774 10.3996 6.53596 10.3078C6.44419 10.216 6.38168 10.0991 6.35636 9.97178C6.33104 9.84448 6.34404 9.71253 6.39371 9.59261C6.44338 9.4727 6.52749 9.37021 6.63541 9.2981C6.74333 9.22599 6.87021 9.1875 7 9.1875C7.17405 9.1875 7.34097 9.25664 7.46404 9.37971C7.58711 9.50278 7.65625 9.6697 7.65625 9.84375ZM8.96875 5.90625C8.96875 6.35236 8.81725 6.78524 8.53905 7.13399C8.26085 7.48273 7.87246 7.72665 7.4375 7.82578V7.875C7.4375 7.99103 7.39141 8.10231 7.30936 8.18436C7.22731 8.26641 7.11603 8.3125 7 8.3125C6.88397 8.3125 6.77269 8.26641 6.69064 8.18436C6.6086 8.10231 6.5625 7.99103 6.5625 7.875V7.4375C6.5625 7.32147 6.6086 7.21019 6.69064 7.12814C6.77269 7.04609 6.88397 7 7 7C7.21633 7 7.42779 6.93585 7.60766 6.81567C7.78752 6.69549 7.92771 6.52467 8.0105 6.32481C8.09328 6.12495 8.11494 5.90504 8.07274 5.69287C8.03053 5.4807 7.92636 5.28582 7.7734 5.13285C7.62044 4.97989 7.42555 4.87572 7.21338 4.83352C7.00122 4.79131 6.7813 4.81297 6.58144 4.89576C6.38159 4.97854 6.21077 5.11873 6.09058 5.29859C5.9704 5.47846 5.90625 5.68993 5.90625 5.90625C5.90625 6.02228 5.86016 6.13356 5.77811 6.21561C5.69606 6.29766 5.58478 6.34375 5.46875 6.34375C5.35272 6.34375 5.24144 6.29766 5.15939 6.21561C5.07735 6.13356 5.03125 6.02228 5.03125 5.90625C5.03125 5.38411 5.23867 4.88335 5.60789 4.51413C5.9771 4.14492 6.47786 3.9375 7 3.9375C7.52215 3.9375 8.02291 4.14492 8.39212 4.51413C8.76133 4.88335 8.96875 5.38411 8.96875 5.90625Z" fill="black" fill-opacity="0.3"/></svg>';
    const tooltipText1 = document.createElement('div');
    tooltipText1.className = 'addon-tooltip-text';
    tooltipText1.textContent = CONFIG.TOOLTIP_TEXT_CHARGING;
    tooltipIcon1.appendChild(tooltipText1);
    headerCard1.appendChild(tooltipIcon1);
    
    const title1 = document.createElement('h3');
    title1.className = 'signup__group-title';
    title1.textContent = CONFIG.TITLE_CHARGING;
    headerCard1.appendChild(title1);

    const desc1a = document.createElement('p');
    desc1a.className = 'addon-group-description-line1';
    desc1a.textContent = CONFIG.DESC_CHARGING_LINE1;
    headerCard1.appendChild(desc1a);

    const desc1b = document.createElement('p');
    desc1b.className = 'addon-group-description-line2';
    desc1b.innerHTML = CONFIG.DESC_CHARGING_LINE2;
    headerCard1.appendChild(desc1b);

    const contentWrapper1 = document.createElement('div');
    contentWrapper1.className = 'addon-group-content addon-group-content--hidden';

    const subHeading1 = document.createElement('h4');
    subHeading1.className = 'addon-sub-heading';
    subHeading1.textContent = CONFIG.SUBHEADING_SOLUTION;
    contentWrapper1.appendChild(subHeading1);

    // Helper: select/unselect ladestander product
    const setChargerSelection = (checked) => {
      const chargerInput = optionalProducts
        .map(pg => pg.querySelector('input[type="radio"], input[type="checkbox"]'))
        .find(inp => {
          const fullText = (inp?.dataset.productName || '').toLowerCase();
          return CONFIG.KEYWORD_NO_CHARGER.some(k => fullText.includes(k)) === false;
        });
      if (chargerInput) {
        chargerInput.checked = checked;
        chargerInput.dispatchEvent(new Event('change', { bubbles: true }));
        chargerInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      // Uncheck all other add-ons when selecting charger (single choice)
      if (checked) {
        optionalProducts.forEach(pg => {
          const inp = pg.querySelector('input[type="radio"], input[type="checkbox"]');
          if (inp && inp !== chargerInput) {
            inp.checked = false;
          }
        });
      }
    };

    optionalProducts.forEach(formGroup => {
      // Make each product focusable and keyboard-activatable
      formGroup.tabIndex = 0;
      formGroup.setAttribute('role', 'button');
      formGroup.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          const inp = formGroup.querySelector('input[type="radio"], input[type="checkbox"]');
          if (inp) {
            inp.click();
          }
        }
      });
      contentWrapper1.appendChild(formGroup);
    });

    const toggleContent1 = (e) => {
      // Don't toggle if clicking on tooltip icon
      if (e && e.target && e.target.closest('.addon-tooltip-icon')) {
        return;
      }
      const isOpen = !contentWrapper1.classList.contains('addon-group-content--hidden');
      contentWrapper1.classList.toggle('addon-group-content--hidden', isOpen);
      headerCard1.classList.toggle('open', !isOpen);
      headerCard1.setAttribute('aria-expanded', String(!isOpen));
      if (!isOpen) {
        const firstFocusable = contentWrapper1.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus();
      }
    };

    let suppressNextClick = false;

    headerCard1.addEventListener('click', (e) => {
      if (suppressNextClick) {
        suppressNextClick = false;
        return;
      }
      toggleContent1(e);
    });

    // Support keyboard activation (Enter/Space) on both keydown/keyup
    ['keydown', 'keyup'].forEach(evt => {
      headerCard1.addEventListener(evt, (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          suppressNextClick = true; // avoid Space firing click after keydown
          if (evt === 'keydown') {
            toggleContent1(e);
          }
        }
      });
    });

    // Closed by default; updated via toggle
    headerCard1.setAttribute('aria-expanded', 'false');

    section1.appendChild(headerCard1);
    section1.appendChild(contentWrapper1);
    container.appendChild(section1);
  }

  // Second toggle: "Jeg har ikke ladestander" - simple button to continue
  const section2 = document.createElement('div');
  section2.className = 'addon-group-section';

  const headerCard2 = document.createElement('div');
  headerCard2.className = 'addon-group-header addon-group-skip-button';
  headerCard2.setAttribute('role', 'button');
  headerCard2.setAttribute('tabindex', '0');
  
  // Tooltip icon - positioned in top right corner
  const tooltipIcon2 = document.createElement('div');
  tooltipIcon2.className = 'addon-tooltip-icon';
  tooltipIcon2.setAttribute('aria-label', CONFIG.TOOLTIP_HELP_LABEL);
  tooltipIcon2.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.3125C5.87512 1.3125 4.7755 1.64607 3.8402 2.27102C2.90489 2.89597 2.17591 3.78423 1.74544 4.82349C1.31496 5.86274 1.20233 7.00631 1.42179 8.10958C1.64124 9.21284 2.18292 10.2263 2.97833 11.0217C3.77374 11.8171 4.78716 12.3588 5.89043 12.5782C6.99369 12.7977 8.13726 12.685 9.17651 12.2546C10.2158 11.8241 11.104 11.0951 11.729 10.1598C12.3539 9.2245 12.6875 8.12488 12.6875 7C12.6861 5.49203 12.0864 4.04623 11.0201 2.97993C9.95377 1.91363 8.50798 1.31395 7 1.3125ZM7 11.8125C6.04818 11.8125 5.11773 11.5303 4.32632 11.0014C3.53491 10.4726 2.91808 9.72103 2.55383 8.84166C2.18959 7.9623 2.09428 6.99466 2.27997 6.06113C2.46566 5.12759 2.92401 4.27009 3.59705 3.59705C4.27009 2.92401 5.1276 2.46566 6.06113 2.27997C6.99466 2.09428 7.9623 2.18958 8.84167 2.55383C9.72104 2.91808 10.4726 3.53491 11.0014 4.32632C11.5303 5.11773 11.8125 6.04818 11.8125 7C11.8111 8.27591 11.3036 9.49915 10.4014 10.4014C9.49915 11.3036 8.27591 11.8111 7 11.8125ZM7.65625 9.84375C7.65625 9.97354 7.61776 10.1004 7.54565 10.2083C7.47354 10.3163 7.37105 10.4004 7.25114 10.45C7.13122 10.4997 6.99927 10.5127 6.87197 10.4874C6.74467 10.4621 6.62774 10.3996 6.53596 10.3078C6.44419 10.216 6.38168 10.0991 6.35636 9.97178C6.33104 9.84448 6.34404 9.71253 6.39371 9.59261C6.44338 9.4727 6.52749 9.37021 6.63541 9.2981C6.74333 9.22599 6.87021 9.1875 7 9.1875C7.17405 9.1875 7.34097 9.25664 7.46404 9.37971C7.58711 9.50278 7.65625 9.6697 7.65625 9.84375ZM8.96875 5.90625C8.96875 6.35236 8.81725 6.78524 8.53905 7.13399C8.26085 7.48273 7.87246 7.72665 7.4375 7.82578V7.875C7.4375 7.99103 7.39141 8.10231 7.30936 8.18436C7.22731 8.26641 7.11603 8.3125 7 8.3125C6.88397 8.3125 6.77269 8.26641 6.69064 8.18436C6.6086 8.10231 6.5625 7.99103 6.5625 7.875V7.4375C6.5625 7.32147 6.6086 7.21019 6.69064 7.12814C6.77269 7.04609 6.88397 7 7 7C7.21633 7 7.42779 6.93585 7.60766 6.81567C7.78752 6.69549 7.92771 6.52467 8.0105 6.32481C8.09328 6.12495 8.11494 5.90504 8.07274 5.69287C8.03053 5.4807 7.92636 5.28582 7.7734 5.13285C7.62044 4.97989 7.42555 4.87572 7.21338 4.83352C7.00122 4.79131 6.7813 4.81297 6.58144 4.89576C6.38159 4.97854 6.21077 5.11873 6.09058 5.29859C5.9704 5.47846 5.90625 5.68993 5.90625 5.90625C5.90625 6.02228 5.86016 6.13356 5.77811 6.21561C5.69606 6.29766 5.58478 6.34375 5.46875 6.34375C5.35272 6.34375 5.24144 6.29766 5.15939 6.21561C5.07735 6.13356 5.03125 6.02228 5.03125 5.90625C5.03125 5.38411 5.23867 4.88335 5.60789 4.51413C5.9771 4.14492 6.47786 3.9375 7 3.9375C7.52215 3.9375 8.02291 4.14492 8.39212 4.51413C8.76133 4.88335 8.96875 5.38411 8.96875 5.90625Z" fill="black" fill-opacity="0.3"/></svg>';
  const tooltipText2 = document.createElement('div');
  tooltipText2.className = 'addon-tooltip-text';
  tooltipText2.textContent = CONFIG.TOOLTIP_TEXT_NO_CHARGER;
  tooltipIcon2.appendChild(tooltipText2);
  headerCard2.appendChild(tooltipIcon2);
  
  const title2 = document.createElement('h3');
  title2.className = 'signup__group-title';
  title2.textContent = CONFIG.TITLE_NO_CHARGER;
  headerCard2.appendChild(title2);

  const desc2 = document.createElement('p');
  desc2.className = 'addon-group-description';
  desc2.textContent = CONFIG.DESC_NO_CHARGER;
  headerCard2.appendChild(desc2);

  // Click handler: just continue to next step (no products to select)
  headerCard2.addEventListener('click', (e) => {
    // Don't trigger if clicking on tooltip icon
    if (e.target.closest('.addon-tooltip-icon')) {
      return;
    }
    // Unselect any selected optional products (ladestander)
    const optInputs = document.querySelectorAll('.signup__electrical_additional_products input[type="radio"], .signup__electrical_additional_products input[type="checkbox"]');
    optInputs.forEach(inp => {
      if (inp.checked) {
        inp.checked = false;
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    // Clear add-on cart tracking
    if (window.addOnCart) {
      Object.keys(window.addOnCart).forEach(k => delete window.addOnCart[k]);
    }
    if (typeof updatePriceCard === 'function') {
      try { updatePriceCard(); } catch (e) {}
    }
    if (typeof updatePriceSection === 'function') {
      try { updatePriceSection(); } catch (e) {}
    }

    const nextButton = document.querySelector(CONFIG.SELECTOR_NEXT_BUTTON);
    if (nextButton && !nextButton.disabled) {
      // Force submit with empty add-on so backend clears previous selection
      const form = document.querySelector('form');
      let tempClear = null;
      if (form) {
        tempClear = document.createElement('input');
        tempClear.type = 'hidden';
        tempClear.name = 'prospect[product_options][]';
        tempClear.value = '';
        form.appendChild(tempClear);
      }
      nextButton.click();
      if (tempClear) {
        // Give the form a moment to consume the value
        setTimeout(() => {
          if (tempClear && tempClear.parentNode) {
            tempClear.parentNode.removeChild(tempClear);
          }
        }, 500);
      }
    }
  });

  headerCard2.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      headerCard2.click();
    }
  });

  section2.appendChild(headerCard2);
  container.appendChild(section2);

  // Add inclusion text at the very bottom after all addon groups
  const inclusionText = document.createElement('p');
  inclusionText.className = 'inclusion-text';
  inclusionText.textContent = CONFIG.CHARGING_INCLUSION_TEXT;
  container.appendChild(inclusionText);
}

// Add-on products - convert checkboxes to radio buttons so only one can be selected
function annotateAddOnCheckboxes(root) {
  const scope = root || document;
  const checkboxes = scope.querySelectorAll('input[name="prospect[product_options][]"]');
  
  // Convert all checkboxes to radio buttons with same name
  checkboxes.forEach((input, index) => {
    // Change type from checkbox to radio
    input.type = 'radio';

    // sæt class som din change lytter bruger
    input.classList.add('add_on_product_checkbox');
    // sæt id fra value
    input.dataset.productId = input.value;
    // find visningsnavn fra label
    const label = input.closest('label');
    const labelText = label ? label.textContent.trim() : '';
    // Remove checkbox text from label text to get clean product name
    const checkboxText = label?.querySelector('.signup__checkbox-text');
    const productName = checkboxText ? checkboxText.textContent.trim() : labelText;
    input.dataset.productName = productName || CONFIG.DEFAULT_UNKNOWN_PRODUCT;
    // hvis du ikke har pris, så sæt 0 eller hent fra et dataset hvis det findes
    if (!input.dataset.productPrice) input.dataset.productPrice = '0';
  });
  
  // Organize products into groups AFTER setting product names
  organizeAddOnProducts(root);
}

// Update next button state based on form validation
function updateNextButtonState() {
  const nextButton = document.querySelector(CONFIG.SELECTOR_NEXT_BUTTON);
  if (!nextButton) return;

  const container = document.querySelector(CONFIG.SELECTOR_GROUP_CONTAINER);
  if (!container) return;

  // Check if we're on electrical_product step (step 1) - button should be hidden but enabled for programmatic clicks
  if (container.querySelector('.signup__section--electrical_product')) {
    nextButton.disabled = false;
    return;
  }

  // Gas product step: keep enabled; button visibility handled elsewhere
  if (container.querySelector('.signup__section--gas_product')) {
    nextButton.disabled = false;
    return;
  }

  // Default: always enable; server/HTML5 handles validation
  nextButton.disabled = false;
}

// Make payment method cards fully clickable by handling clicks on the container
function movePaymentInputsToContainer(root) {
  const scope = root || document;
  const paymentSection = scope.querySelector('.signup__payment');
  if (!paymentSection) return;
  
  // Clean up any old cloned inputs from previous implementation
  const oldClonedInputs = paymentSection.querySelectorAll('input[type="radio"][data-moved-to-container]');
  oldClonedInputs.forEach(cloned => cloned.remove());
  
  const paymentCards = paymentSection.querySelectorAll('.signup__payment_method_name.signup__form-field--radio');
  
  paymentCards.forEach((card) => {
    // Find the original radio input (not already processed)
    const input = card.querySelector('input[type="radio"]:not([data-click-handler-added])');
    if (!input) return;
    
    // Mark as processed
    input.setAttribute('data-click-handler-added', 'true');
    
    // Hide original input visually but keep it functional for form submission
    input.style.position = 'absolute';
    input.style.opacity = '0';
    input.style.width = '0';
    input.style.height = '0';
    input.style.top = '0';
    input.style.left = '0';
    input.style.pointerEvents = 'none';
    
    // Make the entire card clickable
    card.style.cursor = 'pointer';
    card.style.position = 'relative';
    
    // Handle clicks on the entire card
    const handleCardClick = (e) => {
      // Don't handle if clicking directly on the input or its label
      if (e.target === input || e.target.closest('label') === input.closest('label')) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      // Uncheck all other radio buttons with same name
      const form = card.closest('form');
      if (form) {
        const allRadios = form.querySelectorAll(`input[type="radio"][name="${input.name}"]`);
        allRadios.forEach(radio => {
          if (radio !== input) {
            radio.checked = false;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }
      
      // Check this input
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    
    // Add click handler to card
    card.addEventListener('click', handleCardClick);
    
    // Also ensure the label click still works
    const label = card.querySelector('label');
    if (label) {
      label.addEventListener('click', (e) => {
        // Let the default label behavior handle it, but also trigger our handler
        setTimeout(() => {
          if (!input.checked) {
            handleCardClick(e);
          }
        }, 0);
      });
    }
  });
}

function setupPaymentMethodClickTracking(root) {
  return;
}

// Kald ved domready og når grupper loader
document.addEventListener('DOMContentLoaded', () => {
  annotateAddOnCheckboxes();
  movePaymentInputsToContainer();
  setupPaymentMethodClickTracking();
  updateNextButtonState();
});
document.addEventListener('group:loaded', e => {
  const container = e?.detail?.container || document;
  annotateAddOnCheckboxes(container);
  movePaymentInputsToContainer(container);
  setupPaymentMethodClickTracking(container);
  updateNextButtonState();
});

// Listen for input/change events to update button state
// Use event delegation for better performance
document.addEventListener('input', updateNextButtonState, true);
document.addEventListener('change', updateNextButtonState, true);

// Also update when form validation state changes (e.g., when errors are shown/hidden)
// Use MutationObserver to watch for changes to error states
const validationObserver = new MutationObserver(() => {
  updateNextButtonState();
});

// Observe the container for changes to error classes
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector(CONFIG.SELECTOR_GROUP_CONTAINER);
  if (container) {
    validationObserver.observe(container, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
      childList: true
    });
  }
});

// Also observe when new groups are loaded
document.addEventListener('group:loaded', (e) => {
  const container = e?.detail?.container || document.querySelector(CONFIG.SELECTOR_GROUP_CONTAINER);
  if (container) {
    validationObserver.observe(container, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
      childList: true
    });
  }
});

// Simple Enter key handler for customer step to prevent navigation issues
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const customerContainer = document.querySelector('.signup__section--customer');
        const isInCustomer = customerContainer && customerContainer.contains(e.target);

        if (isInCustomer && e.target.tagName === 'INPUT') {
            // Prevent default form submission that might cause wrong navigation
            e.preventDefault();

            // Small delay to let autocomplete finish, then click next button
            setTimeout(() => {
                const nextButton = document.querySelector('#next-button');
                if (nextButton && !nextButton.disabled) {
                    console.log('🔑 Enter pressed on customer step - clicking next button');
                    nextButton.click();
                }
            }, 50);
        }
    }
}, true);

// Fix: Prevent autocomplete from causing wrong form submission on customer step
document.addEventListener('group:loaded', function(e) {
    const groupName = e?.detail?.completedGroup;
    if (groupName === 'customer') {
        // Add novalidate to form to prevent browser validation interference with autocomplete
        const customerContainer = document.querySelector('.signup__section--customer');
        if (customerContainer) {
            const form = customerContainer.querySelector('form');
            if (form && !form.hasAttribute('novalidate')) {
                form.setAttribute('novalidate', '');
            }
        }
    }
});

window.addOnCart = window.addOnCart || {};

function getAllCartItems() {
  const main = window.selectedProduct ? [window.selectedProduct] : [];
  const addons = Object.values(window.addOnCart || {});
  const all = [...main, ...addons];
  return all.map(item => ({
    ...item,
    item_id: String(item.item_id)
  }));
}

// GTM Events
document.addEventListener('group:completed', async function(event) {

  const container = event.detail.container;
  const groupName = event.detail.completedGroup;
  const stepNumber = event.detail.stepNumber + 1; // 0-indexed
 
  // Log checkout progress
  const payload = {
    event: "checkout_progress",
    ecommerce: {
      checkout_step: stepNumber,
      checkout_option: { step_name: groupName }
    }
  };
 
  // Tilføj alle items til payload efterfølgende
  payload.ecommerce.items = getAllCartItems();
 
  // Berig payload med ekstra info
  if (groupName === "situation") {
    payload.ecommerce.checkout_option.option = container.situation;
  }
 
  if (groupName === "installation_address") {
    payload.ecommerce.checkout_option.option = container.installation_address_mode || "unknown";
  }
 
  dataLayer.push(payload);
 
  // Log customer info when available
  if (groupName === "customer") {
    const hashedEmail = "abcd1234"; // brug sha256 i prod
    dataLayer.push({
      event: "user_identifier",
      hashed_email: hashedEmail
    });
  }
 
  // Log product added to cart using productMap
  if (groupName === "electrical_product") {
    const product = window.productMap?.[container.electrical_product_id];
    if (!product) return;

    // Get price from backend electricalProductSubscriptionPrice
    const subscriptionPrice = Number(event.detail.electricalProductSubscriptionPrice ||
                             event.detail.container?.electricalProductSubscriptionPrice || 0);


    // Gem kun de felter vi skal bruge til GA4 (renset version)
    window.selectedProduct = {
      item_id: String(product.id),
      item_name: product.label,
      item_variant: product.variant,
      item_category: "El",
      price: product.price,
      currency: "DKK",
      quantity: 1,
      electricalProductSubscriptionPrice: subscriptionPrice
    };

    // Store selection for price card/summary with subscription price
    if (subscriptionPrice !== undefined) {
      storeSelectedProductFromId(container.electrical_product_id, subscriptionPrice);
    }

    dataLayer.push({
      event: "add_to_cart",
      ecommerce: {
        checkout_step: stepNumber,
        checkout_option: {
          step_name: groupName,
          option: container.situation
        },
        items: [window.selectedProduct]
      },
      hashed_email: "abcd1234" // brug sha256 i prod
    });
  }
 
  // Log payment info + view_cart når man når payment-step
  if (groupName === "payment") {
    const mainItems = window.selectedProduct ? [window.selectedProduct] : [];
    const addOnItems = Object.values(window.addOnCart || {});
    const allItems = [...mainItems, ...addOnItems];
 
    // Skyd view_cart på payment-step
    dataLayer.push({
      event: "view_cart",
      ecommerce: { items: allItems }
    });
 
    // Skyd payment event
    dataLayer.push({
      event: "add_payment_info",
      ecommerce: {
        payment_type: container.payment_type,
        items: allItems
      }
    });
  }
 
  // Purchase på permissions-step
  if (groupName === "permissions") {
    const mainItems = window.selectedProduct ? [window.selectedProduct] : [];
    const addOnItems = Object.values(window.addOnCart || {});
    const allItems = [...mainItems, ...addOnItems];
    const totalValue = allItems.reduce((sum, it) => sum + (parseFloat(it.price) || 0), 0);
 
    dataLayer.push({
      event: "purchase",
      ecommerce: {
        transaction_id: container.signup_id || "unknown",
        affiliation: container.affiliate || "ENLY.dk",
        value: totalValue,
        currency: "DKK",
        items: allItems
      }
    });
  }
});
 
 
document.addEventListener('change', function(e) {
  if (!e.target.matches('.add_on_product_checkbox')) return;
 
  const el = e.target;
  const isChecked = el.checked;
  const productId = String(el.dataset.productId || el.value);
  const productName = el.dataset.productName || 'Ukendt produkt';
  const productPrice = parseFloat(el.dataset.productPrice || '0');
 
  const item = {
    item_id: productId,
    item_name: productName,
    price: productPrice,
    currency: 'DKK',
    quantity: 1
  };
 
  // opdater lokal kurvetilstand til brug ved view_cart og purchase
  if (isChecked) {
    window.addOnCart[productId] = item;
  } else {
    delete window.addOnCart[productId];
  }
 
  dataLayer.push({
    event: isChecked ? 'add_to_cart' : 'remove_from_cart',
    ecommerce: { items: [item] }
  });
});
 
// SHA256 helper
async function sha256(str) {
    const buffer = new TextEncoder("utf-8").encode(str.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Initialize tooltip handles - convert signup__tooltip-handle spans to tooltip icons
function initializeTooltipHandles() {
    const tooltipHandles = document.querySelectorAll('.signup__tooltip-handle[data-tooltip]');
    
    tooltipHandles.forEach(handle => {
        const tooltipText = handle.getAttribute('data-tooltip');
        if (!tooltipText) return;
        
        // Set aria-label
        handle.setAttribute('aria-label', CONFIG.TOOLTIP_HELP_LABEL);
        
        // Add question text inside the handle, before the icon
        if (!handle.querySelector('.signup__tooltip-question')) {
            const questionText = document.createElement('span');
            questionText.className = 'signup__tooltip-question';
            questionText.textContent = 'Hvorfor skal i bruge mit CPR nummer?';
            handle.insertBefore(questionText, handle.firstChild);
        }
        
        // Add SVG icon if not already present
        if (!handle.querySelector('svg')) {
            const svgIcon = document.createElement('span');
            svgIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.3125C5.87512 1.3125 4.7755 1.64607 3.8402 2.27102C2.90489 2.89597 2.17591 3.78423 1.74544 4.82349C1.31496 5.86274 1.20233 7.00631 1.42179 8.10958C1.64124 9.21284 2.18292 10.2263 2.97833 11.0217C3.77374 11.8171 4.78716 12.3588 5.89043 12.5782C6.99369 12.7977 8.13726 12.685 9.17651 12.2546C10.2158 11.8241 11.104 11.0951 11.729 10.1598C12.3539 9.2245 12.6875 8.12488 12.6875 7C12.6861 5.49203 12.0864 4.04623 11.0201 2.97993C9.95377 1.91363 8.50798 1.31395 7 1.3125ZM7 11.8125C6.04818 11.8125 5.11773 11.5303 4.32632 11.0014C3.53491 10.4726 2.91808 9.72103 2.55383 8.84166C2.18959 7.9623 2.09428 6.99466 2.27997 6.06113C2.46566 5.12759 2.92401 4.27009 3.59705 3.59705C4.27009 2.92401 5.1276 2.46566 6.06113 2.27997C6.99466 2.09428 7.9623 2.18958 8.84167 2.55383C9.72104 2.91808 10.4726 3.53491 11.0014 4.32632C11.5303 5.11773 11.8125 6.04818 11.8125 7C11.8111 8.27591 11.3036 9.49915 10.4014 10.4014C9.49915 11.3036 8.27591 11.8111 7 11.8125ZM7.65625 9.84375C7.65625 9.97354 7.61776 10.1004 7.54565 10.2083C7.47354 10.3163 7.37105 10.4004 7.25114 10.45C7.13122 10.4997 6.99927 10.5127 6.87197 10.4874C6.74467 10.4621 6.62774 10.3996 6.53596 10.3078C6.44419 10.216 6.38168 10.0991 6.35636 9.97178C6.33104 9.84448 6.34404 9.71253 6.39371 9.59261C6.44338 9.4727 6.52749 9.37021 6.63541 9.2981C6.74333 9.22599 6.87021 9.1875 7 9.1875C7.17405 9.1875 7.34097 9.25664 7.46404 9.37971C7.58711 9.50278 7.65625 9.6697 7.65625 9.84375ZM8.96875 5.90625C8.96875 6.35236 8.81725 6.78524 8.53905 7.13399C8.26085 7.48273 7.87246 7.72665 7.4375 7.82578V7.875C7.4375 7.99103 7.39141 8.10231 7.30936 8.18436C7.22731 8.26641 7.11603 8.3125 7 8.3125C6.88397 8.3125 6.77269 8.26641 6.69064 8.18436C6.6086 8.10231 6.5625 7.99103 6.5625 7.875V7.4375C6.5625 7.32147 6.6086 7.21019 6.69064 7.12814C6.77269 7.04609 6.88397 7 7 7C7.21633 7 7.42779 6.93585 7.60766 6.81567C7.78752 6.69549 7.92771 6.52467 8.0105 6.32481C8.09328 6.12495 8.11494 5.90504 8.07274 5.69287C8.03053 5.4807 7.92636 5.28582 7.7734 5.13285C7.62044 4.97989 7.42555 4.87572 7.21338 4.83352C7.00122 4.79131 6.7813 4.81297 6.58144 4.89576C6.38159 4.97854 6.21077 5.11873 6.09058 5.29859C5.9704 5.47846 5.90625 5.68993 5.90625 5.90625C5.90625 6.02228 5.86016 6.13356 5.77811 6.21561C5.69606 6.29766 5.58478 6.34375 5.46875 6.34375C5.35272 6.34375 5.24144 6.29766 5.15939 6.21561C5.07735 6.13356 5.03125 6.02228 5.03125 5.90625C5.03125 5.38411 5.23867 4.88335 5.60789 4.51413C5.9771 4.14492 6.47786 3.9375 7 3.9375C7.52215 3.9375 8.02291 4.14492 8.39212 4.51413C8.76133 4.88335 8.96875 5.38411 8.96875 5.90625Z" fill="black" fill-opacity="0.3"/></svg>';
            handle.appendChild(svgIcon);
        }
        
        // Add tooltip text if not already present
        if (!handle.querySelector('.tooltip-text')) {
            const tooltipTextDiv = document.createElement('div');
            tooltipTextDiv.className = 'tooltip-text';
            tooltipTextDiv.textContent = tooltipText;
            handle.appendChild(tooltipTextDiv);
        }
    });
}

// Initialize tooltip handles on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initializeTooltipHandles);

// Also initialize when group:loaded event fires (for dynamically loaded content)
document.addEventListener('group:loaded', initializeTooltipHandles);


// Price-card
(function () {
  function ensurePriceCard() {
    if (document.getElementById("price-card")) return;

    const card = document.createElement("div");
    card.id = "price-card";
    card.setAttribute("aria-live", "polite");
    card.style.display = "none"; // hidden by default
    card.innerHTML = `
      <div class="price-card__inner">
        <div class="price-card__label">Din pris</div>
        <div class="price-card__amount">
          <span id="price-card-value">–</span><span class="price-card__currency">,-</span>
        </div>
        <div class="price-card__sub">Pr. måned alt inkluderet</div>
      </div>
    `;
    // Find Trustpilot widget and place price card before it
    const trustpilotWidget = document.querySelector('.tp-widget-reviews');
    if (trustpilotWidget) {
      trustpilotWidget.parentNode.insertBefore(card, trustpilotWidget);
    } else {
      // Fallback to body if Trustpilot widget not found
      document.body.appendChild(card);
    }
  }

  function getCheckedElectricalRadio() {
    return document.querySelector(
      'input[type="radio"][name="prospect[electrical_product_name]"]:checked'
    );
  }

  function isFirstStep() {
    // Check if we're on electrical_product step (first step)
    return document.querySelector('.signup__section--electrical_product') !== null;
  }

  function showCardIfSelected() {
    const card = document.getElementById("price-card");
    if (!card) return;

    // Don't show price card on first step (electrical_product)
    if (isFirstStep()) {
      card.style.display = "none";
      return;
    }

    const stored = loadStoredSelectedProduct();
    const valueEl = document.getElementById("price-card-value");
    // Show card if we have stored product OR if card already has a valid price displayed
    const hasValidPrice = valueEl && valueEl.textContent && valueEl.textContent !== "–" && valueEl.textContent !== "";
    card.style.display = (stored || hasValidPrice) ? "block" : "none";
  }

  function ensurePriceSection() {
    const summary = document.querySelector('.signup__summary');
    if (!summary) return null;
    
    // Check if price section already exists
    let priceSection = summary.querySelector('section.summary-price-section');
    if (priceSection) return priceSection;
    
    // Create new price section - compact format matching design
    priceSection = document.createElement('section');
    priceSection.className = 'summary-price-section';
    priceSection.innerHTML = `
      <h3>Din pris</h3>
      <div class="row">
        <div class="col-md-10">
          <span id="summary-price-value">–</span><span class="summary-price-currency">,-</span>
        </div>
      </div>
    `;
    
    // Insert after "Valgte produkter" section (4th section) or before Kundeoplysninger (1st section)
    const valgteProdukter = summary.querySelector('section:nth-of-type(4)');
    const kundeoplysninger = summary.querySelector('section:nth-of-type(1)');
    
    if (valgteProdukter && valgteProdukter.nextSibling) {
      summary.insertBefore(priceSection, valgteProdukter.nextSibling);
    } else if (kundeoplysninger) {
      summary.insertBefore(priceSection, kundeoplysninger);
    } else {
      summary.appendChild(priceSection);
    }
    
    return priceSection;
  }


function updatePriceSection() {
  const summary = document.querySelector('.signup__summary');
  if (!summary) {
    // Summary not yet rendered, try again later
    setTimeout(updatePriceSection, 100);
    return;
  }

  const priceSection = ensurePriceSection();
  if (!priceSection) return;
    
    const valueEl = priceSection.querySelector('#summary-price-value');
    if (!valueEl) return;
    
    let stored = loadStoredSelectedProduct();
    
    // If no stored product, try to get it from form or checked radio
    if (!stored) {
      const checkedRadio = getCheckedElectricalRadio();
      if (checkedRadio && checkedRadio.dataset.productId) {
        storeSelectedProductFromId(checkedRadio.dataset.productId);
        stored = loadStoredSelectedProduct();
      }
      
      // Also try to get from hidden input if available
      if (!stored) {
        const hiddenInput = document.querySelector('input[name="prospect[electrical_product_id]"]:not([disabled])');
        if (hiddenInput && hiddenInput.value) {
          storeSelectedProductFromId(hiddenInput.value);
          stored = loadStoredSelectedProduct();
        }
      }
      
      // Also try to extract from summary HTML if product info is shown there
      if (!stored && summary) {
        const valgteProdukterSection = summary.querySelector('section:nth-of-type(4)');
        if (valgteProdukterSection) {
          const productText = valgteProdukterSection.textContent || '';
          // Try to find product ID from any data attributes in the summary
          const productLink = valgteProdukterSection.querySelector('[data-product-id]');
          if (productLink && productLink.dataset.productId) {
            storeSelectedProductFromId(productLink.dataset.productId);
            stored = loadStoredSelectedProduct();
          }
        }
      }
    }
    
    if (!stored) {
      // Only hide if price section doesn't already have a valid price displayed
      const currentPriceText = valueEl.textContent;
      if (currentPriceText === "–" || currentPriceText === "" || currentPriceText === null) {
      priceSection.style.display = 'none';
      }
      return;
    }
    
    const price = computeMonthlyPrice();
    const priceText = price > 0 ? Math.round(price).toString() : "–";

    // Only update if price has changed
    if (valueEl.textContent === priceText && priceSection.style.display !== 'none') {
      return; // Already correct, no need to update
    }

    valueEl.textContent = priceText;
    priceSection.style.display = '';
  }

  function updatePriceCard() {
    ensurePriceCard();
    const valueEl = document.getElementById("price-card-value");
    if (!valueEl) return;
    const stored = loadStoredSelectedProduct();
    if (!stored) {
      showCardIfSelected();
      updatePriceSection();
      return;
    }
    const price = computeMonthlyPrice();
    valueEl.textContent = price > 0 ? Math.round(price) : "–";
    showCardIfSelected();
    updatePriceSection();
  }

  // Initial load: create card + restore selection + show if exists
  document.addEventListener("DOMContentLoaded", () => {
    ensurePriceCard();
    // If some radio is checked on initial render, store it
    const checked = getCheckedElectricalRadio();
    if (checked) storeSelectedProductFromId(checked.dataset.productId);
    updatePriceCard();
    
    // Check if summary already exists (e.g., if we're on permissions step)
    setTimeout(() => {
      const summary = document.querySelector('.signup__summary');
      if (summary) {
        // Try to get product from form if not already stored
        if (!loadStoredSelectedProduct()) {
          const checkedRadio = getCheckedElectricalRadio();
          if (checkedRadio && checkedRadio.dataset.productId) {
            storeSelectedProductFromId(checkedRadio.dataset.productId);
          } else {
            const hiddenInput = document.querySelector('input[name="prospect[electrical_product_id]"]:not([disabled])');
            if (hiddenInput && hiddenInput.value) {
              storeSelectedProductFromId(hiddenInput.value);
            }
          }
        }
      }
      updatePriceSection();
    }, 200);
  });

  // After each group load
  document.addEventListener("group:loaded", (event) => {
    ensurePriceCard();
    const checked = getCheckedElectricalRadio();
    if (checked) storeSelectedProductFromId(checked.dataset.productId);
    updatePriceCard();
    
    
    // If this is the permissions group, wait a bit longer for summary to render
    const groupName = event.detail?.groupName || event.detail?.completedGroup;
    const delay = groupName === 'permissions' ? 300 : 50; // Longer delay for permissions

    // For permissions group, also ensure price card is updated
    if (groupName === 'permissions') {
      console.log('Permissions group loaded - updating price card');
      updatePriceCard();
    }

    setTimeout(() => {
      // Try to get product from summary if not already stored
      const summary = document.querySelector('.signup__summary');
      if (summary) {
        if (!loadStoredSelectedProduct()) {
        // Look for product info in summary HTML
        const valgteProdukter = summary.querySelector('section:nth-of-type(4)');
        if (valgteProdukter) {
          // Try to find any radio or input that might have product info
          const allRadios = document.querySelectorAll('input[type="radio"][name="prospect[electrical_product_name]"]');
          for (const radio of allRadios) {
            if (radio.dataset.productId) {
              storeSelectedProductFromId(radio.dataset.productId);
              break;
              }
            }
          }
        }
      }
      updatePriceSection();
    }, delay);
  });

  // Ensure product set if set on prospect
  document.addEventListener("group:completed", async function(event) {
    ensurePriceCard();
    pid = event.detail.container.electrical_product_id;
    if (pid != null) storeSelectedProductFromId(pid);
    updatePriceCard();

    // If permissions group completed, wait for summary to render
    const groupName = event.detail?.completedGroup || event.detail?.groupName;
    if (groupName === 'permissions') {
      setTimeout(() => {
        updatePriceSection();
      }, 300);
    } else if (groupName === 'electrical_product') {
      // Update summary price when electrical product is selected
      setTimeout(() => {
        updatePriceSection();
      }, 100);
    } else if (groupName === 'permissions') {
      // Update price card and summary when permissions are completed
      console.log('Permissions step completed - updating prices');
      setTimeout(() => {
        console.log('Updating price card and section for permissions');
        updatePriceCard();
        updatePriceSection();
      }, 300);
    } else {
      updatePriceSection();
    }
  });

  // When radios change
  document.addEventListener("change", (e) => {
    if (e.target.matches('input[type="radio"][name="prospect[electrical_product_name]"]')) {
      storeSelectedProductFromId(e.target.dataset.productId);
      updatePriceCard();
      updatePriceSection();
    }
    if (e.target.matches(".add_on_product_checkbox")) {
      updatePriceCard();
      updatePriceSection();
    }
  });

  // When custom image options are clicked, the radio changes inside select()
  document.addEventListener("click", (e) => {
    if (e.target.closest(".signup__electrical_product")) {
      setTimeout(() => {
        const checked = getCheckedElectricalRadio();
        storeSelectedProductFromId(checked.dataset.productId);
        updatePriceCard();
        updatePriceSection();
      }, 0);
    }
  });

  // Watch for summary section being added to DOM (optimized to only check for summary element)
  let summaryUpdateTimeout = null;
  let observerActive = true;
  
  const observer = new MutationObserver((mutations) => {
    // Only process if observer is still active
    if (!observerActive) return;
    
    // Check if summary element was added in this batch of mutations
    let summaryAdded = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) { // Element node
          if (node.classList?.contains('signup__summary') || node.querySelector?.('.signup__summary')) {
            summaryAdded = true;
            break;
          }
        }
      }
      if (summaryAdded) break;
    }
    
    // Only proceed if summary was actually added
    if (!summaryAdded) return;
    
    // Debounce: only update once per batch of mutations
    if (summaryUpdateTimeout) {
      clearTimeout(summaryUpdateTimeout);
    }
    
    summaryUpdateTimeout = setTimeout(() => {
      const summary = document.querySelector('.signup__summary');
      if (summary && summary.offsetParent !== null) {
        // Try to get product from form if not already stored
        if (!loadStoredSelectedProduct()) {
          const checkedRadio = getCheckedElectricalRadio();
          if (checkedRadio && checkedRadio.dataset.productId) {
            storeSelectedProductFromId(checkedRadio.dataset.productId);
          } else {
            // Try hidden input
            const hiddenInput = document.querySelector('input[name="prospect[electrical_product_id]"]:not([disabled])');
            if (hiddenInput && hiddenInput.value) {
              storeSelectedProductFromId(hiddenInput.value);
            }
          }
        }
        
        updatePriceSection();
        
        // Stop observing once summary is found and price is updated
        // Check if price was successfully set
        setTimeout(() => {
          const priceSection = summary.querySelector('section.summary-price-section');
          const valueEl = priceSection?.querySelector('#summary-price-value');
          if (priceSection && valueEl && valueEl.textContent !== "–" && valueEl.textContent !== "") {
            observer.disconnect();
            observerActive = false;
          }
        }, 300);
      }
      summaryUpdateTimeout = null;
    }, 200);
  });

  // Start observing when DOM is ready, but only watch for summary container
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: false // Only watch direct children, not all descendants
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: false
      });
    });
  }

})();
</script>
