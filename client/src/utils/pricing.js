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

/**
 * MOCK: Upaya CityCargo API Pricing Simulator
 * Instead of our own algorithm, we simulate an API call to a 3PL partner.
 */
export function calcLogistics(quantity, distanceKm) {
  // Determine vehicle type based on weight
  // up to 100kg -> bike/scooter or small auto
  // 100kg - 1000kg -> pickup
  const vehicleType = quantity <= 100 ? 'bike' : 'pickup';
  
  const rates = {
      bike: { base: 50, perKm: 15 },
      pickup: { base: 500, perKm: 60 }
  };

  const selected = rates[vehicleType];
  const total = selected.base + (distanceKm * selected.perKm);
  
  // Return same interface for frontend
  const perKg = Math.round(total / quantity);
  return { perKg, total: Math.round(total), vehicleType };
}

// Full order cost breakdown — 4% platform commission, 10% Advance Deposit via eSewa
export function calcOrderCost(quantity, pricePerKg, farmerDistrict, vendorDistrict) {
  const fC = DISTRICT_COORDS[farmerDistrict] || { lat:27.7, lng:85.3 };
  const vC = DISTRICT_COORDS[vendorDistrict] || { lat:27.7, lng:85.3 };

  const distanceKm     = Math.max(1, Math.round(getDistanceKm(fC.lat, fC.lng, vC.lat, vC.lng)));
  const { perKg: logisticsPerKg, total: logisticsTotal, vehicleType } = calcLogistics(quantity, distanceKm);
  const goodsTotal     = quantity * pricePerKg;
  const commission     = Math.round(goodsTotal * 0.04);   // 4% platform fee
  const grandTotal     = goodsTotal + logisticsTotal + commission;
  
  // 10% Advance (Minimum Rs 50) via eSewa to lock order
  const deposit        = Math.max(50, Math.round(grandTotal * 0.10));
  const cashOnDelivery = grandTotal - deposit;

  return { distanceKm, logisticsPerKg, logisticsTotal, vehicleType, goodsTotal, commission, grandTotal, deposit, cashOnDelivery };
}
