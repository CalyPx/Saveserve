// Haversine distance
export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export const DISTRICT_COORDS = {
  Kathmandu:{lat:27.7172,lng:85.3240},Lalitpur:{lat:27.6588,lng:85.3247},
  Bhaktapur:{lat:27.6710,lng:85.4298},Dhading:{lat:27.8774,lng:84.8396},
  Nuwakot:{lat:27.9654,lng:85.1703},Sindhupalchok:{lat:27.9540,lng:85.6882},
  Kavrepalanchok:{lat:27.5769,lng:85.5231},Makwanpur:{lat:27.4333,lng:84.9833},
  Chitwan:{lat:27.5291,lng:84.3542},Kaski:{lat:28.2096,lng:83.9856},
  Syangja:{lat:28.0124,lng:83.8836},Tanahu:{lat:27.9167,lng:84.2167},
  Gorkha:{lat:28.0000,lng:84.6333},Lamjung:{lat:28.2333,lng:84.3833},
  Morang:{lat:26.6667,lng:87.3667},Sunsari:{lat:26.6500,lng:87.1667},
  Jhapa:{lat:26.5500,lng:87.8833},Ilam:{lat:26.9167,lng:87.9167},
  Dhankuta:{lat:27.0167,lng:87.3500},Rupandehi:{lat:27.5667,lng:83.4167},
  Dang:{lat:28.0667,lng:82.3000},Kailali:{lat:28.7000,lng:80.9333},
  Kanchanpur:{lat:28.8500,lng:80.1167},Palpa:{lat:27.8667,lng:83.5500},
  Gulmi:{lat:28.0833,lng:83.2667},Arghakhanchi:{lat:27.9500,lng:83.1667},
  Pokhara:{lat:28.2096,lng:83.9856},
};

const HILLY = ['Dhading','Nuwakot','Sindhupalchok','Kavrepalanchok','Makwanpur',
  'Kaski','Syangja','Tanahu','Gorkha','Lamjung','Dhankuta','Ilam','Palpa','Gulmi','Arghakhanchi'];

/**
 * Logistics rate per kg — based on quantity (bulk = cheaper) × distance multiplier
 * Source: Nepal LTL cargo rates, Tata Ace/tempo hire rates, public bus cargo rates
 *
 * Base rate by quantity (larger shipment = better per-kg rate):
 *   < 50kg  → Rs 18/kg  (small parcel, bus cargo)
 *   50-100  → Rs 14/kg
 *   100-300 → Rs 10/kg  (tempo hire shared)
 *   300-500 → Rs  7/kg  (small truck shared)
 *   500+    → Rs  5/kg  (full truck load advantage)
 *
 * Distance multiplier:
 *   0-50km  → 1.0x  (within valley / nearby district)
 *   50-150  → 1.3x
 *   150-300 → 1.6x
 *   300+    → 2.0x
 *
 * Hilly surcharge: +30%
 * Minimum total: Rs 200
 */
export function calcLogistics(quantity, distanceKm, fromDistrict) {
  let basePerKg;
  if (quantity < 50)       basePerKg = 18;
  else if (quantity < 100) basePerKg = 14;
  else if (quantity < 300) basePerKg = 10;
  else if (quantity < 500) basePerKg = 7;
  else                     basePerKg = 5;

  let distMult;
  if (distanceKm < 50)       distMult = 1.0;
  else if (distanceKm < 150) distMult = 1.3;
  else if (distanceKm < 300) distMult = 1.6;
  else                       distMult = 2.0;

  let rate = basePerKg * distMult;
  if (HILLY.includes(fromDistrict)) rate *= 1.3;

  const total = Math.max(200, Math.round(rate * quantity));
  const perKg  = Math.round(total / quantity);
  return { perKg, total };
}

// Full order cost breakdown — 4% platform commission, 100% deposit
export function calcOrderCost(quantity, pricePerKg, farmerDistrict, vendorDistrict) {
  const fC = DISTRICT_COORDS[farmerDistrict] || { lat:27.7, lng:85.3 };
  const vC = DISTRICT_COORDS[vendorDistrict] || { lat:27.7, lng:85.3 };

  const distanceKm     = Math.round(getDistanceKm(fC.lat, fC.lng, vC.lat, vC.lng));
  const { perKg: logisticsPerKg, total: logisticsTotal } = calcLogistics(quantity, distanceKm, farmerDistrict);
  const goodsTotal     = quantity * pricePerKg;
  const commission     = Math.round(goodsTotal * 0.04);   // 4% platform fee
  const grandTotal     = goodsTotal + logisticsTotal + commission;
  const deposit        = grandTotal;                       // 100% paid upfront

  return { distanceKm, logisticsPerKg, goodsTotal, logisticsTotal, commission, grandTotal, deposit };
}
