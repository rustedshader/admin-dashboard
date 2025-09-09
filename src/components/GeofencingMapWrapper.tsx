"use client";

import { useState, useEffect } from "react";

interface Coordinate {
  lat: number;
  lng: number;
}

interface RestrictedArea {
  id: string;
  name: string;
  description: string;
  area_type_id: string;
  area_type_name?: string;
  coordinates: Coordinate[];
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface AreaType {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface GeofencingMapWrapperProps {
  mode: "view" | "create";
  onPolygonCreated?: (coordinates: Coordinate[]) => void;
  existingAreas?: RestrictedArea[];
  areaTypes?: AreaType[];
  center?: [number, number];
  zoom?: number;
}

export default function GeofencingMapWrapper(props: GeofencingMapWrapperProps) {
  const [GeofencingMap, setGeofencingMap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMap = async () => {
      try {
        const mapModule = await import("./GeofencingMap");
        setGeofencingMap(() => mapModule.default);
      } catch (error) {
        console.error("Failed to load GeofencingMap:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMap();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  if (!GeofencingMap) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-red-100 rounded-lg">
        <div className="text-red-500">Failed to load map</div>
      </div>
    );
  }

  return <GeofencingMap {...props} />;
}
