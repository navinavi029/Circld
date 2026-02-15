import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getCurrentLocation } from '../utils/location';

// Fix for default marker icon in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface MapPickerProps {
  initialCoordinates?: Coordinates | null;
  onLocationSelect: (coordinates: Coordinates, address: string) => void;
  onClose: () => void;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function LocationMarker({ position, onPositionChange }: { 
  position: [number, number]; 
  onPositionChange: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  return <Marker position={position} />;
}

export function MapPicker({ initialCoordinates, onLocationSelect, onClose }: MapPickerProps) {
  const initialPos: [number, number] = initialCoordinates 
    ? [initialCoordinates.latitude, initialCoordinates.longitude]
    : [40.7128, -74.0060]; // Default to New York
  
  const [tempPosition, setTempPosition] = useState<[number, number]>(initialPos);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  // Fetch address from coordinates using reverse geocoding
  const fetchAddress = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        setAddress(data.display_name);
        
        // Extract city from address components
        const addressData = data.address;
        const cityName = 
          addressData?.city || 
          addressData?.town || 
          addressData?.village || 
          addressData?.municipality ||
          addressData?.county ||
          addressData?.state ||
          'Unknown location';
        
        setCity(cityName);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setCity(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Search for location by query
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPosition: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setTempPosition(newPosition);
        await fetchAddress(newPosition[0], newPosition[1]);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-detect current location
  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      const locationData = await getCurrentLocation();
      const newPosition: [number, number] = [
        locationData.coordinates.latitude,
        locationData.coordinates.longitude
      ];
      setTempPosition(newPosition);
      
      // Extract city from the full address
      const addressParts = locationData.address.split(',');
      // Try to get the city (usually the first or second part)
      const cityName = addressParts[0]?.trim() || locationData.address;
      
      setAddress(locationData.address);
      setCity(cityName);
    } catch (error) {
      console.error('Error detecting location:', error);
      // Optionally show an error message to the user
    } finally {
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    fetchAddress(tempPosition[0], tempPosition[1]);
  }, [tempPosition]);

  const handleConfirm = () => {
    onLocationSelect(
      { latitude: tempPosition[0], longitude: tempPosition[1] },
      city // Pass only the city name instead of full address
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-text dark:text-gray-100">
              Pick Location
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
              placeholder="Search for a location..."
              className="flex-1 px-4 py-2 border-2 border-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text dark:text-gray-100 focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
            />
            <button
              onClick={searchLocation}
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-2 bg-primary hover:bg-primary-light dark:bg-primary-light dark:hover:bg-primary text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSearching ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search</span>
                </>
              )}
            </button>
            <button
              onClick={detectLocation}
              disabled={isDetecting}
              className="px-4 py-2 bg-accent hover:bg-accent-light dark:bg-accent dark:hover:bg-accent-light text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              title="Detect my location"
            >
              {isDetecting ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative overflow-hidden">
          <MapContainer
            center={initialPos}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={tempPosition} />
            <LocationMarker position={tempPosition} onPositionChange={setTempPosition} />
          </MapContainer>

          {/* Instructions Overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[1000]">
            <p className="text-sm text-text dark:text-gray-300 flex items-center space-x-2">
              <svg className="w-4 h-4 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Click on the map to select a location</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          {/* Selected Address */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">
              Selected Location
            </label>
            <div className="flex items-start space-x-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <svg className="w-5 h-5 text-primary dark:text-primary-light mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                {isLoadingAddress ? (
                  <p className="text-sm text-text-secondary dark:text-gray-400">Loading address...</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-text dark:text-gray-100">{city || 'No city found'}</p>
                    <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">{address || 'No address found'}</p>
                  </>
                )}
                <p className="text-xs text-text-secondary dark:text-gray-500 mt-1">
                  {tempPosition[0].toFixed(6)}, {tempPosition[1].toFixed(6)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleConfirm}
              disabled={isLoadingAddress}
              className="flex-1 bg-accent hover:bg-accent-light dark:bg-accent dark:hover:bg-accent-light text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Confirm Location</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-text dark:text-gray-100 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
