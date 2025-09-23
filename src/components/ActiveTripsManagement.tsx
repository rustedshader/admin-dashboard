"use client";

import { useState, useEffect } from "react";
import { useAuthenticatedFetch } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Eye } from "lucide-react";
import { toast } from "sonner";

interface Trip {
  id: number;
  user_id: number;
  itinerary_id: number;
  status: string;
  tourist_id?: string;
  blockchain_transaction_hash?: string;
  created_at: string;
  updated_at: string;
}

interface TripLocation {
  user_id: number;
  trip_id: number;
  latest_location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  } | null;
  trip_status: string;
  tourist_id?: string;
}

export function ActiveTripsManagement() {
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [tripLocations, setTripLocations] = useState<
    Record<number, TripLocation>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { authenticatedFetch } = useAuthenticatedFetch();

  useEffect(() => {
    loadActiveTrips();
  }, []);

  const loadActiveTrips = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch active trips and their locations
      const [tripsResponse, locationsResponse] = await Promise.allSettled([
        authenticatedFetch("/api/admin/active-trips"),
        authenticatedFetch("/api/admin/trip-locations"),
      ]);

      let tripsLoaded = false;
      let locationsLoaded = false;
      let loadedTrips: Trip[] = [];

      if (tripsResponse.status === "fulfilled" && tripsResponse.value.ok) {
        const tripsData = await tripsResponse.value.json();
        console.log("Raw trips response:", tripsData);

        // Handle the response structure: { active_trips: [...], count: number }
        const trips = tripsData.active_trips || tripsData;
        loadedTrips = Array.isArray(trips) ? trips : [];
        setActiveTrips(loadedTrips);
        tripsLoaded = true;
        console.log("Active trips loaded:", loadedTrips);
      } else {
        console.error("Failed to fetch active trips:", tripsResponse);
        if (tripsResponse.status === "fulfilled") {
          console.error("Response status:", tripsResponse.value.status);
          const errorText = await tripsResponse.value.text();
          console.error("Response body:", errorText);
        }
      }

      if (
        locationsResponse.status === "fulfilled" &&
        locationsResponse.value.ok
      ) {
        const locationsData = await locationsResponse.value.json();
        console.log("Raw locations response:", locationsData);

        // Handle the response structure: { trip_locations: [...], count: number }
        const locations = locationsData.trip_locations || locationsData;
        if (Array.isArray(locations)) {
          const locationsMap = locations.reduce((acc, location) => {
            acc[location.trip_id] = location;
            return acc;
          }, {} as Record<number, TripLocation>);
          setTripLocations(locationsMap);
          locationsLoaded = true;
          console.log("Trip locations loaded:", locationsMap);
        }
      } else {
        console.error("Failed to fetch trip locations:", locationsResponse);
        if (locationsResponse.status === "fulfilled") {
          console.error("Response status:", locationsResponse.value.status);
          const errorText = await locationsResponse.value.text();
          console.error("Response body:", errorText);
        }
      }

      // Show success message if at least trips were loaded
      if (tripsLoaded) {
        toast.success(
          `Loaded ${loadedTrips.length} active trip${
            loadedTrips.length !== 1 ? "s" : ""
          }${locationsLoaded ? " with location data" : ""}`
        );
      }
    } catch (err) {
      console.error("Error loading active trips:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load active trips"
      );
      toast.error("Failed to load active trips");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-muted-foreground">
              Loading active trips...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Active Trips Management</span>
            </div>
            <Button
              onClick={() => loadActiveTrips(true)}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {activeTrips.length > 0 && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {activeTrips.length}
                </div>
                <div className="text-sm text-blue-600">Total Active Trips</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {
                    Object.values(tripLocations).filter(
                      (loc) => loc.latest_location
                    ).length
                  }
                </div>
                <div className="text-sm text-green-600">With Location Data</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">
                  {
                    Object.values(tripLocations).filter(
                      (loc) => !loc.latest_location
                    ).length
                  }
                </div>
                <div className="text-sm text-amber-600">No Location Data</div>
              </div>
            </div>
          )}

          {activeTrips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active trips found</p>
              <p className="text-sm mt-2">
                Active trips will appear here when tourists start their journeys
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTrips.map((trip) => {
                const location = tripLocations[trip.id];
                return (
                  <Card
                    key={trip.id}
                    className={`relative ${
                      location?.latest_location
                        ? "border-green-200 bg-green-50/30"
                        : location
                        ? "border-amber-200 bg-amber-50/30"
                        : "border-gray-200"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium">
                            Trip #{trip.id}
                          </div>
                          {location?.latest_location && (
                            <div
                              className="w-2 h-2 bg-green-500 rounded-full"
                              title="Location data available"
                            />
                          )}
                          {location && !location.latest_location && (
                            <div
                              className="w-2 h-2 bg-amber-500 rounded-full"
                              title="No location data"
                            />
                          )}
                        </div>
                        <Badge className={getStatusColor(trip.status)}>
                          {trip.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            User ID:
                          </span>
                          <span>{trip.user_id}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Itinerary:
                          </span>
                          <span>{trip.itinerary_id}</span>
                        </div>
                        {trip.tourist_id && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Tourist ID:
                            </span>
                            <span className="font-mono text-xs">
                              {trip.tourist_id.slice(0, 8)}...
                            </span>
                          </div>
                        )}
                        {trip.blockchain_transaction_hash && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Blockchain:
                            </span>
                            <span className="font-mono text-xs">
                              {trip.blockchain_transaction_hash.slice(0, 8)}...
                            </span>
                          </div>
                        )}
                      </div>

                      {location?.latest_location && (
                        <div className="border-t pt-3">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                            <MapPin className="w-4 h-4" />
                            <span>Latest Location</span>
                          </div>
                          <div className="text-xs space-y-1">
                            <div>
                              Lat:{" "}
                              {location.latest_location.latitude.toFixed(6)}
                            </div>
                            <div>
                              Lng:{" "}
                              {location.latest_location.longitude.toFixed(6)}
                            </div>
                            {location.latest_location.timestamp && (
                              <div className="text-muted-foreground">
                                Updated:{" "}
                                {formatDate(location.latest_location.timestamp)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {location && !location.latest_location && (
                        <div className="border-t pt-3">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                            <MapPin className="w-4 h-4" />
                            <span>No Location Data</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Tourist hasn't shared location data yet
                          </div>
                        </div>
                      )}

                      {!location && (
                        <div className="border-t pt-3">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                            <MapPin className="w-4 h-4" />
                            <span>Location Service Unavailable</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            No location tracking data for this trip
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-3">
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Created: {formatDate(trip.created_at)}</div>
                          <div>Updated: {formatDate(trip.updated_at)}</div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
