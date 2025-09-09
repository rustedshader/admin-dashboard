"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

interface Place {
  id: number;
  name: string;
  description: string;
  place_type: string;
  city: string;
  state: string;
  country: string;
  address: string;
  latitude: number;
  longitude: number;
  duration_hours: number;
  entry_fee: number;
  best_season: string;
  wheelchair_accessible: boolean;
  safety_rating: number;
  contact_number: string;
  email: string;
  website: string;
  opening_time: string;
  closing_time: string;
  is_active: boolean;
  is_featured: boolean;
}

interface PlacesMapProps {
  places: Place[];
  onPlaceClick?: (place: Place) => void;
}

// Client-side map component for displaying all places
const ClientSidePlacesMap = ({ places, onPlaceClick }: PlacesMapProps) => {
  const [isClient, setIsClient] = useState(false);
  const [mapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);

    const loadMapComponents = async () => {
      const { MapContainer, TileLayer, Marker, Popup } = await import(
        "react-leaflet"
      );
      const L = (await import("leaflet")).default;

      // Fix for default markers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      // Custom icons for different place types
      const regularIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          background: #3B82F6; 
          width: 12px; 
          height: 12px; 
          border-radius: 50%; 
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const featuredIcon = L.divIcon({
        className: "custom-marker-featured",
        html: `<div style="
          background: #EF4444; 
          width: 16px; 
          height: 16px; 
          border-radius: 50%; 
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      setMapComponents({
        MapContainer,
        TileLayer,
        Marker,
        Popup,
        regularIcon,
        featuredIcon,
      });
    };

    loadMapComponents();
  }, []);

  if (!isClient || !mapComponents) {
    return (
      <div className="w-full h-[60vh] rounded-lg border border-gray-300 flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 flex items-center gap-2">
          <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full"></div>
          Loading places map...
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, regularIcon, featuredIcon } =
    mapComponents;

  // Calculate map center based on places
  const getMapCenter = () => {
    if (places.length === 0) return [26.2041, 92.9376]; // Default to Northeast India

    const avgLat =
      places.reduce((sum, place) => sum + place.latitude, 0) / places.length;
    const avgLng =
      places.reduce((sum, place) => sum + place.longitude, 0) / places.length;
    return [avgLat, avgLng];
  };

  return (
    <div className="w-full h-[60vh] rounded-lg border border-gray-300 overflow-hidden">
      <MapContainer
        center={getMapCenter() as [number, number]}
        zoom={places.length > 0 ? 8 : 7}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render markers for all places */}
        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={place.is_featured ? featuredIcon : regularIcon}
            eventHandlers={{
              click: () => onPlaceClick?.(place),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-sm text-gray-800">
                  {place.name}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {place.city}, {place.state}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {place.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {place.place_type}
                  </span>
                  {place.is_featured && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

// Export with dynamic loading
export const PlacesMap = dynamic(() => Promise.resolve(ClientSidePlacesMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[60vh] rounded-lg border border-gray-300 flex items-center justify-center bg-gray-50">
      <div className="text-gray-500 flex items-center gap-2">
        <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full"></div>
        Loading places map...
      </div>
    </div>
  ),
});
