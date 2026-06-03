// Shelf life in days (post-harvest, Nepal conditions)
const SHELF_LIFE = {
  Tomato:7, Potato:60, Cauliflower:5, Onion:30, Carrot:21,
  Orange:14, Cabbage:14, Corn:3, Chili:10, Capsicum:7,
  Mango:5, Lemon:21, Banana:5, Pineapple:7, Broccoli:5,
  Eggplant:7, Pumpkin:30, Cucumber:7, 'Sweet Potato':30,
  Ginger:60, Rice:365, Wheat:365, Beans:14, Garlic:90,
};

const KALIMATI_MAP = {
  Tomato:'tomato', Potato:'potato', Cauliflower:'cauliflower', Onion:'onion',
  Carrot:'carrot', Orange:'orange', Cabbage:'cabbage', Corn:'maize',
  Chili:'chilli', Capsicum:'capsicum', Mango:'mango', Lemon:'lemon',
  Banana:'banana', Pineapple:'pineapple', Broccoli:'broccoli',
  Eggplant:'brinjal', Pumpkin:'pumpkin', Cucumber:'cucumber',
  'Sweet Potato':'sweet potato', Ginger:'ginger', Rice:'rice',
  Beans:'bean', Garlic:'garlic',
};

// In-memory price cache
let priceCache = {};
let lastFetch  = null;

async function fetchKalimatiPrices() {
  try {
    const res  = await fetch('https://kalimatimarket.gov.np/price', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(12000)
    });
    const html = await res.text();

    const prices = {};
    // Match <tr> rows in the price table using regex
    const rowRe  = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let rowMatch;

    while ((rowMatch = rowRe.exec(html)) !== null) {
      const cells = [];
      let cellMatch;
      const cellRe2 = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      while ((cellMatch = cellRe2.exec(rowMatch[1])) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
      }
      if (cells.length >= 4) {
        const commodity = cells[0].toLowerCase();
        const min = parseFloat(cells[2].replace(/[^0-9.]/g, ''));
        const max = parseFloat(cells[3].replace(/[^0-9.]/g, ''));
        if (!isNaN(min) && !isNaN(max) && min > 0) {
          prices[commodity] = { min, max, avg: Math.round((min + max) / 2) };
        }
      }
    }

    if (Object.keys(prices).length > 0) {
      priceCache = prices;
      lastFetch  = new Date();
      console.log(`✅ Kalimati prices cached: ${Object.keys(prices).length} items`);
    } else {
      console.warn('⚠️  Kalimati parse returned 0 items — using fallback prices');
      loadFallbackPrices();
    }
  } catch (err) {
    console.warn('⚠️  Kalimati fetch failed:', err.message, '— using fallback prices');
    loadFallbackPrices();
  }
}

// Fallback prices based on approximate Kalimati averages (June 2025)
function loadFallbackPrices() {
  if (Object.keys(priceCache).length > 0) return; // already have data
  priceCache = {
    'tomato':       { min:40,  max:70,  avg:55  },
    'potato':       { min:25,  max:40,  avg:32  },
    'onion':        { min:30,  max:55,  avg:42  },
    'cauliflower':  { min:35,  max:60,  avg:47  },
    'carrot':       { min:40,  max:65,  avg:52  },
    'cabbage':      { min:25,  max:45,  avg:35  },
    'brinjal':      { min:40,  max:70,  avg:55  },
    'capsicum':     { min:60,  max:100, avg:80  },
    'chilli':       { min:80,  max:150, avg:115 },
    'ginger':       { min:80,  max:130, avg:105 },
    'garlic':       { min:150, max:250, avg:200 },
    'orange':       { min:50,  max:90,  avg:70  },
    'banana':       { min:40,  max:70,  avg:55  },
    'mango':        { min:60,  max:120, avg:90  },
    'cucumber':     { min:25,  max:50,  avg:37  },
    'pumpkin':      { min:20,  max:40,  avg:30  },
    'bean':         { min:50,  max:90,  avg:70  },
    'rice':         { min:50,  max:80,  avg:65  },
    'maize':        { min:20,  max:35,  avg:27  },
  };
  console.log('✅ Fallback Kalimati prices loaded');
}

function getKalimatiPrice(cropName) {
  const keyword = (KALIMATI_MAP[cropName] || cropName).toLowerCase();
  for (const [key, val] of Object.entries(priceCache)) {
    if (key.includes(keyword) || keyword.includes(key.split('(')[0].trim())) return val;
  }
  return null;
}

function getPriceRange(cropName) {
  const kp = getKalimatiPrice(cropName);
  if (!kp) return null;
  return {
    kalimatiAvg:  kp.avg,
    kalimatiMin:  kp.min,
    kalimatiMax:  kp.max,
    suggestedMin: Math.round(kp.min * 0.6),
    suggestedMax: Math.round(kp.avg * 0.9),
    absoluteMax:  Math.round(kp.avg * 1.75),
  };
}

function getShelfLife(cropName) { return SHELF_LIFE[cropName] || 14; }

// Auto-load fallback on startup
loadFallbackPrices();
// Re-fetch live prices in background
fetchKalimatiPrices();

// PRICE_DATA = KALIMATI_MAP keys — used by /all endpoint
const PRICE_DATA = KALIMATI_MAP;

module.exports = { fetchKalimatiPrices, loadFallbackPrices, getKalimatiPrice, getPriceRange, getShelfLife, PRICE_DATA };
