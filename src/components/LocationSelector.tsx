"use client";

import { useState } from "react";
import { MapComponent } from "@/components/MapComponent";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";

interface LocationSelectorProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
}

export function LocationSelector({
  latitude,
  longitude,
  onLocationChange,
  className = "",
}: LocationSelectorProps) {
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(
    latitude !== 0 || longitude !== 0 ? { lat: latitude, lng: longitude } : null
  );

  const handleMapClick = (lat: number, lng: number) => {
    const roundedLat = Math.round(lat * 1000000) / 1000000; // Round to 6 decimal places
    const roundedLng = Math.round(lng * 1000000) / 1000000;

    setSelectedCoordinates({ lat: roundedLat, lng: roundedLng });
    onLocationChange(roundedLat, roundedLng);
  };

  const handleLatitudeChange = (value: string) => {
    const lat = parseFloat(value) || 0;
    const lng = longitude || 0;
    setSelectedCoordinates(lat !== 0 || lng !== 0 ? { lat, lng } : null);
    onLocationChange(lat, lng);
  };

  const handleLongitudeChange = (value: string) => {
    const lng = parseFloat(value) || 0;
    const lat = latitude || 0;
    setSelectedCoordinates(lat !== 0 || lng !== 0 ? { lat, lng } : null);
    onLocationChange(lat, lng);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Section */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center space-x-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="text-md font-semibold">Location</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Click on map or enter coordinates
        </p>
      </div>

      {/* Map Container - Optimized for horizontal layout */}
      <div className="w-full">
        <div className="relative w-full h-[350px] border-2 border-gray-200 rounded-lg overflow-hidden shadow-md bg-gray-50 hover:shadow-lg transition-shadow duration-200">
          <MapComponent
            onCoordinateSelect={handleMapClick}
            selectedCoordinates={selectedCoordinates}
          />
          {/* Overlay instructions */}
          {!selectedCoordinates && (
            <div className="absolute top-3 left-3 right-3 z-[1000] pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 shadow-md border">
                <p className="text-xs text-gray-600 text-center">
                  🎯 Click to select location
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coordinate Inputs - Compact layout */}
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1">
          <Label
            htmlFor="latitude"
            className="flex items-center space-x-1 text-xs font-medium"
          >
            <Navigation className="h-3 w-3 text-blue-500" />
            <span>Latitude *</span>
          </Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            value={latitude || ""}
            onChange={(e) => handleLatitudeChange(e.target.value)}
            placeholder="26.2041"
            className="font-mono text-center text-sm h-8"
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="longitude"
            className="flex items-center space-x-1 text-xs font-medium"
          >
            <Navigation className="h-3 w-3 text-green-500" />
            <span>Longitude *</span>
          </Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            value={longitude || ""}
            onChange={(e) => handleLongitudeChange(e.target.value)}
            placeholder="92.9376"
            className="font-mono text-center text-sm h-8"
          />
        </div>
      </div>

      {/* Status Display - Compact */}
      <div className="text-center">
        {selectedCoordinates ? (
          <div className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-md border border-green-200">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium">
              {selectedCoordinates.lat.toFixed(4)},{" "}
              {selectedCoordinates.lng.toFixed(4)}
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md border border-blue-200">
            <MapPin className="w-3 h-3" />
            <span className="text-xs font-medium">No location selected</span>
          </div>
        )}
      </div>
    </div>
  );
}
