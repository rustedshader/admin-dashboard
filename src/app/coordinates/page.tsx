"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Clock,
  RefreshCw,
  Navigation,
  Settings,
  Satellite,
} from "lucide-react";

interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp?: string;
  device_id?: string;
  accuracy?: number;
  altitude?: number;
  speed?: number;
}

const CoordinatesPage = () => {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [latestCoordinate, setLatestCoordinate] = useState<Coordinate | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState("shubhang");
  const [limit, setLimit] = useState(100);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchCoordinates = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching coordinates at:", new Date().toLocaleTimeString());
      const response = await fetch(
        `/api/test-coordinates?limit=${limit}&device_id=${deviceId}`
      );

      if (response.ok) {
        const data = await response.json();
        setCoordinates(data || []);

        // Set the latest coordinate (assuming the first one is the most recent)
        if (data && data.length > 0) {
          setLatestCoordinate(data[0]);
        }

        setLastUpdated(new Date());
      } else {
        console.error("Failed to fetch coordinates");
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
    } finally {
      setLoading(false);
    }
  }, [deviceId, limit]);

  useEffect(() => {
    fetchCoordinates();
  }, [fetchCoordinates]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoRefresh) {
      interval = setInterval(fetchCoordinates, 1000); // Refresh every 1 second
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchCoordinates]);

  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return "No timestamp";

    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Satellite className="w-8 h-8" />
              Live Coordinates
            </h1>
            <p className="text-muted-foreground">
              Real-time location tracking data
            </p>
          </div>
          <div className="flex items-center gap-4">
            {autoRefresh && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">
                  Auto-refreshing
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
            <Button
              onClick={fetchCoordinates}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="deviceId">Device ID</Label>
                <Input
                  id="deviceId"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="Enter device ID"
                  className="w-48"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit">Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  placeholder="100"
                  className="w-24"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="autoRefresh" className="text-sm font-normal">
                  Auto-refresh (1s)
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Latest Coordinate Display */}
        {latestCoordinate && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Navigation className="w-6 h-6" />
                Latest Position
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MapPin className="w-8 h-8 text-blue-600" />
                    <span className="text-lg font-medium text-blue-800">
                      Latitude
                    </span>
                  </div>
                  <div className="text-6xl font-bold text-blue-900 font-mono">
                    {formatCoordinate(latestCoordinate.latitude)}
                  </div>
                  <div className="text-sm text-blue-600 mt-2">degrees</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MapPin className="w-8 h-8 text-green-600" />
                    <span className="text-lg font-medium text-green-800">
                      Longitude
                    </span>
                  </div>
                  <div className="text-6xl font-bold text-green-900 font-mono">
                    {formatCoordinate(latestCoordinate.longitude)}
                  </div>
                  <div className="text-sm text-green-600 mt-2">degrees</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-blue-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-6 h-6 text-purple-600" />
                  <span className="text-lg font-medium text-purple-800">
                    Timestamp
                  </span>
                </div>
                <div className="text-3xl font-bold text-purple-900 text-center">
                  {formatTimestamp(latestCoordinate.timestamp)}
                </div>

                {/* Additional info if available */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {latestCoordinate.accuracy && (
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">
                        Accuracy
                      </div>
                      <div className="text-lg font-semibold">
                        {latestCoordinate.accuracy}m
                      </div>
                    </div>
                  )}
                  {latestCoordinate.altitude && (
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">
                        Altitude
                      </div>
                      <div className="text-lg font-semibold">
                        {latestCoordinate.altitude}m
                      </div>
                    </div>
                  )}
                  {latestCoordinate.speed && (
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Speed</div>
                      <div className="text-lg font-semibold">
                        {latestCoordinate.speed} m/s
                      </div>
                    </div>
                  )}
                  {latestCoordinate.device_id && (
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">
                        Device
                      </div>
                      <div className="text-lg font-semibold">
                        {latestCoordinate.device_id}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historical Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Historical Coordinates ({coordinates.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
                <p>Loading coordinates...</p>
              </div>
            ) : coordinates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No coordinates found</p>
                <p className="text-sm">Try adjusting the device ID or limit</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {coordinates.map((coord, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      index === 0 ? "bg-blue-50 border-blue-200" : "bg-gray-50"
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Latitude
                        </div>
                        <div className="font-mono text-lg font-semibold">
                          {formatCoordinate(coord.latitude)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Longitude
                        </div>
                        <div className="font-mono text-lg font-semibold">
                          {formatCoordinate(coord.longitude)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Time
                        </div>
                        <div className="text-sm font-medium">
                          {formatTimestamp(coord.timestamp)}
                        </div>
                      </div>
                      <div className="flex gap-4">
                        {coord.accuracy && (
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Accuracy
                            </div>
                            <div className="text-sm">{coord.accuracy}m</div>
                          </div>
                        )}
                        {coord.speed && (
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Speed
                            </div>
                            <div className="text-sm">{coord.speed} m/s</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoordinatesPage;
