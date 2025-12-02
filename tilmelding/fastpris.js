<script>
// Hus / Lejlighed / Hus + Elbil radio
function initHousingSelector() {
    const options = [
        {
            id: 34,
            image: 'https://h8nip4886wtjcobp.public.blob.vercel-storage.com/house.png',
            selectedImage: 'https://h8nip4886wtjcobp.public.blob.vercel-storage.com/house.png',
            label: 'Jeg bor i hus',
            variant: 'House',
            price: 650
        },
        {
            id: 265,
            image: 'img/flat.png',
            selectedImage: 'img/flat.png',
            label: 'Jeg bor i lejlighed',
            variant: 'Apartment',
            price: 400
        },
        {
            id: 999, // Placeholder ID - skal opdateres med rigtig ID
            image: 'https://h8nip4886wtjcobp.public.blob.vercel-storage.com/Image.png',
            selectedImage: 'https://h8nip4886wtjcobp.public.blob.vercel-storage.com/Image.png',
            label: 'Jeg bor i hus & har elbil',
            variant: 'HouseElectric',
            price: 750
        }
    ];

    const container = document.querySelector('.signup__electrical_product');
    if (!container) return;
    
    // Tjek om vi allerede har oprettet selector'en
    if (container.querySelector('.housing-type-selector')) {
        return; // Allerede initialiseret
    }
    
    // Center the container
    container.style.textAlign = 'center';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';

    // Hide original radios and their labels
    const radioGroups = container.querySelectorAll('.signup__electrical_product_name');
    radioGroups.forEach(group => group.style.display = 'none');

    // Create wrapper for the image selector UI
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'housing-type-selector';
    imgWrapper.style.display = 'flex';
    imgWrapper.style.gap = '2rem';
    imgWrapper.style.marginTop = '2rem';
    imgWrapper.style.marginBottom = '2rem';
    imgWrapper.style.marginLeft = 'auto';
    imgWrapper.style.marginRight = 'auto';
    imgWrapper.style.flexWrap = 'wrap';
    imgWrapper.style.justifyContent = 'center';
    imgWrapper.style.alignItems = 'stretch';
    imgWrapper.style.width = '100%';
    imgWrapper.style.maxWidth = '900px';

    options.forEach(opt => {
        const radio = document.querySelector(`input[type="radio"][data-product-id="${opt.id}"]`);
        // Hvis radio ikke findes, prøv at finde den via label tekst eller opret en placeholder
        if (!radio && opt.id === 999) {
            // For elbil option, vi skal håndtere det dynamisk
            // For nu, springer vi over hvis radio ikke findes
            return;
        }
        if (!radio) return;

        window.productMap = window.productMap || {};

        const productId = radio.dataset.productId;
        if (!window.productMap[productId]) {
          window.productMap[productId] = opt;
        }

        const originalGroup = radio.closest('.signup__electrical_product_name');
        const helpText = originalGroup?.querySelector('.signup__form-help');

        const optionContainer = document.createElement('div');
        optionContainer.className = 'housing-option-card';
        optionContainer.style.display = 'flex';
        optionContainer.style.flexDirection = 'column';
        optionContainer.style.alignItems = 'center';
        optionContainer.style.cursor = 'pointer';
        optionContainer.style.textAlign = 'center';
        optionContainer.style.width = '240px';
        optionContainer.style.height = '280px';
        optionContainer.style.padding = '2.5rem 1.5rem';
        optionContainer.style.backgroundColor = radio.checked ? '#fff' : 'transparent';
        optionContainer.style.borderRadius = '8px';
        optionContainer.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        optionContainer.style.border = '1px solid rgba(0, 0, 0, 0.10)';
        optionContainer.style.boxShadow = 'none';
        
        // Mark as selected if checked
        if (radio.checked) {
            optionContainer.classList.add('selected');
            optionContainer.setAttribute('data-selected', 'true');
        } else {
            optionContainer.classList.remove('selected');
            optionContainer.setAttribute('data-selected', 'false');
        }

        optionContainer.addEventListener('mouseenter', () => {
            if (!radio.checked && !optionContainer.classList.contains('selected')) {
                optionContainer.style.backgroundColor = '#fff';
                optionContainer.style.border = '1px solid rgba(0, 0, 0, 0.10)';
                optionContainer.style.transform = 'translateY(-2px)';
            }
        });

        optionContainer.addEventListener('mouseleave', () => {
            if (!radio.checked && !optionContainer.classList.contains('selected')) {
                optionContainer.style.backgroundColor = 'transparent';
                optionContainer.style.border = '1px solid rgba(0, 0, 0, 0.10)';
                optionContainer.style.transform = 'translateY(0)';
            }
        });
        
        // Update on radio change
        radio.addEventListener('change', () => {
            if (radio.checked) {
                optionContainer.classList.add('selected');
                optionContainer.setAttribute('data-selected', 'true');
            } else {
                optionContainer.classList.remove('selected');
                optionContainer.setAttribute('data-selected', 'false');
            }
        });

        const img = document.createElement('img');
        img.src = opt.image;
        img.style.width = '140px';
        img.style.height = '140px';
        img.style.objectFit = 'contain';
        img.style.marginBottom = '1.5rem';
        img.style.transition = 'transform 0.3s ease';
        img.style.display = 'block';

        const label = document.createElement('div');
        label.textContent = opt.label;
        label.style.fontSize = '16px';
        label.style.color = '#333333';
        label.style.fontWeight = '700';
        label.style.fontFamily = "'Gotham Book', sans-serif";
        label.style.lineHeight = '1.5';
        label.style.marginTop = '0';
        label.style.textAlign = 'center';
        label.style.width = '100%';

        const help = helpText ? helpText.cloneNode(true) : null;
        if (help) {
            help.style.marginTop = '0.5rem';
            help.style.fontSize = '12px';
            help.style.color = '#666';
            help.style.lineHeight = '1.4';
        }

        const select = () => {
            document.querySelectorAll('input[type="radio"][name="prospect[electrical_product_name]"]').forEach(r => r.checked = false);
            document.querySelectorAll('input[type="hidden"][name="prospect[electrical_product_id]"]').forEach(hi => hi.disabled = true);
            radio.checked = true;

            // Enable the hidden input matching this product ID
            const hiddenInput = container.querySelector(
                `input[type="hidden"][name="prospect[electrical_product_id]"][value="${radio.dataset.productId}"]`
            );
            if (hiddenInput) hiddenInput.disabled = false;

            // Update all option visuals
            imgWrapper.querySelectorAll('.housing-option-card').forEach((card, i) => {
                const o = options[i];
                if (!o) return;
                const r = document.querySelector(`input[type="radio"][data-product-id="${o.id}"]`);
                if (r) {
                    if (r.checked) {
                        card.style.backgroundColor = '#fff';
                        card.style.border = '1px solid rgba(0, 0, 0, 0.10)';
                        card.style.boxShadow = 'none';
                        card.classList.add('selected');
                        card.setAttribute('data-selected', 'true');
                    } else {
                        card.style.backgroundColor = 'transparent';
                        card.style.border = '1px solid rgba(0, 0, 0, 0.10)';
                        card.style.boxShadow = 'none';
                        card.style.transform = 'translateY(0)';
                        card.classList.remove('selected');
                        card.setAttribute('data-selected', 'false');
                    }
                }
            });
        };

        optionContainer.addEventListener('click', select);
        optionContainer.appendChild(img);
        optionContainer.appendChild(label);
        if (help) optionContainer.appendChild(help);
        imgWrapper.appendChild(optionContainer);
    });

    container.appendChild(imgWrapper);
}

// Initialize immediately when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHousingSelector);
} else {
    initHousingSelector();
}

// Also run when groups are loaded (for dynamic content)
document.addEventListener('group:loaded', initHousingSelector);

// Situation selector - konverter radio buttons til billedkort
function initSituationSelector() {
    const container = document.querySelector('.signup__situation');
    if (!container) return;
    
    // Tjek om vi allerede har oprettet selector'en
    if (container.querySelector('.situation-type-selector')) {
        return; // Allerede initialiseret
    }
    
    const options = [
        {
            value: 'change_of_supplier',
            image: 'https://h8nip4886wtjcobp.public.blob.vercel-storage.com/house_with_man.png',
            label: 'Jeg ønsker at skifte elleverandør'
        },
        {
            value: 'move',
            image: 'https://h8nip4886wtjcobp.public.blob.vercel-storage.com/hus_og_bil.png',
            label: 'Jeg skal flytte eller er lige flyttet ind'
        }
    ];

    // Find og skjul original radio buttons
    const radioFields = container.querySelectorAll('.signup__form-field--radio');
    radioFields.forEach(field => field.style.display = 'none');

    // Section title håndteres nu via CSS styling

    // Center container
    container.style.textAlign = 'center';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';

    // Create wrapper for the image selector UI
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'situation-type-selector';
    imgWrapper.style.display = 'flex';
    imgWrapper.style.gap = '2rem';
    imgWrapper.style.marginTop = '1rem';
    imgWrapper.style.marginBottom = '1rem';
    imgWrapper.style.marginLeft = 'auto';
    imgWrapper.style.marginRight = 'auto';
    imgWrapper.style.flexWrap = 'wrap';
    imgWrapper.style.justifyContent = 'center';
    imgWrapper.style.alignItems = 'stretch';
    imgWrapper.style.width = '100%';
    imgWrapper.style.maxWidth = '900px';

    options.forEach(opt => {
        // Prøv forskellige måder at finde radio button på
        let radio = container.querySelector(`input[type="radio"][name*="situation"][value*="${opt.value}"]`);
        
        if (!radio) {
            // Prøv at finde via label tekst
            const labels = container.querySelectorAll('label');
            for (let label of labels) {
                const labelText = label.textContent.trim().toLowerCase();
                const searchText = opt.label.toLowerCase();
                
                // Match baseret på nøgleord
                if ((opt.value === 'change_of_supplier' && (labelText.includes('skifte') || labelText.includes('elleverandør'))) ||
                    (opt.value === 'move' && (labelText.includes('flytte') || labelText.includes('flyttet')))) {
                    radio = label.querySelector('input[type="radio"]');
                    if (radio) break;
                }
            }
        }
        
        if (!radio) {
            // Hvis stadig ikke fundet, prøv at finde alle situation radios og match baseret på position
            const allRadios = container.querySelectorAll('input[type="radio"][name*="situation"]');
            if (allRadios.length >= 2) {
                radio = opt.value === 'change_of_supplier' ? allRadios[0] : allRadios[1];
            }
        }
        
        if (!radio) return;

        const optionContainer = document.createElement('div');
        optionContainer.className = 'situation-option-card';
        optionContainer.style.display = 'flex';
        optionContainer.style.flexDirection = 'column';
        optionContainer.style.alignItems = 'center';
        optionContainer.style.cursor = 'pointer';
        optionContainer.style.textAlign = 'center';
        optionContainer.style.width = '280px';
        optionContainer.style.height = '320px';
        optionContainer.style.padding = '1rem 1rem';
        optionContainer.style.backgroundColor = radio.checked ? '#fff' : 'transparent';
        optionContainer.style.borderRadius = '8px';
        optionContainer.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        optionContainer.style.border = '1px solid rgba(0, 0, 0, 0.10)';
        optionContainer.style.boxShadow = 'none';
        
        // Mark as selected if checked
        if (radio.checked) {
            optionContainer.classList.add('selected');
            optionContainer.setAttribute('data-selected', 'true');
        } else {
            optionContainer.classList.remove('selected');
            optionContainer.setAttribute('data-selected', 'false');
        }

        optionContainer.addEventListener('mouseenter', () => {
            if (!radio.checked && !optionContainer.classList.contains('selected')) {
                optionContainer.style.backgroundColor = '#fff';
                optionContainer.style.border = '1px solid rgba(0, 0, 0, 0.10)';
                optionContainer.style.transform = 'translateY(-2px)';
            }
        });

        optionContainer.addEventListener('mouseleave', () => {
            if (!radio.checked && !optionContainer.classList.contains('selected')) {
                optionContainer.style.backgroundColor = 'transparent';
                optionContainer.style.border = '1px solid rgba(0, 0, 0, 0.10)';
                optionContainer.style.transform = 'translateY(0)';
            }
        });
        
        // Update on radio change
        radio.addEventListener('change', () => {
            if (radio.checked) {
                optionContainer.classList.add('selected');
                optionContainer.setAttribute('data-selected', 'true');
            } else {
                optionContainer.classList.remove('selected');
                optionContainer.setAttribute('data-selected', 'false');
            }
        });

        const img = document.createElement('img');
        img.src = opt.image;
        img.style.width = '140px';
        img.style.height = '140px';
        img.style.objectFit = 'contain';
        img.style.marginBottom = '1.5rem';
        img.style.transition = 'transform 0.3s ease';
        img.style.display = 'block';

        const label = document.createElement('div');
        label.textContent = opt.label;
        label.style.fontSize = '16px';
        label.style.color = '#333333';
        label.style.fontWeight = '700';
        label.style.fontFamily = "'Gotham Book', sans-serif";
        label.style.lineHeight = '1.5';
        label.style.marginTop = '0';
        label.style.textAlign = 'center';
        label.style.width = '100%';

        const select = async () => {
            // Uncheck all situation radios
            container.querySelectorAll('input[type="radio"][name*="situation"]').forEach(r => r.checked = false);
            radio.checked = true;
            
            // Trigger change event
            radio.dispatchEvent(new Event('change', { bubbles: true }));

            // Update all option visuals
            imgWrapper.querySelectorAll('.situation-option-card').forEach((card) => {
                const cardRadioId = card.dataset.radioId;
                if (!cardRadioId) return;
                
                const cardRadio = document.getElementById(cardRadioId) || 
                                 document.querySelector(`input[type="radio"][name*="situation"]#${cardRadioId}`) ||
                                 document.querySelector(`input[type="radio"]#${cardRadioId}`);
                
                if (cardRadio) {
                    if (cardRadio.checked) {
                        card.style.backgroundColor = '#fff';
                        card.style.border = '1px solid rgba(0, 0, 0, 0.10)';
                        card.style.boxShadow = 'none';
                        card.classList.add('selected');
                        card.setAttribute('data-selected', 'true');
                    } else {
                        card.style.backgroundColor = 'transparent';
                        card.style.border = '1px solid rgba(0, 0, 0, 0.10)';
                        card.style.boxShadow = 'none';
                        card.style.transform = 'translateY(0)';
                        card.classList.remove('selected');
                        card.setAttribute('data-selected', 'false');
                    }
                }
            });
        };

        // Gem radio reference
        if (!radio.id) {
            radio.id = `situation_radio_${opt.value}_${Date.now()}`;
        }
        optionContainer.dataset.radioId = radio.id;
        optionContainer.addEventListener('click', select);
        optionContainer.appendChild(img);
        optionContainer.appendChild(label);
        imgWrapper.appendChild(optionContainer);
    });

    // Find hvor vi skal indsætte wrapper'en - efter section title eller før radio fields
    const insertPoint = container.querySelector('.signup__section-title')?.nextSibling || 
                       container.querySelector('.signup__group-title')?.nextSibling ||
                       container.querySelector('.signup__form-field--radio')?.parentElement ||
                       container;
    
    if (insertPoint && insertPoint.parentNode) {
        insertPoint.parentNode.insertBefore(imgWrapper, insertPoint);
    } else {
        container.appendChild(imgWrapper);
    }
}

// Initialize situation selector
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSituationSelector);
} else {
    initSituationSelector();
}

document.addEventListener('group:loaded', initSituationSelector);

// Reorganize COS and Move section elements to correct order
function reorganizeSituationElements() {
    // COS section: Checkbox -> Date picker -> Legal text
    const cosMore = document.querySelector('.signup__situation_cos_more');
    if (cosMore) {
        const checkboxField = cosMore.querySelector('.signup__form-field--checkbox');
        const dateSection = cosMore.querySelector('.signup__situation_cos_start_date');
        
        if (checkboxField && dateSection) {
            // Ensure checkbox is first, then date section
            // Checkbox should be first child
            if (cosMore.firstElementChild !== checkboxField) {
                cosMore.insertBefore(checkboxField, cosMore.firstElementChild);
            }
        }
    }
    
    // Move section: Date picker -> Text -> Checkbox
    const moveStartDate = document.querySelector('.signup__situation_move_start_date');
    if (moveStartDate) {
        // Find all child elements
        const dateField = moveStartDate.querySelector('.signup__form-field:not(.signup__situation_move_acknowledged)');
        const helpText = moveStartDate.querySelector('.signup__form-help');
        const checkboxField = moveStartDate.querySelector('.signup__situation_move_acknowledged');
        
        if (dateField && helpText && checkboxField) {
            // Store parent reference
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
}

// Initialize reorganization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reorganizeSituationElements);
} else {
    reorganizeSituationElements();
}

document.addEventListener('group:loaded', reorganizeSituationElements);

// Also reorganize when situation changes
document.addEventListener('change', function(e) {
    if (e.target.matches('input[type="radio"][name*="situation"]')) {
        setTimeout(reorganizeSituationElements, 100);
    }
});

// Add-on products
function annotateAddOnCheckboxes(root) {
  const scope = root || document;
  scope.querySelectorAll('input[name="prospect[product_options][]"]').forEach(input => {
    // sæt class som din change lytter bruger
    input.classList.add('add_on_product_checkbox');
    // sæt id fra value
    input.dataset.productId = input.value;
    // find visningsnavn fra label
    const label = input.closest('label');
    input.dataset.productName = label ? label.innerText.trim() : 'Ukendt produkt';
    // hvis du ikke har pris, så sæt 0 eller hent fra et dataset hvis det findes
    if (!input.dataset.productPrice) input.dataset.productPrice = '0';
  });
}

// Kald ved domready og når grupper loader
document.addEventListener('DOMContentLoaded', () => annotateAddOnCheckboxes());
document.addEventListener('group:loaded', e => annotateAddOnCheckboxes(e?.detail?.containerEl));

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
    const hashedEmail = "abcd1234"; // Mocked, brug sha256(container.email) i prod
    dataLayer.push({
      event: "user_identifier",
      hashed_email: hashedEmail
    });
  }

  // Log product added to cart using productMap
  if (groupName === "electrical_product") {
    const product = window.productMap?.[container.electrical_product_id];
    if (!product) return;

    // Gem kun de felter vi skal bruge til GA4 (renset version)
    window.selectedProduct = {
      item_id: String(product.id),
      item_name: product.label,
      item_variant: product.variant,
      item_category: "El",
      price: product.price,
      currency: "DKK",
      quantity: 1
    };

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
      hashed_email: "abcd1234"
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
</script>