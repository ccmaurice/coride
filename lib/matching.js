// Smart Matching Utilities for CoRide

// Calculate distance between two lat-lng coordinates in km (Haversine formula)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Score matching compatibility between passenger request and driver trip
export function calculateMatchScore(trip, searchCriteria) {
  let score = 50; // Base score
  
  if (!searchCriteria) return score;
  const { origin, destination, preferences } = searchCriteria;

  // 1. ROUTE OVERLAP ESTIMATION
  // Mock distance scoring: check if search text overlaps or matching distance
  const routeMatch = 
    (trip.origin.toLowerCase().includes(origin?.toLowerCase()) || origin?.toLowerCase().includes(trip.origin.toLowerCase())) &&
    (trip.destination.toLowerCase().includes(destination?.toLowerCase()) || destination?.toLowerCase().includes(trip.destination.toLowerCase()));
  
  if (routeMatch) {
    score += 30;
  } else if (trip.destination.toLowerCase().includes(destination?.toLowerCase())) {
    score += 15; // Destination matches, start might require pickup
  }

  // 2. PREFERENCES ALIGNMENT (10 points max)
  if (preferences && trip.preferences) {
    let prefScore = 0;
    let checkedPrefs = 0;

    if (preferences.pets !== undefined) {
      checkedPrefs++;
      if (preferences.pets === trip.preferences.pets) prefScore += 3.3;
    }
    if (preferences.smoking !== undefined) {
      checkedPrefs++;
      if (preferences.smoking === trip.preferences.smoking) prefScore += 3.3;
    }
    if (preferences.conversation !== undefined) {
      checkedPrefs++;
      if (preferences.conversation === trip.preferences.conversation) prefScore += 3.3;
    }

    if (checkedPrefs > 0) {
      score += Math.round(prefScore);
    }
  }

  // 3. SEAT AVAILABILITY (10 points)
  if (trip.seats_available > 0) {
    score += 10;
  } else {
    score -= 30; // penalize heavily if full
  }

  // Clamp score between 0 and 100
  return Math.max(0, Math.min(100, score));
}
