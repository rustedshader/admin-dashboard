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

  // Helper function to convert UTC timestamp to IST
  const formatToIST = (timestamp: string) => {
    // Ensure timestamp is treated as UTC by appending 'Z' if not present
    const utcTimestamp = timestamp.endsWith("Z") ? timestamp : timestamp + "Z";
    const date = new Date(utcTimestamp);

    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    setIsClient(true);

    // Load react-leaflet components dynamically
    const loadMapComponents = async () => {
      const { MapContainer, TileLayer, Marker, Popup, Tooltip } = await import(
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

      // Create custom icons for different trip statuses with timestamp label
      const createCustomIcon = (
        color: string,
        userName: string,
        timestamp: string
      ) => {
        const istTime = formatToIST(timestamp);
        return L.divIcon({
          className: `custom-marker-with-label`,
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; white-space: nowrap;">
              <div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>
              <div style="background-color: rgba(255, 255, 255, 0.95); padding: 4px 8px; border-radius: 4px; margin-top: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); font-size: 11px; font-weight: 600; color: #1f2937; border: 1px solid ${color};">
                ${userName}<br/>
                <span style="color: #6b7280; font-size: 10px;">${istTime} IST</span>
              </div>
            </div>
          `,
          iconSize: [100, 80],
          iconAnchor: [50, 24],
          popupAnchor: [0, -24],
        });
      };

      setMapComponents({
        MapContainer,
        TileLayer,
        Marker,
        Popup,
        Tooltip,
        L,
        createCustomIcon,
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

  const { MapContainer, TileLayer, Marker, Popup, Tooltip, createCustomIcon } =
    mapComponents;

  // Helper function to get color based on trip status
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "ongoing":
      case "started":
        return "#10b981"; // green
      case "emergency":
        return "#ef4444"; // red
      case "completed":
        return "#6b7280"; // gray
      default:
        return "#3b82f6"; // blue
    }
  };

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

        {tripLocations.map((location, index) => {
          const userName = location.user_name || `Tourist ${location.user_id}`;
          const statusColor = getStatusColor(location.trip_status);
          const customIcon = createCustomIcon(
            statusColor,
            userName,
            location.timestamp
          );

          return (
            <Marker
              key={`${location.trip_id}-${index}`}
              position={[location.latitude, location.longitude]}
              icon={customIcon}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold text-sm mb-2">{userName}</h4>
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
                      <strong>Updated (IST):</strong>{" "}
                      {(() => {
                        const utcTimestamp = location.timestamp.endsWith("Z")
                          ? location.timestamp
                          : location.timestamp + "Z";
                        return new Date(utcTimestamp).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          dateStyle: "short",
                          timeStyle: "medium",
                        });
                      })()}
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
          );
        })}
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
