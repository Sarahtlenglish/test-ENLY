# 🚀 Zapier Guide: Automatisk Elpris Opdatering

Denne guide viser hvordan du opsætter automatisk opdatering af elpriser i Webflow direkte i Zapier.

## 📋 Forudsætninger

- Zapier konto (betalt plan anbefales for scheduled zaps)
- Webflow API token og Collection ID (du har allerede)
- Grøn El API key (du har allerede)

## ⚡ Trin-for-Trin Guide

### 1. **Opret Ny Zap**

1. Gå til [zapier.com](https://zapier.com) og log ind
2. Klik **"Create Zap"** (øverste højre hjørne)
3. Giv den et navn: `"Elpris Opdatering - Webflow"`

### 2. **Setup Trigger: Schedule**

1. Søg efter **"Schedule"** i trigger søgefeltet
2. Vælg **"Schedule by Zapier"**
3. Konfigurer:
   - **Trigger Event:** `"Every Month"` eller `"Every Week"`
   - **Day of the Month:** Vælg en dag (fx 1. hver måned)
   - **Time of Day:** Vælg tidspunkt (fx 09:00)
4. Klik **"Continue"**

### 3. **Setup Action: Code by Zapier**

1. Klik **"+"** for at tilføje en action
2. Søg efter **"Code"** i action søgefeltet
3. Vælg **"Code by Zapier"**
4. Konfigurer:
   - **Event:** `"Run JavaScript"`
   - **Code:** Kopier hele koden fra `zapier-simple.js` (anbefalet første gang)
5. Klik **"Continue"**

**💡 Tip:** Start med `zapier-simple.js` - det er mere pålideligt første gang!

## 📁 Kode Versioner

### `zapier-simple.js` (Anbefalet - fungerer!)
- ✅ Kun aktuelt måned
- ✅ Sætter `output` korrekt
- ✅ Callback-baseret (pålidelig)
- ✅ Hurtig at teste
- ✅ Lav timeout risiko

### `zapier-code.js` (Avanceret - kan have problemer)
- 🔄 Alle måneder (kan være langsom)
- 🔄 Async/await (moderne)
- 🔄 Fuldt funktionel
- ⚠️ Højere timeout risiko
- ⚠️ Kan have `output` problemer

### 4. **Test Zap**

1. Klik **"Test step"** for at køre koden
2. Du skulle se output som:
   ```json
   {
     "success": true,
     "message": "Energy prices updated successfully",
     "results": [...],
     "updated_count": 25,
     "error_count": 0
   }
   ```

### 5. **Aktiver Zap**

1. Klik **"Publish"** for at aktivere din Zap
2. Zapier vil nu automatisk opdatere elpriser efter din schedule

## 🔧 Troubleshooting

### Fejl: "API key invalid"
- Tjek at dine API keys i koden er korrekte
- Husk at ændre dem hvis de udløber

### Fejl: "Collection not found"
- Verificer din `COLLECTION_ID`
- Tjek at Webflow API token har de rigtige permissions

### Fejl: "You did not return or set `output`"
- Brug `zapier-simple.js` i stedet for `zapier-code.js`
- Sørg for at hele koden er kopieret
- Zapier kræver `output = {...}` i stedet for `return`

### Fejl: "SSL certificate error"
- Dette er normalt - koden håndterer det
- Kontakt support hvis det fortsætter

### Fejl: "Async function timeout"
- Zapier har timeout begrænsninger
- Brug `zapier-simple.js` versionen
- Reducer antallet af måneder der behandles

### Ingen opdateringer sker
- Tjek Zapier logs for fejlmeddelelser
- Test koden manuelt i Zapier først
- Verificer API tokens er korrekte

## 📊 Hvad sker der hver måned?

1. **Trigger:** Zapier starter automatisk (fx 1. hver måned kl 9)
2. **Hent måneder:** Genererer alle måneder fra 2024 til 2 måneder frem
3. **API kald:** Henter nye priser fra Grøn El Forsyning
4. **Webflow sync:** Opdaterer eksisterende + opretter nye måneder
5. **Publish:** Nye items publishes automatisk
6. **Log:** Sender resultater tilbage til Zapier

## 🎯 Resultat

Efter setup vil du have:
- ✅ Automatisk opdatering hver måned
- ✅ Nye elpriser i Webflow hver måned
- ✅ "Key" feltet opdateres korrekt
- ✅ Nye måneder publishes automatisk
- ✅ Email notifikation hvis der er fejl

## 💡 Tips

- **Test først:** Kør testen flere gange før du publisher
- **Monitor:** Tjek Zapier dashboard for at se om det kører
- **Backup:** Behold API keys sikret
- **Log:** Zapier logger alle kørsler - tjek dem ved problemer

## 📞 Support

Hvis du har problemer:
1. Tjek Zapier logs for fejl
2. Test koden i "Test step" først
3. Verificer API keys er korrekte
4. Kontakt Zapier support hvis det er deres system

---

**🎉 Tillykke! Din automatiske elpris opdatering er nu sat op!** ⚡
