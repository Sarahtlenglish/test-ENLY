# ARIA Labels Guide for Service Cards

## Anbefalede ARIA Labels baseret på ikonerne:

### 1. Elektricitet (Lightning bolt icon)
```html
aria-label="Læs mere om elektricitet"
```
eller hvis det er et klikbart kort:
```html
aria-label="Gå til side om elektricitet"
```

### 2. Naturgas (Flame icon)
```html
aria-label="Læs mere om naturgas"
```
eller:
```html
aria-label="Gå til side om naturgas"
```

### 3. Elselskab (Orange rectangle with arrow)
```html
aria-label="Skift elselskab"
```
eller:
```html
aria-label="Læs mere om at skifte elselskab"
```

### 4. Partnerskab/Samarbejde (Handshake icon)
```html
aria-label="Læs mere om partnerskab"
```
eller:
```html
aria-label="Bliv partner"
```

### 5. Dokument/Regning (Document icon)
```html
aria-label="Se dokumenter og regninger"
```
eller:
```html
aria-label="Læs mere om fakturering"
```

### 6. Levering (Delivery truck icon)
```html
aria-label="Læs mere om levering"
```
eller:
```html
aria-label="Se leveringsmuligheder"
```

## Eksempel på implementering:

```html
<!-- Hvis kortet er et link -->
<a href="/elektricitet" class="service-card" aria-label="Gå til side om elektricitet">
  <img src="lightning-icon.svg" alt="" aria-hidden="true">
  <span>Elektricitet</span>
</a>

<!-- Hvis kortet er et klikbart element (button/div) -->
<button class="service-card" aria-label="Læs mere om elektricitet">
  <img src="lightning-icon.svg" alt="" aria-hidden="true">
  <span>Elektricitet</span>
</button>

<!-- Hvis kortet er et div med onclick -->
<div class="service-card" role="button" tabindex="0" aria-label="Læs mere om elektricitet" onclick="...">
  <img src="lightning-icon.svg" alt="" aria-hidden="true">
  <span>Elektricitet</span>
</div>
```

## Vigtige noter:

1. **Hvis ikonet er dekorativt**: Tilføj `aria-hidden="true"` til img-tagget og brug `aria-label` på containeren
2. **Hvis ikonet er informativt**: Brug `alt` tekst på img-tagget i stedet for `aria-hidden`
3. **For klikbare elementer**: Brug `role="button"` og `tabindex="0"` hvis det er et div
4. **Kombiner tekst og ikon**: ARIA label skal beskrive hele handlingen, ikke kun ikonet


