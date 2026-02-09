// Using built-in fetch (Node.js 18+)
import https from 'https';

const WF_API_TOKEN = "2d5d13d1ac3690ae29ebe988f76789eb1d0fc91e5c6bcd025db4d6a8d965b0b3";
const SITE_ID = "68d2472651ceb5d1d097b088";
const COLLECTION_ID = "6964e1d9d7780ca7d22ba2ba";
const API_KEY = "92f1f5489acfaf730449d39af84386d521d68a80688a8f4e09b1a2808c417c9bbbaf71351e65357278634aaf9b48331037978cd7ca10503fdd6a5ebdb0b29c14";
const API_URL = "https://kunde.gronelforsyning.dk/api/v1/daily-average-prices";

// ---- Helper: generate all months ----
function getMonths(startYear = 2024) {
  const months = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  for (let y = startYear; y <= currentYear; y++) {
    const endMonth = (y === currentYear) ? currentMonth : 11;
    const beginMonth = (y === startYear) ? 0 : 0;

    for (let m = beginMonth; m <= endMonth; m++) {
      const first = new Date(y, m, 1);
      const last = new Date(y, m + 1, 0);

      months.push({
        startDate: first.toISOString().split("T")[0],
        endDate: last.toISOString().split("T")[0],
        yearMonth: `${y}${(m + 1).toString().padStart(2, "0")}`,
        monthName: first.toLocaleDateString("da-DK", { month: "long", year: "numeric" }),
      });
    }
  }
  return months;
}

// ---- Helper: get Webflow items ----
async function getWebflowItems() {
  const url = `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`;

  const data = await new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${WF_API_TOKEN}` },
      rejectUnauthorized: false // Note: In production, proper SSL validation should be used
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });

  return data.items || [];
}

// ---- MAIN ----
(async () => {
  const months = getMonths();
  const allItems = await getWebflowItems();
  const results = [];

  for (const month of months) {
    try {
      // Fetch Grøn El data using https module directly due to SSL certificate issues
      const url = new URL(API_URL);
      url.searchParams.set('priceAreaIdentification', 'DK1');
      url.searchParams.set('startDate', month.startDate);
      url.searchParams.set('endDate', month.endDate);

      const apiData = await new Promise((resolve, reject) => {
        const req = https.request(url, {
          method: 'GET',
          headers: { 'x-api-key': API_KEY },
          rejectUnauthorized: false // Note: In production, proper SSL validation should be used
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        });

        req.on('error', reject);
        req.end();
      });

      const ore = parseFloat(apiData.averageDailyPrice || 0);
      const kr = +(ore / 100).toFixed(2);
      const slug = `dk1-${month.yearMonth}`;
      const now = new Date().toISOString();

      // Calculate price after subtracting 90 øre (minimum 0)
      const calculatedOre = Math.max(0, ore - 90);
      const calculatedKr = +(calculatedOre / 100).toFixed(2);

      // Find existing item by key field (slug has Webflow-generated suffix)
      const existing = allItems.find(i => i.fieldData && i.fieldData.key === slug);
      const isCurrent = month === months[months.length - 1]; // only latest

      const method = existing ? "PATCH" : "POST";
      
      // Prepare fieldData - don't include slug when updating (slug is immutable)
      const fieldData = {
        name: `${month.monthName}`,
        "price-area": "DK1",
        month: month.startDate,
        "start-date": month.startDate,
        "end-date": month.endDate,
        "ore-kwh": ore, // Original price
        "kr-kwh": kr, // Original price in kr
        "calculated-ore-kwh": calculatedOre, // Price after subtracting 90 øre
        "calculated-kr-kwh": calculatedKr, // Calculated price in kr
        unit: apiData.unit || "øre/kWh",
        current: isCurrent,
        key: slug, // Add key field that matches slug
        updated: now
      };
      
      // Only include slug when creating new items (POST), not when updating (PATCH)
      if (method === "POST") {
        fieldData.slug = slug;
      }

      const endpoint = existing
        ? `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/${existing.id}`
        : `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`;

      // Create as draft first, then publish via endpoint (per Webflow best practice)
      const requestData = method === "POST"
        ? { fieldData, isDraft: true } // Create as draft first
        : { fieldData }; // Keep existing publish status for updates (without slug)

      const result = await new Promise((resolve, reject) => {
        const req = https.request(endpoint, {
          method,
          headers: {
            'Authorization': `Bearer ${WF_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          rejectUnauthorized: false // Note: In production, proper SSL validation should be used
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve({ data: JSON.parse(data), statusCode: res.statusCode });
            } catch (e) {
              reject(e);
            }
          });
        });

        req.on('error', reject);
      req.write(JSON.stringify(requestData));
      req.end();
    });

    // Publish the item (whether new or updated) to ensure changes are live
    if (result.data) {
      const itemId = result.data.id || result.data.item?.id || (existing ? existing.id : null);
      if (itemId) {
        // Small delay to ensure item is ready for publishing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const publishResult = await new Promise((resolve, reject) => {
          const publishEndpoint = `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/publish`;
          const publishReq = https.request(publishEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${WF_API_TOKEN}`,
              'Content-Type': 'application/json'
            },
            rejectUnauthorized: false
          }, (publishRes) => {
            let publishData = '';
            publishRes.on('data', chunk => publishData += chunk);
            publishRes.on('end', () => {
              try {
                const parsed = JSON.parse(publishData);
                console.log(`Published item ${itemId}:`, parsed);
                resolve({ published: true, response: parsed, statusCode: publishRes.statusCode });
              } catch (e) {
                console.log(`Warning: Could not parse publish response for ${itemId}`);
                resolve({ published: true, note: 'Response parse error but likely published' });
              }
            });
          });

          publishReq.on('error', (err) => {
            console.log(`Warning: Failed to publish item ${itemId}:`, err.message);
            resolve({ published: false, error: err.message });
          });

          publishReq.write(JSON.stringify({ itemIds: [itemId] }));
          publishReq.end();
        });
        
        if (!publishResult.published) {
          console.log(`⚠️  Item ${itemId} not published:`, publishResult.error);
        }
      } else {
        console.log(`⚠️  Could not find ID for publishing:`, result.data);
      }
    }

    results.push({ month: month.monthName, status: existing ? "updated" : "created", kr });
    } catch (err) {
      console.log(`Error for ${month.monthName}:`, err.message, err.cause?.message || '');
      results.push({ month: month.monthName, error: err.message });
    }
  }

  console.table(results);
})();
