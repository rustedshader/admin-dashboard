"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

interface MapComponentProps {
  onCoordinateSelect?: (lat: number, lng: number) => void;
  selectedCoordinates?: { lat: number; lng: number } | null;
}

// Client-side map component using react-leaflet
const ClientSideMap = ({
  onCoordinateSelect,
  selectedCoordinates,
}: MapComponentProps) => {
  const [isClient, setIsClient] = useState(false);
  const [mapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);

    // Load react-leaflet components dynamically
    const loadMapComponents = async () => {
      const { MapContainer, TileLayer, Marker, useMapEvents } = await import(
        "react-leaflet"
      );
      const L = (await import("leaflet")).default;

      // Fix for default markers in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      // Component to handle map clicks
      const LocationMarker = () => {
        useMapEvents({
          click(e) {
            if (onCoordinateSelect) {
              onCoordinateSelect(e.latlng.lat, e.latlng.lng);
            }
          },
        });
        return null;
      };

      setMapComponents({
        MapContainer,
        TileLayer,
        Marker,
        LocationMarker,
      });
    };

    loadMapComponents();
  }, [onCoordinateSelect]);

  if (!isClient || !mapComponents) {
    return (
      <div className="w-full h-full rounded-lg border border-gray-300 flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 flex items-center gap-2">
          <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
          Loading map...
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, LocationMarker } = mapComponents;

  return (
    <div className="w-full h-full rounded-lg border border-gray-300 overflow-hidden">
      <MapContainer
        center={[26.2041, 92.9376]} // Northeast India center
        zoom={7}
        style={{ height: "100%", width: "100%" }}
        maxBounds={[
          [20.0, 85.0], // Southwest
          [30.0, 100.0], // Northeast
        ]}
        maxBoundsViscosity={1.0}
        minZoom={6}
        maxZoom={18}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Click handler component */}
        <LocationMarker />

        {/* Show marker if coordinates are selected */}
        {selectedCoordinates && (
          <Marker
            position={[selectedCoordinates.lat, selectedCoordinates.lng]}
          />
        )}
      </MapContainer>
    </div>
  );
};

// Export with dynamic loading
export const MapComponent = dynamic(() => Promise.resolve(ClientSideMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 rounded-lg border border-gray-300 flex items-center justify-center bg-gray-50">
      <div className="text-gray-500 flex items-center gap-2">
        <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
        Loading map...
      </div>
    </div>
  ),
});

// Default export for backward compatibility
const MapComponentDefault = () => {
  const [isClient, setIsClient] = useState(false);
  const [mapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);

    const loadMapComponents = async () => {
      const { MapContainer, TileLayer, Marker } = await import("react-leaflet");
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

      // Custom marker icon
      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          background: #2A777C; 
          width: 20px; 
          height: 20px; 
          border-radius: 50%; 
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      setMapComponents({
        MapContainer,
        TileLayer,
        Marker,
        customIcon,
      });
    };

    loadMapComponents();
  }, []);

  if (!isClient || !mapComponents) {
    return (
      <div className="h-[650px] relative">
        <div className="absolute inset-0 rounded-lg border border-border flex items-center justify-center bg-gray-50">
          <div className="text-gray-500 flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
            Loading map...
          </div>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, customIcon } = mapComponents;

  // Popular Indian tourist destinations
  const destinations = [
    { name: "New Delhi", coordinates: [28.6139, 77.209] as [number, number] },
    { name: "Mumbai", coordinates: [19.076, 72.8777] as [number, number] },
    { name: "Goa", coordinates: [15.2993, 74.124] as [number, number] },
    { name: "Jaipur", coordinates: [26.9124, 75.7873] as [number, number] },
    {
      name: "Kerala (Kochi)",
      coordinates: [9.9312, 76.2673] as [number, number],
    },
    { name: "Agra", coordinates: [27.1767, 78.0081] as [number, number] },
    { name: "Varanasi", coordinates: [25.3176, 82.9739] as [number, number] },
    { name: "Rishikesh", coordinates: [30.0869, 78.2676] as [number, number] },
    { name: "Manali", coordinates: [32.2396, 77.1887] as [number, number] },
    { name: "Udaipur", coordinates: [24.5854, 73.7125] as [number, number] },
  ];

  return (
    <div className="h-[650px] relative">
      <div className="absolute inset-0 rounded-lg border border-border overflow-hidden">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Add markers for destinations */}
          {destinations.map((destination, index) => (
            <Marker
              key={index}
              position={destination.coordinates}
              icon={customIcon}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapComponentDefault;
