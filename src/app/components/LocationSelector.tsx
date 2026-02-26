import { useState } from 'react';
import { MapPin, X, Search, Navigation } from 'lucide-react';

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

export function LocationSelector({ currentLocation, onLocationChange, onClose }: LocationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(currentLocation);

  const filteredLocations = POPULAR_LOCATIONS.filter(location =>
    location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectLocation = (location: string) => {
    setSelectedLocation(location);
  };

  const handleSaveLocation = () => {
    onLocationChange(selectedLocation);
    onClose();
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you would reverse geocode these coordinates
          // For now, we'll set a default location
          const detectedLocation = 'Newtown, Kolkata';
          setSelectedLocation(detectedLocation);
        },
        (error) => {
          console.error('Error detecting location:', error);
          alert('Unable to detect location. Please select manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
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
          {/* Detect Location Button */}
          <div className="px-6 py-4 border-b border-[#8B6F47]">
            <button
              onClick={handleDetectLocation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#3D2817] hover:bg-[#4D3827] border border-[#8B6F47] rounded-lg transition-colors"
            >
              <Navigation className="size-5 text-[#D4AF37]" />
              <span className="font-medium text-[#F5E6D3]">Detect My Location</span>
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-4 border-b border-[#8B6F47]">
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

          {/* Popular Locations */}
          <div className="px-6 py-4">
            <h4 className="text-sm font-semibold text-[#A08968] mb-3 uppercase tracking-wide">
              Popular Locations in Kolkata
            </h4>
            <div className="space-y-2">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((location) => (
                  <button
                    key={location}
                    onClick={() => handleSelectLocation(location)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      selectedLocation === location
                        ? 'bg-[#D4AF37] text-[#2C1810]'
                        : 'bg-[#3D2817] hover:bg-[#4D3827] text-[#F5E6D3]'
                    }`}
                  >
                    <MapPin className={`size-4 ${
                      selectedLocation === location ? 'text-[#2C1810]' : 'text-[#D4AF37]'
                    }`} />
                    <span className="font-medium">{location}</span>
                    {selectedLocation === location && (
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
