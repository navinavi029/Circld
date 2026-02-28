/**
 * Location utilities for GPS detection and distance calculation
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  address: string;
  coordinates: Coordinates;
}

/**
 * Get user's current location using browser geolocation API
 */
export async function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coordinates: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        try {
          // Reverse geocode to get readable address
          const address = await reverseGeocode(coordinates);
          resolve({ address, coordinates });
        } catch (_error) {
          // If reverse geocoding fails, still return coordinates with a fallback address
          resolve({
            address: `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`,
            coordinates
          });
        }
      },
      (error) => {
        let message = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Reverse geocode coordinates to readable address using Nominatim (OpenStreetMap)
 * Returns only City and State/Province for privacy
 */
async function reverseGeocode(coords: Coordinates): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'CircldApp/1.0' // Nominatim requires a user agent
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch address');
  }

  const data = await response.json();
  
  // Format address: City, State/Province only (for privacy)
  const address = data.address;
  const parts = [];
  
  if (address.city || address.town || address.village) {
    parts.push(address.city || address.town || address.village);
  }
  if (address.state || address.province) {
    parts.push(address.state || address.province);
  }
  
  // Fallback if no city/state found
  if (parts.length === 0) {
    if (address.county) parts.push(address.county);
    if (address.state) parts.push(address.state);
  }
  
  return parts.join(', ') || 'Location detected';
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
  coords1: Coordinates,
  coords2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  
  const lat1 = coords1.latitude * Math.PI / 180;
  const lat2 = coords2.latitude * Math.PI / 180;
  const dLat = (coords2.latitude - coords1.latitude) * Math.PI / 180;
  const dLon = (coords2.longitude - coords1.longitude) * Math.PI / 180;

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m away`;
  } else if (km < 10) {
    return `${km.toFixed(1)}km away`;
  } else {
    return `${Math.round(km)}km away`;
  }
}

/**
 * Calculate distance for an item, handling null coordinates
 * @param userCoords - Current user's coordinates (can be null)
 * @param ownerCoords - Item owner's coordinates (can be null)
 * @returns Distance in kilometers, or null if either coordinate is missing
 */
export function calculateDistanceForItem(
  userCoords: Coordinates | null,
  ownerCoords: Coordinates | null
): number | null {
  if (!userCoords || !ownerCoords) {
    return null;
  }
  return calculateDistance(userCoords, ownerCoords);
}

/**
 * Format distance display with meters/km/100+ logic
 * @param distance - Distance in kilometers (can be null)
 * @param location - Fallback location string (city/region)
 * @returns Formatted distance string or location fallback
 */
export function formatDistanceDisplay(
  distance: number | null,
  location: string
): string {
  // If no distance calculated, show location only
  if (distance === null) {
    return location;
  }

  // Distance > 100 km: show "100+ km away"
  if (distance > 100) {
    return '100+ km away';
  }

  // Distance < 1 km: show in meters
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m away`;
  }

  // Distance 1-100 km: show in km
  if (distance < 10) {
    return `${distance.toFixed(1)}km away`;
  } else {
    return `${Math.round(distance)}km away`;
  }
}
