import { useState, useEffect } from 'react';
import { MapPin, X, Search, Navigation, Loader2, Map } from 'lucide-react';
import { toast } from 'sonner';

interface LocationSelectorProps {
  currentLocation: string;
  onLocationChange: (location: string) => void;
  onClose: () => void;
}

// Popular Kolkata locations for quick selection
const POPULAR_LOCATIONS = [
  'Newtown, Kolkata',
  'College Street, Kolkata',
  'Park Street, Kolkata',
  'Salt Lake, Kolkata',
  'Howrah, Kolkata',
  'Ballygunge, Kolkata',
  'Alipore, Kolkata',
  'Rajarhat, Kolkata',
  'Tollygunge, Kolkata',
  'Jadavpur, Kolkata',
  'Behala, Kolkata',
  'Dum Dum, Kolkata',
];

declare global {
  interface Window {
    google: any;
  }
}

export function LocationSelector({ currentLocation, onLocationChange, onClose }: LocationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(currentLocation);
  const [manualAddress, setManualAddress] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 22.5726, lng: 88.3639 });

  const filteredLocations = POPULAR_LOCATIONS.filter(location =>
    location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load Google Maps script
  useEffect(() => {
    if (showMap && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [showMap]);

  // Initialize map when shown
  useEffect(() => {
    if (showMap && window.google && window.google.maps) {
      initializeMap();
    }
  }, [showMap, mapCenter]);

  const initializeMap = () => {
    const mapElement = document.getElementById('location-map');
    if (!mapElement) return;

    const map = new window.google.maps.Map(mapElement, {
      center: mapCenter,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
    });

    const marker = new window.google.maps.Marker({
      position: mapCenter,
      map: map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    });

    marker.addListener('dragend', async () => {
      const position = marker.getPosition();
      if (position) {
        const lat = position.lat();
        const lng = position.lng();
        await reverseGeocode(lat, lng);
      }
    });

    map.addListener('click', async (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      marker.setPosition(e.latLng);
      await reverseGeocode(lat, lng);
    });
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch address');
      
      const data = await response.json();
      const address = data.address;
      
      const parts = [];
      if (address.building) parts.push(address.building);
      if (address.house_number) parts.push(address.house_number);
      if (address.road) parts.push(address.road);
      if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
      if (address.city || address.town || address.village) parts.push(address.city || address.town || address.village);
      if (address.state) parts.push(address.state);
      if (address.postcode) parts.push(address.postcode);
      if (address.country) parts.push(address.country);
      
      const formattedAddress = parts.join(', ');
      setManualAddress(formattedAddress);
      setSelectedLocation(formattedAddress);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      toast.error('Could not fetch address details');
    }
  };

  const handleSelectLocation = (location: string) => {
    setSelectedLocation(location);
    setManualAddress('');
  };

  const handleSaveLocation = () => {
    const locationToSave = manualAddress.trim() || selectedLocation;
    onLocationChange(locationToSave);
    localStorage.setItem('userLocation', locationToSave);
    toast.success('Delivery location updated');
    onClose();
  };

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter({ lat: latitude, lng: longitude });
        setShowMap(true);
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en'
              }
            }
          );
          
          if (!response.ok) throw new Error('Failed to fetch address');
          
          const data = await response.json();
          const address = data.address;
          
          const parts = [];
          if (address.building) parts.push(address.building);
          if (address.house_number) parts.push(address.house_number);
          if (address.road) parts.push(address.road);
          if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
          if (address.city || address.town || address.village) parts.push(address.city || address.town || address.village);
          if (address.state) parts.push(address.state);
          if (address.postcode) parts.push(address.postcode);
          if (address.country) parts.push(address.country);
          
          const formattedAddress = parts.join(', ');
          setManualAddress(formattedAddress);
          setSelectedLocation(formattedAddress);
          toast.success('Location detected! Adjust pin on map if needed.');
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          toast.error('Could not fetch address details');
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        setIsDetecting(false);
        console.error('Geolocation error:', error);
        
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location access denied. Please enable location permissions.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error('Location information unavailable.');
        } else if (error.code === error.TIMEOUT) {
          toast.error('Location request timed out.');
        } else {
          toast.error('Unable to detect location. Please select manually.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div className="bg-[#2C1810] border-2 border-[#8B6F47] rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#8B6F47] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#3D2817] p-2 rounded-lg">
              <MapPin className="size-5 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#F5E6D3]">Choose Delivery Location</h3>
              <p className="text-xs text-[#A08968]">Select your delivery area</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#3D2817] rounded-lg transition-colors"
          >
            <X className="size-5 text-[#A08968]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Google Map View */}
          {showMap && (
            <div className="px-6 py-4 border-b border-[#8B6F47]">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Map className="size-4 text-[#D4AF37]" />
                  <h4 className="text-sm font-semibold text-[#F5E6D3]">Select Location on Map</h4>
                </div>
                <button
                  onClick={() => setShowMap(false)}
                  className="text-xs text-[#D4AF37] hover:text-[#FFD700] font-medium"
                >
                  Hide Map
                </button>
              </div>
              <div 
                id="location-map" 
                className="w-full h-64 rounded-lg border-2 border-[#8B6F47] bg-[#3D2817]"
              ></div>
              <p className="text-xs text-[#A08968] mt-2">
                💡 Click on map or drag the pin to select your exact location
              </p>
            </div>
          )}

          {/* Detect Location Button */}
          <div className="px-6 py-4 border-b border-[#8B6F47]">
            <button
              onClick={handleDetectLocation}
              disabled={isDetecting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#3D2817] hover:bg-[#4D3827] border border-[#8B6F47] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="size-5 text-[#D4AF37] animate-spin" />
                  <span className="font-medium text-[#F5E6D3]">Detecting location...</span>
                </>
              ) : showMap ? (
                <>
                  <Navigation className="size-5 text-[#D4AF37]" />
                  <span className="font-medium text-[#F5E6D3]">Re-detect my location</span>
                </>
              ) : (
                <>
                  <Navigation className="size-5 text-[#D4AF37]" />
                  <span className="font-medium text-[#F5E6D3]">Use my current location</span>
                </>
              )}
            </button>
          </div>

          {/* Manual Address Input */}
          <div className="px-6 py-4 border-b border-[#8B6F47]">
            <label className="block text-sm font-semibold text-[#A08968] mb-2 uppercase tracking-wide">
              Or Enter Address Manually
            </label>
            <textarea
              placeholder="Enter your full address (Building, Street, Area, City, State, Pincode)..."
              value={manualAddress}
              onChange={(e) => {
                setManualAddress(e.target.value);
                setSelectedLocation(e.target.value);
              }}
              rows={3}
              className="w-full px-4 py-2.5 bg-[#3D2817] border border-[#8B6F47] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] placeholder-[#A08968] text-[#F5E6D3] resize-none"
            />
          </div>

          {/* Search Popular Locations */}
          <div className="px-6 py-4 border-b border-[#8B6F47]">
            <label className="block text-sm font-semibold text-[#A08968] mb-2 uppercase tracking-wide">
              Or Choose from Popular Locations
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#A08968]" />
              <input
                type="text"
                placeholder="Search for area, street name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#3D2817] border border-[#8B6F47] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] placeholder-[#A08968] text-[#F5E6D3]"
              />
            </div>
          </div>

          {/* Popular Locations List */}
          <div className="px-6 py-4">
            <div className="space-y-2">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((location) => (
                  <button
                    key={location}
                    onClick={() => handleSelectLocation(location)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      selectedLocation === location && !manualAddress
                        ? 'bg-[#D4AF37] text-[#2C1810]'
                        : 'bg-[#3D2817] hover:bg-[#4D3827] text-[#F5E6D3]'
                    }`}
                  >
                    <MapPin className={`size-4 ${
                      selectedLocation === location && !manualAddress ? 'text-[#2C1810]' : 'text-[#D4AF37]'
                    }`} />
                    <span className="font-medium">{location}</span>
                    {selectedLocation === location && !manualAddress && (
                      <div className="ml-auto w-5 h-5 bg-[#2C1810] rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-[#D4AF37] rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-[#A08968]">No locations found</p>
                  <p className="text-xs text-[#8B6F47] mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#8B6F47] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-[#3D2817] hover:bg-[#4D3827] border border-[#8B6F47] rounded-lg font-medium text-[#F5E6D3] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveLocation}
            className="flex-1 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C49F27] rounded-lg font-semibold text-[#2C1810] transition-colors"
          >
            Save Location
          </button>
        </div>
      </div>
    </div>
  );
}
