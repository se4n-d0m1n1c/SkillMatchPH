import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Search, 
  Navigation, 
  X, 
  Check, 
  Crosshair, 
  Building, 
  Sparkles,
  School,
  Compass
} from 'lucide-react';
import L from 'leaflet';
import { 
  POPULAR_LOCATION_HUBS, 
  UNIVERSITY_COORDINATES, 
  calculateHaversineDistanceKm 
} from '../../data/locationsData';

// Fix standard Leaflet default icons in Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Grab-style Pin Icon
const grabPinIcon = L.divIcon({
  className: 'grab-custom-pin',
  html: `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%);
    ">
      <div style="
        background: #00f5ff;
        color: #0a0f1e;
        padding: 6px 12px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 11px;
        box-shadow: 0 4px 15px rgba(0, 245, 255, 0.5);
        white-space: nowrap;
        border: 2px solid #fff;
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        <span>📍 Pinned Location</span>
      </div>
      <div style="
        width: 14px;
        height: 14px;
        background: #00f5ff;
        border: 3px solid #fff;
        border-radius: 50%;
        margin-top: 2px;
        box-shadow: 0 0 10px rgba(0, 245, 255, 0.8);
      "></div>
      <div style="
        width: 6px;
        height: 6px;
        background: rgba(0,0,0,0.3);
        border-radius: 50%;
        filter: blur(1px);
        margin-top: 2px;
      "></div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0]
});

// University Marker Icon
const createUniIcon = (uniName) => L.divIcon({
  className: 'uni-custom-pin',
  html: `
    <div style="
      background: rgba(112, 0, 255, 0.9);
      color: #fff;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 3px;
      transform: translate(-50%, -50%);
    ">
      <span>🎓 ${uniName.replace('University of the Philippines', 'UP').replace('University of Santo Tomas', 'UST').replace('De La Salle University', 'DLSU').replace('Ateneo de Manila University', 'Ateneo').replace('Polytechnic University of the Philippines', 'PUP').replace('Far Eastern University', 'FEU').replace('University of San Carlos', 'USC')}</span>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0]
});

export default function GrabLocationPickerModal({ initialLocation, onSelectLocation, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pinMarkerRef = useRef(null);

  const [currentLat, setCurrentLat] = useState(initialLocation?.lat || 14.6538);
  const [currentLng, setCurrentLng] = useState(initialLocation?.lng || 121.0685);
  const [currentAddress, setCurrentAddress] = useState(initialLocation?.address || 'Diliman, Quezon City, Metro Manila');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Initialize and update the Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 13,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // CartoDB Dark Matter tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      // Add university campus markers on the map
      Object.entries(UNIVERSITY_COORDINATES).forEach(([uniName, coords]) => {
        L.marker([coords.lat, coords.lng], { icon: createUniIcon(uniName) })
          .addTo(map)
          .bindPopup(`<strong>${uniName}</strong><br/>${coords.city}`);
      });

      // Add draggable/clickable user pin
      const pin = L.marker([currentLat, currentLng], {
        icon: grabPinIcon,
        draggable: true
      }).addTo(map);

      pin.on('dragend', async (e) => {
        const { lat, lng } = e.target.getLatLng();
        updatePinnedCoordinates(lat, lng, map);
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        pin.setLatLng([lat, lng]);
        updatePinnedCoordinates(lat, lng, map);
      });

      mapInstanceRef.current = map;
      pinMarkerRef.current = pin;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const updatePinnedCoordinates = async (lat, lng, mapInstance = mapInstanceRef.current) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    if (pinMarkerRef.current) {
      pinMarkerRef.current.setLatLng([lat, lng]);
    }
    if (mapInstance) {
      mapInstance.panTo([lat, lng], { animate: true, duration: 0.5 });
    }

    // Reverse geocode with OpenStreetMap Nominatim
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      if (res.ok) {
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.municipality || data.address?.county || 'Metro Manila';
        const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.road || '';
        const region = data.address?.state || 'Philippines';
        const formatted = [suburb, city, region].filter(Boolean).join(', ');
        setCurrentAddress(formatted || data.display_name?.split(',').slice(0, 3).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch {
      setCurrentAddress(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    } finally {
      setIsGeocoding(false);
    }
  };

  // GPS Locate Current Location
  const handleGPSLocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        updatePinnedCoordinates(latitude, longitude);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 15);
        }
        setIsLocatingGPS(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        alert('Could not access your location. You can search or drop a pin on the map instead.');
        setIsLocatingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Select a preset hub
  const handleSelectHub = (hub) => {
    updatePinnedCoordinates(hub.lat, hub.lng);
    setCurrentAddress(hub.label);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([hub.lat, hub.lng], 14);
    }
  };

  // Search address by text
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Philippines')}&countrycodes=ph&limit=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          updatePinnedCoordinates(lat, lon);
          setCurrentAddress(data[0].display_name.split(',').slice(0, 3).join(','));
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lon], 14);
          }
        } else {
          alert('Location not found in the Philippines. Please try another search term or click on the map.');
        }
      }
    } catch {
      alert('Network error searching location. You can click on the map to place the pin.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleConfirm = () => {
    onSelectLocation({
      address: currentAddress,
      lat: currentLat,
      lng: currentLng,
      label: currentAddress
    });
    onClose();
  };

  // Real-time nearest university distance calculation
  const topNearestUnis = Object.entries(UNIVERSITY_COORDINATES).map(([name, coords]) => {
    const dist = calculateHaversineDistanceKm(currentLat, currentLng, coords.lat, coords.lng);
    return { name, dist, city: coords.city };
  }).sort((a, b) => a.dist - b.dist).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem'
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '24px',
          border: '1.5px solid var(--accent-teal)',
          boxShadow: '0 12px 40px rgba(0, 245, 255, 0.2)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(10, 15, 30, 0.8)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(0, 245, 255, 0.15)', color: 'var(--accent-teal)' }}>
              <Navigation size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                Set Exact Location Pin
              </h3>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Pin your city or address to calculate university commute distances
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Search & Quick Chips Bar */}
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--glass-border)' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, barangay, or landmark (e.g. Katipunan, España, Los Baños)..."
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem 0.65rem 2.6rem',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--bg-deep)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '0.65rem 1.2rem',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--accent-teal)',
                color: '#0a0f1e',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleGPSLocate}
              disabled={isLocatingGPS}
              title="Use current GPS location"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1rem',
                borderRadius: '10px',
                border: '1px solid rgba(0, 245, 255, 0.3)',
                background: 'rgba(0, 245, 255, 0.1)',
                color: 'var(--accent-teal)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Crosshair size={16} />
              {isLocatingGPS ? 'Locating...' : 'GPS'}
            </button>
          </form>

          {/* Quick Hub Chips */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
            {POPULAR_LOCATION_HUBS.map(hub => (
              <button
                key={hub.id}
                type="button"
                onClick={() => handleSelectHub(hub)}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                📍 {hub.name}
              </button>
            ))}
          </div>
        </div>

        {/* Map View Area */}
        <div style={{ position: 'relative', height: '340px', width: '100%' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Map floating prompt */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10, 15, 30, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '4px 12px',
            borderRadius: '20px',
            border: '1px solid var(--glass-border)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            pointerEvents: 'none',
            zIndex: 900
          }}>
            Click or drag anywhere to drop the pin
          </div>
        </div>

        {/* Bottom Pinned Location Card & Confirm Button */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'rgba(10, 15, 30, 0.95)',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Pinned Location
            </span>
            <h4 style={{ margin: '0.1rem 0 0', fontSize: '1.05rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
              {isGeocoding ? 'Detecting address...' : currentAddress}
            </h4>

            {/* Live Distance Preview to Nearest Campuses */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
              {topNearestUnis.map(u => (
                <span
                  key={u.name}
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  🎓 {u.name.replace('University of the Philippines', 'UP').replace('University of Santo Tomas', 'UST').replace('De La Salle University', 'DLSU').replace('Ateneo de Manila University', 'Ateneo')}: <strong style={{ color: '#4ade80' }}>{u.dist} km</strong>
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Cancel
            </button>

            <motion.button
              onClick={handleConfirm}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.75rem 1.8rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-violet))',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0, 245, 255, 0.3)'
              }}
            >
              <Check size={18} /> Confirm Location
            </motion.button>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
}
