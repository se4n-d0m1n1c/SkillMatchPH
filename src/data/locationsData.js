// Philippine Locations & Coordinates Engine with Haversine Geodetic Distance

export const UNIVERSITY_COORDINATES = {
  'University of the Philippines Diliman': { lat: 14.6538, lng: 121.0685, city: 'Quezon City', region: 'Metro Manila' },
  'Ateneo de Manila University': { lat: 14.6397, lng: 121.0778, city: 'Quezon City', region: 'Metro Manila' },
  'De La Salle University': { lat: 14.5648, lng: 120.9932, city: 'Manila', region: 'Metro Manila' },
  'University of Santo Tomas': { lat: 14.6095, lng: 120.9899, city: 'Manila', region: 'Metro Manila' },
  'Mapúa University': { lat: 14.5905, lng: 120.9780, city: 'Manila', region: 'Metro Manila' },
  'Polytechnic University of the Philippines': { lat: 14.5979, lng: 121.0108, city: 'Manila', region: 'Metro Manila' },
  'Far Eastern University': { lat: 14.6039, lng: 120.9870, city: 'Manila', region: 'Metro Manila' },
  'University of the Philippines Manila': { lat: 14.5794, lng: 120.9858, city: 'Manila', region: 'Metro Manila' },
  'University of the Philippines Los Baños': { lat: 14.1675, lng: 121.2434, city: 'Los Baños, Laguna', region: 'CALABARZON' },
  'University of San Carlos': { lat: 10.3541, lng: 123.9135, city: 'Cebu City', region: 'Central Visayas' }
};

export const POPULAR_LOCATION_HUBS = [
  { id: 'qc-diliman', name: 'Diliman / Katipunan (QC)', label: 'Diliman, Quezon City, Metro Manila', lat: 14.6507, lng: 121.0667, tag: 'QC University Hub' },
  { id: 'mnl-ubelt', name: 'University Belt (España / Sampaloc)', label: 'Sampaloc, Manila, Metro Manila', lat: 14.6065, lng: 120.9890, tag: 'U-Belt Manila' },
  { id: 'mnl-taft', name: 'Taft Avenue / Malate', label: 'Taft Avenue, Manila, Metro Manila', lat: 14.5665, lng: 120.9935, tag: 'Taft Campus Strip' },
  { id: 'bgc-taguig', name: 'BGC / Taguig', label: 'Bonifacio Global City, Taguig, Metro Manila', lat: 14.5547, lng: 121.0494, tag: 'Taguig / BGC' },
  { id: 'laguna-lb', name: 'Los Baños (Laguna)', label: 'Los Baños, Laguna', lat: 14.1700, lng: 121.2440, tag: 'Southern Luzon Hub' },
  { id: 'cebu-city', name: 'Cebu City (Central Visayas)', label: 'Cebu City, Cebu', lat: 10.3157, lng: 123.8854, tag: 'Visayas Hub' },
  { id: 'davao-city', name: 'Davao City (Mindanao)', label: 'Davao City, Davao del Sur', lat: 7.1907, lng: 125.4553, tag: 'Mindanao Hub' },
  { id: 'baguio-city', name: 'Baguio City (CAR / Northern Luzon)', label: 'Baguio City, Benguet', lat: 16.4023, lng: 120.5960, tag: 'Pines City Hub' },
  { id: 'pampanga-angeles', name: 'Angeles / San Fernando (Pampanga)', label: 'Angeles City, Pampanga', lat: 15.1450, lng: 120.5887, tag: 'Central Luzon Hub' }
];

export const PHILIPPINE_LOCATIONS = [
  { id: 'all', label: 'All Philippines (Nationwide)', region: 'All', lat: 14.5995, lng: 120.9842 },
  { id: 'ncr-qc', label: 'Quezon City, Metro Manila', city: 'Quezon City', region: 'Metro Manila', lat: 14.6760, lng: 121.0437 },
  { id: 'ncr-manila', label: 'Manila, Metro Manila', city: 'Manila', region: 'Metro Manila', lat: 14.5995, lng: 120.9842 },
  { id: 'ncr-all', label: 'Metro Manila (NCR - All Cities)', city: 'Metro Manila', region: 'Metro Manila', lat: 14.5995, lng: 120.9842 },
  { id: 'r4a-laguna', label: 'Los Baños / Laguna (Region IV-A)', city: 'Laguna', region: 'CALABARZON', lat: 14.1700, lng: 121.2440 },
  { id: 'r4a-cavite', label: 'Cavite (Region IV-A)', city: 'Cavite', region: 'CALABARZON', lat: 14.4791, lng: 120.8969 },
  { id: 'r4a-batangas', label: 'Batangas (Region IV-A)', city: 'Batangas', region: 'CALABARZON', lat: 13.7565, lng: 121.0583 },
  { id: 'r4a-rizal', label: 'Rizal / Antipolo (Region IV-A)', city: 'Rizal', region: 'CALABARZON', lat: 14.5869, lng: 121.1764 },
  { id: 'r3-pampanga', label: 'Pampanga / Angeles (Region III)', city: 'Pampanga', region: 'Central Luzon', lat: 15.1450, lng: 120.5887 },
  { id: 'r3-bulacan', label: 'Bulacan (Region III)', city: 'Bulacan', region: 'Central Luzon', lat: 14.8521, lng: 120.8160 },
  { id: 'r7-cebu', label: 'Cebu City / Cebu (Region VII)', city: 'Cebu', region: 'Central Visayas', lat: 10.3157, lng: 123.8854 },
  { id: 'r6-iloilo', label: 'Iloilo City / Panay (Region VI)', city: 'Iloilo', region: 'Western Visayas', lat: 10.7202, lng: 122.5621 },
  { id: 'r6-bacolod', label: 'Bacolod / Negros (Region VI)', city: 'Bacolod', region: 'Western Visayas', lat: 10.6766, lng: 122.9509 },
  { id: 'r11-davao', label: 'Davao City / Davao (Region XI)', city: 'Davao', region: 'Davao Region', lat: 7.1907, lng: 125.4553 },
  { id: 'r10-cdo', label: 'Cagayan de Oro (Region X)', city: 'Cagayan de Oro', region: 'Northern Mindanao', lat: 8.4542, lng: 124.6319 },
  { id: 'car-baguio', label: 'Baguio City / Benguet (CAR)', city: 'Baguio', region: 'Cordillera', lat: 16.4023, lng: 120.5960 },
  { id: 'r1-launion', label: 'La Union / Ilocos (Region I)', city: 'La Union', region: 'Ilocos', lat: 16.6159, lng: 120.3209 }
];

/**
 * Calculates straight-line distance in kilometers between two GPS coordinates using Haversine formula
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
}

/**
 * Resolves coordinates for a university from its name or location string
 */
export function getUniversityCoordinates(uniName, locationStr) {
  if (UNIVERSITY_COORDINATES[uniName]) {
    return UNIVERSITY_COORDINATES[uniName];
  }

  const loc = (locationStr || uniName || '').toLowerCase();
  if (loc.includes('quezon')) return { lat: 14.6538, lng: 121.0685 };
  if (loc.includes('manila')) return { lat: 14.5995, lng: 120.9842 };
  if (loc.includes('los baños') || loc.includes('laguna')) return { lat: 14.1675, lng: 121.2434 };
  if (loc.includes('cebu')) return { lat: 10.3157, lng: 123.8854 };
  if (loc.includes('davao')) return { lat: 7.1907, lng: 125.4553 };
  if (loc.includes('baguio')) return { lat: 16.4023, lng: 120.5960 };

  return { lat: 14.5995, lng: 120.9842 };
}

/**
 * Calculates exact distance, travel estimates, and proximity tags between user location & university
 */
export function calculateLocationProximity(userLocObjOrStr, universityLocationStr, uniName = '') {
  let userLat = null;
  let userLng = null;
  let userLabel = '';

  if (typeof userLocObjOrStr === 'object' && userLocObjOrStr !== null) {
    userLat = userLocObjOrStr.lat;
    userLng = userLocObjOrStr.lng;
    userLabel = userLocObjOrStr.address || userLocObjOrStr.label || '';
  } else if (typeof userLocObjOrStr === 'string') {
    userLabel = userLocObjOrStr;
    const matched = PHILIPPINE_LOCATIONS.find(l => l.label === userLocObjOrStr || l.id === userLocObjOrStr);
    if (matched) {
      userLat = matched.lat;
      userLng = matched.lng;
    }
  }

  const uniCoords = getUniversityCoordinates(uniName, universityLocationStr);
  let distanceKm = null;

  if (userLat && userLng && uniCoords.lat && uniCoords.lng) {
    distanceKm = calculateHaversineDistanceKm(userLat, userLng, uniCoords.lat, uniCoords.lng);
  }

  // Format Grab-style distance and commute estimates
  if (distanceKm !== null) {
    if (distanceKm <= 5) {
      return {
        matchLevel: 'very_close',
        score: 4,
        distanceKm,
        distanceText: `${distanceKm} km away`,
        commuteEstimate: '~10–15 mins ride',
        label: `📍 Very Close (${distanceKm} km)`,
        isNearby: true,
        badgeColor: '#4ade80'
      };
    } else if (distanceKm <= 18) {
      return {
        matchLevel: 'city',
        score: 3,
        distanceKm,
        distanceText: `${distanceKm} km away`,
        commuteEstimate: '~25–40 mins commute',
        label: `📍 Within City Area (${distanceKm} km)`,
        isNearby: false,
        badgeColor: '#00f5ff'
      };
    } else if (distanceKm <= 50) {
      return {
        matchLevel: 'region',
        score: 2,
        distanceKm,
        distanceText: `${distanceKm} km away`,
        commuteEstimate: '~1 hr travel',
        label: `📍 Regional (${distanceKm} km)`,
        isNearby: false,
        badgeColor: '#fbbf24'
      };
    } else {
      return {
        matchLevel: 'provincial',
        score: 1,
        distanceKm,
        distanceText: `${distanceKm} km away`,
        commuteEstimate: 'Provincial travel / Relocation',
        label: `${distanceKm} km away`,
        isNearby: false,
        badgeColor: 'rgba(255,255,255,0.4)'
      };
    }
  }

  // Fallback text matching
  const uLoc = userLabel.toLowerCase();
  const target = (universityLocationStr || '').toLowerCase();

  if (
    (uLoc.includes('manila') && target.includes('manila')) ||
    (uLoc.includes('quezon') && target.includes('quezon')) ||
    (uLoc.includes('laguna') && target.includes('laguna')) ||
    (uLoc.includes('cebu') && target.includes('cebu'))
  ) {
    return {
      matchLevel: 'city',
      score: 3,
      distanceKm: 8.0,
      distanceText: '~8 km away',
      commuteEstimate: '~25 mins',
      label: 'In Your City Area',
      isNearby: false,
      badgeColor: '#4ade80'
    };
  }

  return {
    matchLevel: 'other',
    score: 0,
    distanceKm: null,
    distanceText: null,
    commuteEstimate: null,
    label: null,
    isNearby: false
  };
}

/**
 * Storage helpers for user pinned location
 */
export function getSavedPinnedLocation(userId) {
  try {
    const raw = localStorage.getItem(`skillmatch_pinned_location_${userId || 'guest'}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  // Default: Quezon City / Metro Manila hub
  return {
    address: 'Diliman, Quezon City, Metro Manila',
    lat: 14.6538,
    lng: 121.0685,
    city: 'Quezon City',
    region: 'Metro Manila'
  };
}

export function savePinnedLocation(userId, locationObj) {
  try {
    localStorage.setItem(`skillmatch_pinned_location_${userId || 'guest'}`, JSON.stringify(locationObj));
  } catch {
    // ignore
  }
}
