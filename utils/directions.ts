export type LatLng = {
  latitude: number;
  longitude: number;
};

export type RideDirections = {
  toPickup: number; // duration in minutes
  toDropoff: number; // duration in minutes
  pickupDistance: number; // distance in km
  dropoffDistance: number; // distance in km
};

// Cache for direction calculations to avoid repeated API calls
export const directionsCache = new Map<string, {
  directions: RideDirections;
  timestamp: number;
}>();

export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Generate cache key for directions
export function getDirectionsCacheKey(origin: LatLng, pickup: LatLng, dropoff: LatLng): string {
  return `${origin.latitude.toFixed(4)},${origin.longitude.toFixed(4)}-${pickup.latitude.toFixed(4)},${pickup.longitude.toFixed(4)}-${dropoff.latitude.toFixed(4)},${dropoff.longitude.toFixed(4)}`;
}

// Format time in minutes to a readable string
export function formatDuration(minutes: number): string {
  if (minutes < 1) return "< 1 min";
  return `${Math.round(minutes)} min`;
}

// Format distance in kilometers to a readable string
export function formatDistance(km: number): string {
  if (km < 0.1) return "< 0.1 km";
  return `${km.toFixed(1)} km`;
}

// Simple distance calculation as fallback
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371e3; // Earth's radius in meters
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1), Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fallback calculation based on distance (assumes 40 km/h average speed in city)
function getFallbackDuration(from: LatLng, to: LatLng): number {
  const distanceM = haversineDistance(from.latitude, from.longitude, to.latitude, to.longitude);
  return Math.ceil((distanceM / 1000) / 0.666); // 40 km/h = 0.666 km/min
}

// Get fallback distance in km
export function getFallbackDistance(from: LatLng, to: LatLng): number {
  const distanceM = haversineDistance(from.latitude, from.longitude, to.latitude, to.longitude);
  return Math.round((distanceM / 1000) * 10) / 10; // Round to 1 decimal place
}

// Get directions between two points using Google Maps API
export async function getDirectionData(
  from: LatLng, 
  to: LatLng
): Promise<{ duration: number; distance: number }> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Maps API key not found in environment variables, using fallback calculation');
    return {
      duration: getFallbackDuration(from, to),
      distance: getFallbackDistance(from, to)
    };
  }
  
  try {
    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
    
    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: from.latitude,
            longitude: from.longitude
          }
        }
      },
      destination: {
        location: {
          latLng: {
            latitude: to.latitude,
            longitude: to.longitude
          }
        }
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE'
    };
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const json = await res.json();
    
    if (!json.routes || json.routes.length === 0) {
      throw new Error(`Routes API error: No routes found`);
    }
    
    const route = json.routes[0];
    const durationSeconds = route.duration ? parseInt(route.duration.replace('s', '')) : null;
    const distanceMeters = route.distanceMeters;
    
    return {
      duration: durationSeconds ? Math.ceil(durationSeconds / 60) : getFallbackDuration(from, to),
      distance: distanceMeters ? Math.round((distanceMeters / 1000) * 10) / 10 : getFallbackDistance(from, to)
    };
  } catch (error) {
    console.warn('Failed to get directions from Google Maps API, using fallback:', error);
    return {
      duration: getFallbackDuration(from, to),
      distance: getFallbackDistance(from, to)
    };
  }
}

// Get direction data between two points with caching
export async function getCachedDirectionData(
  from: LatLng, 
  to: LatLng,
  skipCache: boolean = false
): Promise<{ duration: number; distance: number }> {
  // Generate simple cache key for point-to-point
  const cacheKey = `${from.latitude.toFixed(4)},${from.longitude.toFixed(4)}-${to.latitude.toFixed(4)},${to.longitude.toFixed(4)}`;
  
  // Check cache
  if (!skipCache) {
    const cached = directionsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      return { 
        duration: cached.directions.toPickup, 
        distance: cached.directions.pickupDistance 
      };
    }
  }
  
  // Get fresh data
  const data = await getDirectionData(from, to);
  
  // Cache the result as a simplified RideDirections
  directionsCache.set(cacheKey, {
    directions: {
      toPickup: data.duration,
      toDropoff: 0,
      pickupDistance: data.distance,
      dropoffDistance: 0
    },
    timestamp: Date.now()
  });
  
  return data;
}

// Main function to get ride durations between origin, pickup, and dropoff
export async function getRideDurations(
  origin: LatLng,
  pickup: LatLng,
  dropoff: LatLng,
  skipCache: boolean = false
): Promise<RideDirections> {
  const cacheKey = getDirectionsCacheKey(origin, pickup, dropoff);

  // Check cache first
  if (!skipCache) {
    const cached = directionsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      return cached.directions;
    }
  }

  // Get fresh data for both legs
  const [toPickupData, toDropoffData] = await Promise.all([
    getDirectionData(origin, pickup),
    getDirectionData(pickup, dropoff)
  ]);

  const directions = {
    toPickup: toPickupData.duration,
    toDropoff: toDropoffData.duration,
    pickupDistance: toPickupData.distance,
    dropoffDistance: toDropoffData.distance
  };

  // Update cache
  directionsCache.set(cacheKey, { directions, timestamp: Date.now() });

  return directions;
}
