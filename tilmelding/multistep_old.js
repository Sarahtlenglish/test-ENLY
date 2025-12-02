<script>
// Hus / Lejlighed radio
document.addEventListener('group:loaded', function() {
    const options = [
        {
            id: 34,
            image: 'https://media.istockphoto.com/id/1145840259/vector/home-flat-icon-pixel-perfect-for-mobile-and-web.jpg?s=612x612&w=0&k=20&c=2DWK30S50TbctWwccYw5b-uR6EAksv1n4L_aoatjM9Q=',
            selectedImage: 'https://www.shutterstock.com/image-vector/twostorey-house-lights-on-off-260nw-2173932419.jpg',
            label: 'DK: A conto-el, hus',
            variant: 'House',
            price: 650
        },
        {
            id: 265,
            image: 'https://www.creativefabrica.com/wp-content/uploads/2022/02/23/City-Scapes-Apartment-Hotel-Building-Graphics-25812901-1.png',
            selectedImage: 'https://www.shutterstock.com/image-vector/city-night-vector-illustration-apartment-600nw-192285722.jpg',
            label: 'DK: A conto-el, lejlighed',
            variant: 'Apartment',
            price: 400
        }
    ];

    const container = document.querySelector('.signup__electrical_product');
    if (!container) return;

    // Hide original radios and their labels
    const radioGroups = container.querySelectorAll('.signup__electrical_product_name');
    radioGroups.forEach(group => group.style.display = 'none');

    // Create wrapper for the image selector UI
    const imgWrapper = document.createElement('div');
    imgWrapper.style.display = 'flex';
    imgWrapper.style.gap = '2rem';
    imgWrapper.style.marginTop = '1rem';
    imgWrapper.style.flexWrap = 'wrap';

    options.forEach(opt => {
        const radio = document.querySelector(`input[type="radio"][data-product-id="${opt.id}"]`);
        if (!radio) return;

        window.productMap = window.productMap || {};

        const productId = radio.dataset.productId;
        if (!window.productMap[productId]) {
          window.productMap[productId] = opt;
        }

        const originalGroup = radio.closest('.signup__electrical_product_name');
        const helpText = originalGroup?.querySelector('.signup__form-help');

        const optionContainer = document.createElement('div');
        optionContainer.style.display = 'flex';
        optionContainer.style.flexDirection = 'column';
        optionContainer.style.alignItems = 'center';
        optionContainer.style.cursor = 'pointer';
        optionContainer.style.textAlign = 'center';
        optionContainer.style.maxWidth = '160px';

        const img = document.createElement('img');
        img.src = radio.checked ? opt.selectedImage : opt.image;
        img.style.width = '140px';
        img.style.borderRadius = '12px';
        img.style.transition = '0.2s ease';
        img.style.boxShadow = radio.checked ? '0 0 0 3px #007bff' : 'none';

        const label = document.createElement('div');
        label.textContent = opt.label;
        label.style.marginTop = '0.5rem';
        label.style.fontSize = '14px';
        label.style.color = '#333';
        label.style.fontWeight = '500';

        const help = helpText ? helpText.cloneNode(true) : null;
        if (help) {
            help.style.marginTop = '0.25rem';
            help.style.fontSize = '13px';
            help.style.color = '#666';
            help.style.lineHeight = '1.3';
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
            imgWrapper.querySelectorAll('img').forEach((el, i) => {
                const o = options[i];
                const r = document.querySelector(`input[type="radio"][data-product-id="${o.id}"]`);
                el.src = r.checked ? o.selectedImage : o.image;
                el.style.boxShadow = r.checked ? '0 0 0 3px #007bff' : 'none';
            });
        };

        optionContainer.addEventListener('click', select);
        optionContainer.appendChild(img);
        optionContainer.appendChild(label);
        if (help) optionContainer.appendChild(help);
        imgWrapper.appendChild(optionContainer);
    });

    container.appendChild(imgWrapper);
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