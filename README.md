# Energy Price Updater for Webflow

Dette projekt opdaterer automatisk danske elpriser fra Grøn El Forsyning API og synkroniserer dem med Webflow CMS.

## 🚀 Features

- ✅ Henter månedlige elpriser fra Grøn El Forsyning
- ✅ Opdaterer eksisterende items eller opretter nye
- ✅ Publisher automatisk nye items
- ✅ Opdaterer "key" feltet korrekt
- ✅ Klar til Zapier integration

## 📋 API Endpoints

### `GET /update-prices`
Udfører en komplet opdatering af elpriser i Webflow.

**Response:**
```json
{
  "success": true,
  "message": "All prices updated successfully",
  "results": [...],
  "timestamp": "2026-01-12T15:30:00.000Z"
}
```

### `GET /health`
Health check endpoint.

## 🔧 Deployment til Vercel (Anbefalet)

### 1. Opret Vercel konto
Gå til [vercel.com](https://vercel.com) og opret en konto.

### 2. Installér Vercel CLI
```bash
npm install -g vercel
```

### 3. Deploy projektet
```bash
cd /sti/til/dit/projekt
vercel --prod
```

### 4. Konfigurer environment variables
I Vercel dashboard, gå til dit projekt → Settings → Environment Variables:

```env
# Disse er allerede hardcoded i koden, men kan gøres til env vars hvis ønsket
# WF_API_TOKEN=din_webflow_token
# COLLECTION_ID=din_collection_id
# API_KEY=din_gron_el_key
```

### 5. Test deployment
Besøg din Vercel URL + `/update-prices` for at teste.

## ⚙️ Zapier Integration

### 1. Opret ny Zap
- **Trigger:** Schedule by Zapier (fx hver uge eller måned)
- **Action:** Code by Zapier (eller Web Parser by Zapier)

### 2. Schedule Trigger
- Vælg "Every Week" eller "Every Month"
- Indstil tidspunkt (fx mandag morgen)

### 3. Webhook Action
- **Method:** GET
- **URL:** `https://dit-vercel-project.vercel.app/update-prices`
- **Headers:** Ingen nødvendige

### 4. Test Zap
Kør testen for at sikre alt virker.

## 🔄 Lokalt Test

### Installation
```bash
npm install
```

### Kør API server
```bash
npm start
# Server kører på http://localhost:3000
```

### Test endpoints
```bash
# Health check
curl http://localhost:3000/health

# Opdater priser
curl http://localhost:3000/update-prices
```

### Kør standalone script
```bash
npm run test
```

## 📊 Data Flow

1. **Henter måneder:** Genererer alle måneder fra 2024 til næste år
2. **API Call:** Henter priser fra Grøn El Forsyning for hver måned
3. **Webflow Check:** Tjekker eksisterende items via slug
4. **Update/Create:** Opdaterer eksisterende eller opretter nye items
5. **Publish:** Nye items publishes automatisk (`isDraft: false`)

## 🛠️ Teknisk Detaljer

- **Node.js:** ES Modules
- **API'er:** Grøn El Forsyning + Webflow CMS API
- **SSL:** Bypasser certifikat validering (kun i development)
- **Felter:** Opdaterer alle Webflow felter inkl. "key" feltet

## 🚨 Security Notes

- API keys er hardcoded (overvej environment variables i production)
- SSL certifikat validering er disabled for Grøn El API
- Brug HTTPS i production

## 📞 Support

Hvis du har problemer:
1. Tjek logs i Vercel dashboard
2. Test lokalt først
3. Verificer API keys er korrekte
4. Check Webflow collection permissions
