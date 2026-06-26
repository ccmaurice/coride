/**
 * CoRide Navigation and Routing Utilities
 * Powered by OpenStreetMap (Nominatim for Geocoding and OSRM for Routing)
 * 100% Free, Open-Source, and requires no API Keys.
 */

// Bounding box for Kinshasa metropolitan area: [min_lng, min_lat, max_lng, max_lat]
const KINSHASA_BBOX = [15.15, -4.5, 15.45, -4.2];

/**
 * Geocodes a text query (e.g., "Kintambo Magasin") into [latitude, longitude] coordinates.
 * Filters and bounds results specifically to the Kinshasa area.
 * @param {string} query The location name to search.
 * @returns {Promise<{lat: number, lng: number, name: string}|null>} The resolved coordinates and clean name, or null.
 */
export async function geocodeLocation(query) {
  if (!query || !query.trim()) return null;

  try {
    // Append Kinshasa context to make the query highly specific
    const fullQuery = query.toLowerCase().includes('kinshasa') 
      ? query 
      : `${query}, Kinshasa, DRC`;

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.append('format', 'json');
    url.searchParams.append('q', fullQuery);
    url.searchParams.append('limit', '1');
    url.searchParams.append('viewbox', KINSHASA_BBOX.join(','));
    url.searchParams.append('bounded', '1'); // Force results inside the bounding box

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'CoRide-Kinshasa-Carpooling-App/1.0 (contact@coride.io)'
      }
    });

    if (!response.ok) throw new Error('Geocoding service response error');

    const data = await response.json();
    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        name: result.display_name.split(',')[0] // Clean short name
      };
    }
    
    // Fallback: If bounded search fails, try a wider search but still in DRC
    const widerUrl = new URL('https://nominatim.openstreetmap.org/search');
    widerUrl.searchParams.append('format', 'json');
    widerUrl.searchParams.append('q', `${query}, DRC`);
    widerUrl.searchParams.append('limit', '1');

    const widerResponse = await fetch(widerUrl.toString(), {
      headers: {
        'User-Agent': 'CoRide-Kinshasa-Carpooling-App/1.0 (contact@coride.io)'
      }
    });

    if (widerResponse.ok) {
      const widerData = await widerResponse.json();
      if (widerData && widerData.length > 0) {
        const result = widerData[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          name: result.display_name.split(',')[0]
        };
      }
    }

    return null;
  } catch (err) {
    console.error('Error during geocoding:', err);
    return null;
  }
}

/**
 * Calculates a driving route between two points in Kinshasa using the OSRM API.
 * @param {[number, number]} originCoords The starting coordinates [lat, lng].
 * @param {[number, number]} destCoords The destination coordinates [lat, lng].
 * @returns {Promise<{coordinates: [number, number][], distanceKm: number, durationMins: number}|null>}
 */
export async function getDrivingRoute(originCoords, destCoords) {
  if (!originCoords || !destCoords) return null;

  try {
    // OSRM expects coordinates in [longitude, latitude] format
    const coordinatesString = `${originCoords[1]},${originCoords[0]};${destCoords[1]},${destCoords[0]}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Routing service response error');

    const data = await response.json();
    if (data && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      
      // OSRM returns coordinates as [lng, lat] GeoJSON. Convert them back to [lat, lng] for Leaflet
      const geoJsonCoords = route.geometry.coordinates;
      const leafletCoords = geoJsonCoords.map(coord => [coord[1], coord[0]]);

      const distanceKm = parseFloat((route.distance / 1000).toFixed(2));
      const durationMins = Math.round(route.duration / 60);

      return {
        coordinates: leafletCoords,
        distanceKm,
        durationMins
      };
    }

    return null;
  } catch (err) {
    console.error('Error during routing:', err);
    
    // Fallback: If routing fails, generate a direct line between the points
    const distanceKm = parseFloat((calculateHaversineDistance(originCoords, destCoords)).toFixed(2));
    const durationMins = Math.round(distanceKm * 2.5); // Approx 24 km/h average speed in city
    
    // Generate a simple 4-point curved interpolation between origin and destination
    const intermediate1 = [
      originCoords[0] + (destCoords[0] - originCoords[0]) * 0.3,
      originCoords[1] + (destCoords[1] - originCoords[1]) * 0.1
    ];
    const intermediate2 = [
      originCoords[0] + (destCoords[0] - originCoords[0]) * 0.7,
      originCoords[1] + (destCoords[1] - originCoords[1]) * 0.9
    ];

    return {
      coordinates: [originCoords, intermediate1, intermediate2, destCoords],
      distanceKm,
      durationMins
    };
  }
}

/**
 * Calculates straight line distance between two points in km (Haversine formula).
 */
function calculateHaversineDistance(coords1, coords2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(coords2[0] - coords1[0]);
  const dLon = deg2rad(coords2[1] - coords1[1]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coords1[0])) * Math.cos(deg2rad(coords2[0])) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
