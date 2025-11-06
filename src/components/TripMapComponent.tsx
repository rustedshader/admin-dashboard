"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

interface TripLocation {
  trip_id: number;
  user_id: number;
  user_name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  trip_status?: string;
  accuracy?: number;
}

interface TripMapComponentProps {
  tripLocations?: TripLocation[];
  height?: string;
}

// Client-side map component using react-leaflet
const ClientSideTripMap = ({
  tripLocations = [],
  height = "400px",
}: TripMapComponentProps) => {
  const [isClient, setIsClient] = useState(false);
  const [mapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);

    // Load react-leaflet components dynamically
    const loadMapComponents = async () => {
      const { MapContainer, TileLayer, Marker, Popup } = await import(
        "react-leaflet"
      );
      const L = (await import("leaflet")).default;

      // Fix for default markers in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      // Create custom icons for different trip statuses
      const createCustomIcon = (color: string) => {
        return L.divIcon({
          className: `custom-marker`,
          html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
      };

      const blueIcon = createCustomIcon("#3b82f6");
      const greenIcon = createCustomIcon("#10b981");
      const redIcon = createCustomIcon("#ef4444");

      setMapComponents({
        MapContainer,
        TileLayer,
        Marker,
        Popup,
        L,
        blueIcon,
        greenIcon,
        redIcon,
      });
    };

    loadMapComponents();
  }, []);

  if (!isClient || !mapComponents) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, blueIcon } = mapComponents;

  // Default center (India center coordinates)
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  // Calculate center based on trip locations
  const getMapCenter = (): [number, number] => {
    if (tripLocations.length === 0) return defaultCenter;

    const avgLat =
      tripLocations.reduce((sum, loc) => sum + loc.latitude, 0) /
      tripLocations.length;
    const avgLng =
      tripLocations.reduce((sum, loc) => sum + loc.longitude, 0) /
      tripLocations.length;

    return [avgLat, avgLng];
  };

  const getZoomLevel = () => {
    if (tripLocations.length === 0) return 5;
    if (tripLocations.length === 1) return 12;
    return 8;
  };

  return (
    <div style={{ height, width: "100%" }}>
      <MapContainer
        center={getMapCenter()}
        zoom={getZoomLevel()}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {tripLocations.map((location, index) => (
          <Marker
            key={`${location.trip_id}-${index}`}
            position={[location.latitude, location.longitude]}
            icon={blueIcon}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-semibold text-sm mb-2">
                  {location.user_name || `User ${location.user_id}`}
                </h4>
                <div className="text-xs space-y-1">
                  <p>
                    <strong>Trip ID:</strong> {location.trip_id}
                  </p>
                  {location.trip_status && (
                    <p>
                      <strong>Status:</strong> {location.trip_status}
                    </p>
                  )}
                  <p>
                    <strong>Location:</strong> {location.latitude.toFixed(6)},{" "}
                    {location.longitude.toFixed(6)}
                  </p>
                  <p>
                    <strong>Updated:</strong>{" "}
                    {new Date(location.timestamp).toLocaleString()}
                  </p>
                  {location.accuracy && (
                    <p>
                      <strong>Accuracy:</strong> {location.accuracy}m
                    </p>
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

// Default export with dynamic loading
const TripMapComponent = dynamic(() => Promise.resolve(ClientSideTripMap), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-gray-100 rounded-lg h-96">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

export default TripMapComponent;
