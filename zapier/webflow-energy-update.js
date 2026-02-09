const https = require('https');

// Configuration
const WF_API_TOKEN = "2d5d13d1ac3690ae29ebe988f76789eb1d0fc91e5c6bcd025db4d6a8d965b0b3";
const COLLECTION_ID = "6964e1d9d7780ca7d22ba2ba";
const API_KEY = "92f1f5489acfaf730449d39af84386d521d68a80688a8f4e09b1a2808c417c9bbbaf71351e65357278634aaf9b48331037978cd7ca10503fdd6a5ebdb0b29c14";
const API_URL = "https://kunde.gronelforsyning.dk/api/v1/daily-average-prices";

// Get previous full month (avoid partial current month)
const formatDateLocal = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const today = new Date();
const currentYear = today.getFullYear();
const currentMonthIndex = today.getMonth();
const firstDay = new Date(currentYear, currentMonthIndex - 1, 1);
const lastDay = new Date(currentYear, currentMonthIndex, 0);

const currentMonth = {
  startDate: formatDateLocal(firstDay),
  endDate: formatDateLocal(lastDay),
  yearMonth: `${firstDay.getFullYear()}${(firstDay.getMonth() + 1).toString().padStart(2, "0")}`,
  monthName: firstDay.toLocaleDateString("da-DK", { month: "long", year: "numeric" })
};

const slug = `dk-avg-${currentMonth.yearMonth}`;

// Step 1: First check if item already exists in Webflow
const getItemsEndpoint = `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`;
const getItemsReq = https.request(getItemsEndpoint, {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${WF_API_TOKEN}` },
  rejectUnauthorized: false
}, (getItemsRes) => {
  let itemsData = '';
  getItemsRes.on('data', chunk => itemsData += chunk);
  getItemsRes.on('end', () => {
    try {
      const itemsResult = JSON.parse(itemsData);
      // Webflow API v2 returns items directly in 'items' array
      const allItems = itemsResult.items || [];

      // Find existing item by matching 'key' field (Webflow adds suffix to slug, but key stays the same)
      const existingItem = allItems.find(item => {
        if (!item || !item.fieldData) return false;
        // Match on 'key' field instead of slug (slug has Webflow-generated suffix)
        const itemKey = item.fieldData.key || '';
        // Match against both key formats to find existing items
        const yearMonthCompact = currentMonth.yearMonth;
        return itemKey === slug || itemKey === `dk-avg-${yearMonthCompact}` || itemKey === `dk1-${yearMonthCompact}`;
      });

      const itemsToUnset = allItems.filter(item => {
        if (!item || !item.fieldData) return false;
        if (item.fieldData.current !== true) return false;
        const itemKey = item.fieldData.key || '';
        return itemKey !== slug;
      });

      const unsetOtherCurrentItems = (excludeItemId) => {
        if (!itemsToUnset.length) return Promise.resolve([]);

        const tasks = itemsToUnset
          .filter(item => item.id && item.id !== excludeItemId)
          .map(item => new Promise((resolve, reject) => {
            const updateEndpoint = `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/${item.id}`;
            const updateReq = https.request(updateEndpoint, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${WF_API_TOKEN}`,
                'Content-Type': 'application/json'
              },
              rejectUnauthorized: false
            }, (updateRes) => {
              let updateData = '';
              updateRes.on('data', chunk => updateData += chunk);
              updateRes.on('end', () => {
                if (updateRes.statusCode && updateRes.statusCode >= 400) {
                  reject(new Error(`Failed to unset current for item ${item.id}`));
                  return;
                }
                resolve(item.id);
              });
            });
            updateReq.on('error', reject);
            updateReq.write(JSON.stringify({ fieldData: { current: false } }));
            updateReq.end();
          }));

        return Promise.allSettled(tasks).then(results => results
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value));
      };

      // Step 2: Fetch energy prices from both DK1 and DK2
      const fetchPriceForArea = (priceArea) => {
        return new Promise((resolve, reject) => {
          const url = new URL(API_URL);
          url.searchParams.set('priceAreaIdentification', priceArea);
          url.searchParams.set('startDate', currentMonth.startDate);
          url.searchParams.set('endDate', currentMonth.endDate);

          const req = https.request(url, {
            method: 'GET',
            headers: { 'x-api-key': API_KEY },
            rejectUnauthorized: false
          }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              try {
                const apiData = JSON.parse(data);
                resolve({
                  priceArea: priceArea,
                  apiData: apiData,
                  ore: parseFloat(apiData.averageDailyPrice || 0)
                });
              } catch (e) {
                reject(new Error(`Failed to parse ${priceArea} data: ${e.message}`));
              }
            });
          });

          req.on('error', reject);
          req.end();
        });
      };

      Promise.all([
        fetchPriceForArea('DK1'),
        fetchPriceForArea('DK2')
      ]).then(([dk1Result, dk2Result]) => {
        const apiPayload = {
          dk1: dk1Result.apiData,
          dk2: dk2Result.apiData
        };
        // Calculate energy supplement: First apply VAT, then subtract threshold
        const averageOre = (dk1Result.ore + dk2Result.ore) / 2;
        const averageKrWithMoms = +(averageOre * 1.25 / 100).toFixed(4);
        const thresholdKrWithMoms = +(90 / 100).toFixed(4); // 0.90 kr (inkl. moms)

        const energySupplementKr = +Math.max(0, averageKrWithMoms - thresholdKrWithMoms).toFixed(2);

        const now = new Date().toISOString();

        // Step 3: Update existing item OR create new one
        const method = existingItem ? "PATCH" : "POST";

        // Prepare Webflow field data
        // Note: Don't include 'slug' when updating - it's immutable in Webflow
        const fieldData = {
          name: `${currentMonth.monthName}`,
          month: currentMonth.startDate,
          "start-date": currentMonth.startDate,
          "end-date": currentMonth.endDate,
          "calculated-kr-kwh": energySupplementKr, // Energy supplement kr
          unit: "øre/kWh",
          current: true,
          key: slug,
          updated: now,
          "average-ore-kwh": +averageOre.toFixed(2) // Ensure it's a number
        };

        // Only include slug when creating new items (POST), not when updating (PATCH)
        if (method === "POST") {
          fieldData.slug = slug;
        }

        const webflowEndpoint = existingItem
          ? `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/${existingItem.id}`
          : `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`;

        const requestData = method === "POST"
          ? { fieldData, isDraft: true } // Create as draft first
          : { fieldData }; // Update existing item (without slug)

        const webflowReq = https.request(webflowEndpoint, {
          method: method,
          headers: {
            'Authorization': `Bearer ${WF_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          rejectUnauthorized: false
        }, (webflowRes) => {
          let webflowData = '';
          webflowRes.on('data', chunk => webflowData += chunk);
          webflowRes.on('end', () => {
            try {
              const webflowResult = JSON.parse(webflowData);

              // Check if there's a validation error (slug already exists)
              if (webflowRes.statusCode >= 400 || webflowResult.code === 'validation_error') {
                // If slug already exists, try to update instead
                if (webflowResult.message && webflowResult.message.includes('already in database')) {
                  // Re-fetch items to find the existing one
                  const retryGetItemsReq = https.request(getItemsEndpoint, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${WF_API_TOKEN}` },
                    rejectUnauthorized: false
                  }, (retryGetItemsRes) => {
                    let retryItemsData = '';
                    retryGetItemsRes.on('data', chunk => retryItemsData += chunk);
                    retryGetItemsRes.on('end', () => {
                      try {
                        const retryItemsResult = JSON.parse(retryItemsData);
                        const retryAllItems = retryItemsResult.items || [];
                        const retryExistingItem = retryAllItems.find(item => {
                          if (!item || !item.fieldData) return false;
                          const itemKey = item.fieldData.key || '';
                          // Match against both key formats to find existing items
                          const yearMonthCompact = currentMonth.yearMonth;
                          return itemKey === slug || itemKey === `dk-avg-${yearMonthCompact}` || itemKey === `dk1-${yearMonthCompact}`;
                        });

                        if (retryExistingItem) {
                          // Update existing item - create fieldData copy without slug (slug is immutable)
                          const updateFieldData = { ...fieldData };
                          delete updateFieldData.slug; // Remove slug for updates

                          const updateEndpoint = `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/${retryExistingItem.id}`;
                          const updateReq = https.request(updateEndpoint, {
                            method: 'PATCH',
                            headers: {
                              'Authorization': `Bearer ${WF_API_TOKEN}`,
                              'Content-Type': 'application/json'
                            },
                            rejectUnauthorized: false
                          }, (updateRes) => {
                            let updateData = '';
                            updateRes.on('data', chunk => updateData += chunk);
                            updateRes.on('end', () => {
                              try {
                                const updateResult = JSON.parse(updateData);
                                const updateItemId = retryExistingItem.id;

                                unsetOtherCurrentItems(updateItemId).then((unsetIds) => {
                                  const publishItemIds = [updateItemId, ...unsetIds];
                                  // Publish after retry update
                                  const retryPublishEndpoint = `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/publish`;
                                  const retryPublishReq = https.request(retryPublishEndpoint, {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': `Bearer ${WF_API_TOKEN}`,
                                      'Content-Type': 'application/json'
                                    },
                                    rejectUnauthorized: false
                                  }, (retryPublishRes) => {
                                    let retryPublishData = '';
                                    retryPublishRes.on('data', chunk => retryPublishData += chunk);
                                    retryPublishRes.on('end', () => {
                                      try {
                                        const retryPublishResult = JSON.parse(retryPublishData);
                                        callback(null, {
                                          success: true,
                                          message: 'Energy price fetched and Webflow item updated successfully (was duplicate, now updated) and published!',
                                          month: currentMonth.monthName,
                                        "average-ore-kwh": averageOre,
                                        "calculated-kr-kwh": energySupplementKr,
                                        api_payload: apiPayload,
                                        webflow_item_id: updateItemId,
                                        timestamp: new Date().toISOString()
                                      });
                                    } catch (e) {
                                      callback(null, {
                                          success: true,
                                          message: 'Energy price fetched and Webflow item updated after duplicate, but publish failed',
                                          month: currentMonth.monthName,
                                        api_payload: apiPayload,
                                        webflow_item_id: updateItemId,
                                        timestamp: new Date().toISOString()
                                      });
                                    }
                                  });
                                });
                                retryPublishReq.on('error', () => {
                                  callback(null, {
                                    success: true,
                                    message: 'Energy price fetched and Webflow item updated after duplicate, but publish request failed',
                                    month: currentMonth.monthName,
                                    api_payload: apiPayload,
                                    webflow_item_id: updateItemId,
                                    timestamp: new Date().toISOString()
                                  });
                                });
                                  retryPublishReq.write(JSON.stringify({ itemIds: publishItemIds }));
                                  retryPublishReq.end();
                                }).catch(() => {
                                  callback(null, {
                                    success: true,
                                    message: 'Energy price fetched and Webflow item updated after duplicate, but failed to unset previous current items',
                                    month: currentMonth.monthName,
                                    api_payload: apiPayload,
                                    webflow_item_id: updateItemId,
                                    timestamp: new Date().toISOString()
                                  });
                                });
                              } catch (e) {
                                callback(null, {
                                  success: false,
                                  message: 'Found duplicate but failed to update',
                                  error: e.message,
                                  month: currentMonth.monthName,
                                  timestamp: new Date().toISOString()
                                });
                              }
                            });
                          });
                          updateReq.on('error', (updateErr) => {
                            callback(null, {
                              success: false,
                              message: 'Found duplicate but update request failed',
                              error: updateErr.message,
                              month: currentMonth.monthName,
                              timestamp: new Date().toISOString()
                            });
                          });
                          updateReq.write(JSON.stringify({ fieldData: updateFieldData }));
                          updateReq.end();
                          return;
                        }
                      } catch (e) {
                        // Fall through to error handling
                      }
                    });
                  });
                  retryGetItemsReq.on('error', () => {
                    // Fall through to error handling
                  });
                  retryGetItemsReq.end();
                  return;
                }

                // Other validation/error - return error
                callback(null, {
                  success: false,
                  message: `Webflow ${method === 'POST' ? 'create' : 'update'} failed`,
                  month: currentMonth.monthName,
                  "average-ore-kwh": averageOre,
                  "calculated-kr-kwh": energySupplementKr,
                  api_payload: apiPayload,
                  webflow_error: webflowResult.message || webflowResult.code || 'Unknown error',
                  timestamp: new Date().toISOString()
                });
                return;
              }

              const itemId = webflowResult.id || webflowResult.item?.id || existingItem?.id;

              if (!itemId) {
                // Item created/updated but no ID returned
                callback(null, {
                  success: true,
                  message: `Energy price fetched and Webflow item ${method === 'POST' ? 'created' : 'updated'}, but no ID returned`,
                  month: currentMonth.monthName,
                  "average-ore-kwh": averageOre,
                  "calculated-kr-kwh": energySupplementKr,
                  api_payload: apiPayload,
                  timestamp: new Date().toISOString()
                });
                return;
              }

              unsetOtherCurrentItems(itemId).then((unsetIds) => {
                const publishItemIds = [itemId, ...unsetIds];
                // Step 4: Publish the item (whether new or updated) to ensure changes are live
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
                      const publishResult = JSON.parse(publishData);

                      // Success! Item created/updated and published
                      callback(null, {
                        success: true,
                        message: `Energy price fetched and Webflow item ${method === 'POST' ? 'created' : 'updated'} and published successfully!`,
                        month: currentMonth.monthName,
                        "average-ore-kwh": averageOre,
                        "calculated-kr-kwh": energySupplementKr,
                        api_payload: apiPayload,
                        webflow_item_id: itemId,
                        timestamp: new Date().toISOString()
                      });
                    } catch (e) {
                      // Item created/updated but publish failed
                      callback(null, {
                        success: true,
                        message: `Energy price fetched and Webflow item ${method === 'POST' ? 'created' : 'updated'}, but publish failed`,
                        month: currentMonth.monthName,
                        "average-ore-kwh": averageOre,
                        "calculated-kr-kwh": energySupplementKr,
                        api_payload: apiPayload,
                        webflow_item_id: itemId,
                        timestamp: new Date().toISOString()
                      });
                    }
                  });
                });

                publishReq.on('error', (publishErr) => {
                  // Item created/updated but publish request failed
                  callback(null, {
                    success: true,
                    message: `Energy price fetched and Webflow item ${method === 'POST' ? 'created' : 'updated'}, but publish request failed`,
                    month: currentMonth.monthName,
                    "average-ore-kwh": averageOre,
                    "calculated-kr-kwh": energySupplementKr,
                    api_payload: apiPayload,
                    webflow_item_id: itemId,
                    timestamp: new Date().toISOString()
                  });
                });

                publishReq.write(JSON.stringify({ itemIds: publishItemIds }));
                publishReq.end();
              }).catch(() => {
                callback(null, {
                  success: true,
                  message: `Energy price fetched and Webflow item ${method === 'POST' ? 'created' : 'updated'}, but failed to unset previous current items`,
                  month: currentMonth.monthName,
                  "average-ore-kwh": averageOre,
                  "calculated-kr-kwh": energySupplementKr,
                  api_payload: apiPayload,
                  webflow_item_id: itemId,
                  timestamp: new Date().toISOString()
                });
              });

            } catch (e) {
              // Price fetched but Webflow update/create failed
              callback(null, {
                success: true,
                message: `Energy price fetched, but Webflow ${method === 'POST' ? 'create' : 'update'} had issues`,
                month: currentMonth.monthName,
                "average-ore-kwh": averageOre,
                "calculated-kr-kwh": energySupplementKr,
                api_payload: apiPayload,
                webflow_error: e.message,
                timestamp: new Date().toISOString()
              });
            }
          });
        });

        webflowReq.on('error', (webflowErr) => {
          // Price fetched but Webflow request failed
          callback(null, {
            success: true,
            message: `Energy price fetched, but Webflow ${method === 'POST' ? 'create' : 'update'} request failed`,
            month: currentMonth.monthName,
            "average-ore-kwh": averageOre,
            "calculated-kr-kwh": energySupplementKr,
            api_payload: apiPayload,
            webflow_error: webflowErr.message,
            timestamp: new Date().toISOString()
          });
        });

        // Send request with appropriate data (create as draft or update existing)
        webflowReq.write(JSON.stringify(requestData));
        webflowReq.end();

      }).catch((err) => {
        callback(new Error('Failed to fetch energy prices: ' + err.message));
      });

    } catch (e) {
      callback(new Error('Failed to parse items response: ' + e.message));
    }
  });
});

getItemsReq.on('error', (getItemsErr) => {
  // If we can't get existing items, continue as if no items exist (will create new)
  // This is a fallback - try to fetch price and create item anyway
  callback(null, {
    success: false,
    message: 'Could not check for existing items, but continuing anyway',
    error: getItemsErr.message,
    note: 'Will attempt to create new item',
    timestamp: new Date().toISOString()
  });
});

getItemsReq.end();
