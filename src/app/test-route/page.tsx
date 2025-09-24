"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Route,
  MapPin,
  Navigation,
  Clock,
  Ruler,
  Car,
  Bike,
  PersonStanding,
  RefreshCw,
  Trash2,
  Target,
} from "lucide-react";
import { useAuthenticatedFetch } from "@/hooks/useAuth";
import { LatLngTuple } from "leaflet";

// Dynamically import the RouteMap component to avoid SSR issues
const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-lg border bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

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

const TestRoutePage = () => {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [startPoint, setStartPoint] = useState<RoutePoint | null>(null);
  const [endPoint, setEndPoint] = useState<RoutePoint | null>(null);
  const [profile, setProfile] = useState<"car" | "bike" | "foot">("car");
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);

  // Manual coordinate input states
  const [startLat, setStartLat] = useState("26.183153");
  const [startLon, setStartLon] = useState("91.671219");
  const [endLat, setEndLat] = useState("26.155248");
  const [endLon, setEndLon] = useState("91.665126");

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!startPoint) {
        const point = { lat, lon: lng, name: "Start Point" };
        setStartPoint(point);
        setStartLat(lat.toFixed(6));
        setStartLon(lng.toFixed(6));
      } else if (!endPoint) {
        const point = { lat, lon: lng, name: "End Point" };
        setEndPoint(point);
        setEndLat(lat.toFixed(6));
        setEndLon(lng.toFixed(6));
      }
    },
    [startPoint, endPoint]
  );

  const calculateRoute = async () => {
    if (!startPoint || !endPoint) {
      alert("Please select both start and end points");
      return;
    }

    setLoading(true);
    try {
      const requestBody = {
        start_lat: startPoint.lat,
        start_lon: startPoint.lon,
        end_lat: endPoint.lat,
        end_lon: endPoint.lon,
        profile: profile,
      };

      const response = await authenticatedFetch("/api/routing-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const routeData = await response.json();
        console.log("Route data received:", routeData);
        // Extract the geojson object which contains the expected structure
        setRouteResult(routeData.geojson || routeData);
      } else {
        const errorData = await response.json();
        console.error("Route calculation failed:", errorData);
        alert(
          "Failed to calculate route: " + (errorData.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error calculating route:", error);
      alert("Error calculating route");
    } finally {
      setLoading(false);
    }
  };

  const clearRoute = () => {
    setStartPoint(null);
    setEndPoint(null);
    setRouteResult(null);
    setStartLat("");
    setStartLon("");
    setEndLat("");
    setEndLon("");
  };

  const setManualCoordinates = () => {
    const startLat_num = parseFloat(startLat);
    const startLon_num = parseFloat(startLon);
    const endLat_num = parseFloat(endLat);
    const endLon_num = parseFloat(endLon);

    if (
      isNaN(startLat_num) ||
      isNaN(startLon_num) ||
      isNaN(endLat_num) ||
      isNaN(endLon_num)
    ) {
      alert("Please enter valid coordinates");
      return;
    }

    setStartPoint({
      lat: startLat_num,
      lon: startLon_num,
      name: "Start Point",
    });
    setEndPoint({ lat: endLat_num, lon: endLon_num, name: "End Point" });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getProfileIcon = (profileType: string) => {
    switch (profileType) {
      case "car":
        return <Car className="w-4 h-4" />;
      case "bike":
        return <Bike className="w-4 h-4" />;
      case "foot":
        return <PersonStanding className="w-4 h-4" />;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="bg-primary p-2 h-35 flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-white font-bold flex items-center gap-2">
              <Route className="w-8 h-8" />
              Test Route Calculator
            </h1>
            <p className="text-primary-foreground">
              Select two points and calculate route with geofencing
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Point Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Click on the map to select start and end points, or enter
                  coordinates manually.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">
                      Start:{" "}
                      {startPoint
                        ? `${startPoint.lat.toFixed(
                            4
                          )}, ${startPoint.lon.toFixed(4)}`
                        : "Not selected"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">
                      End:{" "}
                      {endPoint
                        ? `${endPoint.lat.toFixed(4)}, ${endPoint.lon.toFixed(
                            4
                          )}`
                        : "Not selected"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium">
                    Manual Coordinates
                  </Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Label htmlFor="startLat" className="text-xs">
                        Start Lat
                      </Label>
                      <Input
                        id="startLat"
                        type="number"
                        step="0.000001"
                        value={startLat}
                        onChange={(e) => setStartLat(e.target.value)}
                        placeholder="26.183153"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="startLon" className="text-xs">
                        Start Lon
                      </Label>
                      <Input
                        id="startLon"
                        type="number"
                        step="0.000001"
                        value={startLon}
                        onChange={(e) => setStartLon(e.target.value)}
                        placeholder="91.671219"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endLat" className="text-xs">
                        End Lat
                      </Label>
                      <Input
                        id="endLat"
                        type="number"
                        step="0.000001"
                        value={endLat}
                        onChange={(e) => setEndLat(e.target.value)}
                        placeholder="26.155248"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endLon" className="text-xs">
                        End Lon
                      </Label>
                      <Input
                        id="endLon"
                        type="number"
                        step="0.000001"
                        value={endLon}
                        onChange={(e) => setEndLon(e.target.value)}
                        placeholder="91.665126"
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={setManualCoordinates}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                  >
                    Set Coordinates
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Route Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Transport Profile</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(["car", "bike", "foot"] as const).map((p) => (
                      <Button
                        key={p}
                        variant={profile === p ? "default" : "outline"}
                        size="sm"
                        onClick={() => setProfile(p)}
                        className="flex items-center gap-1"
                      >
                        {getProfileIcon(p)}
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={calculateRoute}
                    disabled={!startPoint || !endPoint || loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Route className="w-4 h-4 mr-2" />
                        Calculate Route
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={clearRoute}
                    variant="outline"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Route Results */}
            {routeResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Route Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Distance</span>
                    </div>
                    <span className="font-semibold">
                      {routeResult.properties?.distance_km?.toFixed(2) || "N/A"}{" "}
                      km
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Duration</span>
                    </div>
                    <span className="font-semibold">
                      {routeResult.properties?.time_seconds
                        ? formatTime(routeResult.properties.time_seconds)
                        : "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getProfileIcon(routeResult.properties?.profile)}
                      <span className="text-sm">Profile</span>
                    </div>
                    <span className="font-semibold capitalize">
                      {routeResult.properties?.profile || "N/A"}
                    </span>
                  </div>

                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    <p>
                      Coordinates:{" "}
                      {routeResult.geometry?.coordinates?.length || 0} points
                    </p>
                    <p>
                      Exact distance:{" "}
                      {routeResult.properties?.distance_meters?.toFixed(1) ||
                        "N/A"}
                      m
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Map</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click to select start point (green), then end point (red)
                </p>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[600px] rounded-lg border overflow-hidden">
                  <RouteMap
                    startPoint={startPoint}
                    endPoint={endPoint}
                    routeResult={routeResult}
                    onMapClick={handleMapClick}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRoutePage;
