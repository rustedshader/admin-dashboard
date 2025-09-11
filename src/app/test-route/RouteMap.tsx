"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";

interface RoutePoint {
  lat: number;
  lon: number;
  name: string;
}

interface RouteResponse {
  type: "Feature";
  properties: {
    distance_meters: number;
    distance_km: number;
    time_seconds: number;
    time_minutes: number;
    profile: string;
  };
  geometry: {
    type: "LineString";
    coordinates: number[][];
  };
}

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

const MapClickHandler = ({ onMapClick }: MapClickHandlerProps) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

interface RouteMapProps {
  startPoint: RoutePoint | null;
  endPoint: RoutePoint | null;
  routeResult: RouteResponse | null;
  onMapClick: (lat: number, lng: number) => void;
}

const RouteMap = ({
  startPoint,
  endPoint,
  routeResult,
  onMapClick,
}: RouteMapProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [startIcon, setStartIcon] = useState<any>(null);
  const [endIcon, setEndIcon] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);

    // Fix for default markers in Leaflet and create custom icons
    const setupLeafletIcons = async () => {
      const L = (await import("leaflet")).default;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      // Create custom icons for start and end points
      const startMarkerIcon = L.divIcon({
        className: "custom-marker start-marker",
        html: '<div style="background: #10b981; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">S</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const endMarkerIcon = L.divIcon({
        className: "custom-marker end-marker",
        html: '<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">E</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      setStartIcon(startMarkerIcon);
      setEndIcon(endMarkerIcon);
    };

    setupLeafletIcons();
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[600px] rounded-lg border bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[26.183153, 91.671219] as LatLngTuple}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        tileSize={256}
        zoomOffset={0}
      />

      <MapClickHandler onMapClick={onMapClick} />

      {startPoint && startIcon && (
        <Marker
          position={[startPoint.lat, startPoint.lon] as LatLngTuple}
          icon={startIcon}
        />
      )}

      {endPoint && endIcon && (
        <Marker
          position={[endPoint.lat, endPoint.lon] as LatLngTuple}
          icon={endIcon}
        />
      )}

      {routeResult && (
        <Polyline
          positions={routeResult.geometry.coordinates.map(
            (coord) => [coord[1], coord[0]] as LatLngTuple
          )}
          color="#3b82f6"
          weight={4}
          opacity={0.8}
        />
      )}
    </MapContainer>
  );
};

export default RouteMap;
