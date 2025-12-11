# HTML Element Flytninger og Oprettelser i JavaScript

## Oversigt over alle HTML-elementer der flyttes eller oprettes i `fastpris-flow.js`

---

## 1. **Preconnect Links** (til Typekit fonts)
**Funktion:** Anonym IIFE (linje 65-76)
- **Opretter:** `<link rel="preconnect">` elementer
- **Placerer:** I `<head>`
- **Formål:** Preconnect til Typekit font servere

---

## 2. **Hus/Lejlighed Selector** (Step 1 - Electrical Product)
**Funktion:** `group:loaded` event listener (linje 80-247)
- **Opretter:**
  - `<div class="housing-type-selector">` wrapper
  - `<div class="housing-option-card">` for hver option
  - `<img>` elementer med hus/lejlighed billeder
  - `<div class="housing-option-label">` for labels
  - `<div class="housing-option-help">` for help tekst (hvis eksisterer)
- **Placerer:** I `.signup__electrical_product` container
- **Formål:** Konverterer radio buttons til billedkort UI

---

## 3. **Situation Selector** (Step 2)
**Funktion:** `group:loaded` event listener (linje 250-375)
- **Opretter:**
  - `<div class="situation-type-selector">` wrapper
  - `<div class="situation-option-card">` for hver option
  - `<img>` elementer med situation billeder
  - `<div class="situation-option-label">` for labels
- **Placerer:** I `.signup__situation` container, efter section title
- **Formål:** Konverterer radio buttons til billedkort UI

---

## 4. **Gas Product Selector** (Step 3)
**Funktion:** `group:loaded` event listener (linje 378-491)
- **Opretter:**
  - `<div class="gas-type-selector">` wrapper
  - `<div class="gas-option-card">` for hver option
  - `<div class="gas-option-label">` for labels
- **Placerer:** I `.signup__gas_product` container, efter section title
- **Formål:** Konverterer radio buttons til store tekst knapper

---

## 5. **Installation Address Selector** (Step 4)
**Funktion:** `group:loaded` event listener (linje 494-624)
- **Opretter:**
  - `<div class="installation-type-selector">` wrapper
  - `<div class="installation-option-card">` for hver option
  - `<div class="installation-option-label">` for labels
- **Placerer:** I `.signup__installation_address_select` container, efter section title eller form group
- **Formål:** Konverterer radio buttons til store tekst knapper

---

## 6. **Situation Elements Reorganization** (COS og Move sections)
**Funktion:** `reorganizeSituationElements()` (linje 666-709)
- **Flytter:**
  - COS section: Checkbox → Date picker → Legal text
  - Move section: Date picker → Text → Checkbox
- **Placerer:** I `.signup__situation_cos_more` og `.signup__situation_move_start_date`
- **Formål:** Sikrer korrekt rækkefølge af elementer

---

## 7. **Add-on Products Organization** (Elbil opladning)
**Funktion:** `organizeAddOnProducts()` (linje 729-891)
- **Opretter:**
  - `<div class="addon-group-section">` for hver gruppe
  - `<div class="addon-group-header">` med tooltip icon
  - `<div class="addon-tooltip-icon">` med SVG icon
  - `<div class="addon-tooltip-text">` for tooltip tekst
  - `<h3 class="signup__group-title">` for titler
  - `<p>` elementer for beskrivelser
  - `<div class="addon-group-content">` wrapper
  - `<h4 class="addon-sub-heading">` for underoverskrifter
- **Placerer:** I `.signup__electrical_additional_products` container
- **Formål:** Organiserer valgfrie produkter i grupper med toggle funktionalitet

---

## 8. **Tooltip Handles Initialization**
**Funktion:** `initializeTooltipHandles()` (linje 1127-1160)
- **Opretter/Tilføjer:**
  - `<span class="signup__tooltip-question">` for spørgsmålstekst
  - `<span>` med SVG icon
  - `<div class="tooltip-text">` for tooltip indhold
- **Placerer:** I eksisterende `.signup__tooltip-handle` elementer
- **Formål:** Konverterer tooltip handles til interaktive tooltip ikoner

---

## 9. **Price Card** (Fixed position)
**Funktion:** `ensurePriceCard()` (linje 1170-1187)
- **Opretter:**
  - `<div id="price-card">` container
  - `<div class="price-card__inner">` wrapper
  - `<div class="price-card__label">` for "Din pris"
  - `<div class="price-card__amount">` med `<span id="price-card-value">`
  - `<span class="price-card__currency">` for ",-"
  - `<div class="price-card__sub">` for "Pr. måned alt inkluderet"
- **Placerer:** I `<body>`, fixed position bottom-right
- **Formål:** Viser pris i fast position på skærmen

---

## 10. **Price Section i Summary**
**Funktion:** `ensurePriceSection()` (linje 1229-1262)
- **Opretter:**
  - `<section class="summary-price-section">`
  - `<h3>` med "Din pris"
  - `<div class="row">` wrapper
  - `<div class="col-md-10">` med `<span id="summary-price-value">` og `<span class="summary-price-currency">`
- **Placerer:** I `.signup__summary` container, efter "Valgte produkter" eller før "Kundeoplysninger"
- **Formål:** Viser pris i summary kortet

---

## Noter:
- Alle oprettelser og flytninger sker automatisk når grupper indlæses (`group:loaded`, `group:completed`, `DOMContentLoaded`)
- Elementer tjekkes før oprettelse/flytning for at undgå duplikater
- CSS styling sikrer korrekt layout efter oprettelse/flytning

