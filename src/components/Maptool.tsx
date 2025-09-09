"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertTriangle, Users } from "lucide-react";
import { toast } from "sonner";
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface TouristLocation {
  id: string;
  name: string;
  coordinates: [number, number];
  riskPercentage: number;
  addedBy: string;
  timestamp: Date;
  description?: string;
}

const MapTool = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const drawnItems = useRef<L.FeatureGroup | null>(null);
  const [locationName, setLocationName] = useState("");
  const [riskPercentage, setRiskPercentage] = useState("");
  const [description, setDescription] = useState("");
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [touristLocations, setTouristLocations] = useState<TouristLocation[]>([
    {
      id: "1",
      name: "Red Fort Area",
      coordinates: [28.6562, 77.241],
      riskPercentage: 25,
      addedBy: "Tourist_123",
      timestamp: new Date("2024-01-15"),
      description: "Crowded area, watch for pickpockets",
    },
    {
      id: "2",
      name: "Goa Beach Party Zone",
      coordinates: [15.2993, 74.124],
      riskPercentage: 15,
      addedBy: "Traveler_456",
      timestamp: new Date("2024-01-14"),
      description: "Safe but avoid late night parties",
    },
    {
      id: "3",
      name: "Manali Hill Station",
      coordinates: [32.2396, 77.1887],
      riskPercentage: 40,
      addedBy: "Explorer_789",
      timestamp: new Date("2024-01-13"),
      description: "Weather conditions can be dangerous",
    },
  ]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = L.map(mapContainer.current).setView([20.5937, 78.9629], 5);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map.current);

    // Initialize the FeatureGroup to store editable layers
    drawnItems.current = new L.FeatureGroup();
    map.current.addLayer(drawnItems.current);

    // Initialize the draw control and pass it the FeatureGroup of editable layers
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems.current,
        remove: true,
      },
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: "#e1e100",
            message: "<strong>Error:</strong> shape edges cannot cross!",
          },
          shapeOptions: {
            color: "#2A777C",
            weight: 3,
          },
        },
        polyline: {
          shapeOptions: {
            color: "#2A777C",
            weight: 4,
          },
        },
        rectangle: {
          shapeOptions: {
            color: "#2A777C",
            weight: 3,
          },
        },
        circle: {
          shapeOptions: {
            color: "#2A777C",
            weight: 3,
          },
        },
        marker: {},
        circlemarker: false,
      },
    });
    map.current.addControl(drawControl);
    console.log(isAddingLocation);
    // Handle draw events
    map.current.on(L.Draw.Event.CREATED, (event: L.LeafletEvent) => {
      const drawEvent = event as L.LeafletEvent & {
        layer: L.Layer;
        layerType: string;
      };
      const layer = drawEvent.layer;
      drawnItems.current?.addLayer(layer);

      if (drawEvent.layerType === "marker") {
        setIsAddingLocation(true);
      }

      toast.success("Shape Added", {
        description: `${drawEvent.layerType} has been added to the map.`,
      });
    });

    // Add existing tourist locations
    touristLocations.forEach((location) => {
      const riskColor =
        location.riskPercentage > 30
          ? "#ef4444"
          : location.riskPercentage > 15
          ? "#f59e0b"
          : "#10b981";

      const customIcon = L.divIcon({
        className: "custom-tourist-marker",
        html: `<div style="
          background: ${riskColor}; 
          width: 24px; 
          height: 24px; 
          border-radius: 50%; 
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
        ">${location.riskPercentage}%</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker(location.coordinates, { icon: customIcon })
        .bindPopup(
          `
          <div style="text-align: center; padding: 8px; min-width: 200px;">
            <h3 style="color: #2A777C; margin: 0 0 8px 0; font-size: 14px;">${
              location.name
            }</h3>
            <div style="margin-bottom: 8px;">
              <span style="background: ${riskColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
                ${location.riskPercentage}% Risk
              </span>
            </div>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">${
              location.description
            }</p>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 11px; color: #888;">
              Added by: ${location.addedBy}<br/>
              Date: ${location.timestamp.toLocaleDateString()}
            </div>
          </div>
        `
        )
        .addTo(map.current!);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [touristLocations]);

  const handleAddLocation = () => {
    if (!locationName.trim() || !riskPercentage || !map.current) {
      toast.error("Missing Information", {
        description: "Please fill in location name and risk percentage.",
      });
      return;
    }

    const center = map.current.getCenter();
    const newLocation: TouristLocation = {
      id: Date.now().toString(),
      name: locationName,
      coordinates: [center.lat, center.lng],
      riskPercentage: parseInt(riskPercentage),
      addedBy: "Current_User",
      timestamp: new Date(),
      description: description || undefined,
    };

    setTouristLocations((prev) => [...prev, newLocation]);

    // Reset form
    setLocationName("");
    setRiskPercentage("");
    setDescription("");
    setIsAddingLocation(false);

    toast.success("Location Added", {
      description: `${newLocation.name} has been added with ${newLocation.riskPercentage}% risk rating.`,
    });
  };

  const clearDrawings = () => {
    if (drawnItems.current) {
      drawnItems.current.clearLayers();
      toast.success("Drawings Cleared", {
        description: "All drawings have been removed from the map.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-100px)]">
          {/* Left Sidebar - Controls */}
          <div className="col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Map Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location-name">Location Name</Label>
                  <Input
                    id="location-name"
                    placeholder="Enter location name"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="risk-percentage">
                    Risk Percentage (0-100)
                  </Label>
                  <Input
                    id="risk-percentage"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={riskPercentage}
                    onChange={(e) => setRiskPercentage(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Add details about this location"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Button onClick={handleAddLocation} className="w-full">
                    Add Location
                  </Button>
                  <Button
                    onClick={clearDrawings}
                    variant="outline"
                    className="w-full"
                  >
                    Clear Drawings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tourist Locations List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Tourist Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                {touristLocations
                  .sort((a, b) => b.riskPercentage - a.riskPercentage)
                  .map((location) => (
                    <div
                      key={location.id}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{location.name}</h4>
                        <Badge
                          variant={
                            location.riskPercentage > 30
                              ? "destructive"
                              : location.riskPercentage > 15
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {location.riskPercentage}% Risk
                        </Badge>
                      </div>
                      {location.description && (
                        <p className="text-xs text-muted-foreground">
                          {location.description}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground">
                        By: {location.addedBy} •{" "}
                        {location.timestamp.toLocaleDateString()}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          {/* Center - Interactive Map */}
          <div className="col-span-9">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Interactive Map Tool
                  <Badge variant="outline" className="ml-2">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Drawing Enabled
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 h-[calc(100%-80px)]">
                <div
                  ref={mapContainer}
                  className="h-full rounded-lg border border-border"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapTool;
