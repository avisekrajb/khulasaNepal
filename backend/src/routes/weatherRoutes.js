const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const createUrl = (lat, lon) => {
      const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m',
        temperature_unit: 'celsius',
        timezone: 'auto'
      });
      return `https://api.open-meteo.com/v1/forecast?${params}`;
    };

    const kUrl = createUrl('27.7172', '85.3240'); // Kathmandu
    const pUrl = createUrl('27.1458', '87.7419'); // Phidim

    // Fetch both weather data in parallel
    const [kRes, pRes] = await Promise.allSettled([
      fetch(kUrl),
      fetch(pUrl)
    ]);

    let kTemp = '--';
    let pTemp = '--';

    // Process Kathmandu weather
    if (kRes.status === 'fulfilled' && kRes.value.ok) {
      const data = await kRes.value.json();
      const temp = data?.current?.temperature_2m;
      if (typeof temp === 'number' && !isNaN(temp)) {
        kTemp = temp.toFixed(1);
      }
    } else {
      console.warn('Kathmandu weather fetch failed:', kRes.reason || kRes.value?.statusText);
    }

    // Process Phidim weather
    if (pRes.status === 'fulfilled' && pRes.value.ok) {
      const data = await pRes.value.json();
      const temp = data?.current?.temperature_2m;
      if (typeof temp === 'number' && !isNaN(temp)) {
        pTemp = temp.toFixed(1);
      }
    } else {
      console.warn('Phidim weather fetch failed:', pRes.reason || pRes.value?.statusText);
    }

    console.log('✅ Weather data fetched:', {
      kathmandu: kTemp,
      phidim: pTemp
    });

    res.json({
      success: true,
      kathmandu: { temp: kTemp },
      phidim: { temp: pTemp }
    });

  } catch (error) {
    console.error('❌ Weather API error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch weather',
      message: error.message,
      kathmandu: { temp: '--' },
      phidim: { temp: '--' }
    });
  }
});

module.exports = router;