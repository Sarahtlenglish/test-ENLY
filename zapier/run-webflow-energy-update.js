// Local runner to capture Zapier-style callback output as JSON
/* eslint-disable no-console */

global.callback = (err, result) => {
  if (err) {
    const payload = {
      success: false,
      error: err.message || String(err)
    };
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  console.log(JSON.stringify(result, null, 2));
};

require('./webflow-energy-update');
