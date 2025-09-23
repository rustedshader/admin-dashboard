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
  current_location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  last_updated?: string;
  trip_status: string;
}

export function ActiveTripsManagement() {
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [tripLocations, setTripLocations] = useState<
    Record<number, TripLocation>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { authenticatedFetch } = useAuthenticatedFetch();

  useEffect(() => {
    loadActiveTrips();
  }, []);

  const loadActiveTrips = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active trips and their locations
      const [tripsResponse, locationsResponse] = await Promise.allSettled([
        authenticatedFetch("/api/admin/active-trips"),
        authenticatedFetch("/api/admin/trip-locations"),
      ]);

      if (tripsResponse.status === "fulfilled" && tripsResponse.value.ok) {
        const tripsData = await tripsResponse.value.json();
        setActiveTrips(Array.isArray(tripsData) ? tripsData : []);
      } else {
        console.error("Failed to fetch active trips");
      }

      if (
        locationsResponse.status === "fulfilled" &&
        locationsResponse.value.ok
      ) {
        const locationsData = await locationsResponse.value.json();
        if (Array.isArray(locationsData)) {
          const locationsMap = locationsData.reduce((acc, location) => {
            acc[location.trip_id] = location;
            return acc;
          }, {} as Record<number, TripLocation>);
          setTripLocations(locationsMap);
        }
      } else {
        console.error("Failed to fetch trip locations");
      }
    } catch (err) {
      console.error("Error loading active trips:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load active trips"
      );
      toast.error("Failed to load active trips");
    } finally {
      setLoading(false);
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
            <Button onClick={loadActiveTrips} variant="outline" size="sm">
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {activeTrips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active trips found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTrips.map((trip) => {
                const location = tripLocations[trip.id];
                return (
                  <Card key={trip.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          Trip #{trip.id}
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
                      </div>

                      {location?.current_location && (
                        <div className="border-t pt-3">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                            <MapPin className="w-4 h-4" />
                            <span>Current Location</span>
                          </div>
                          <div className="text-xs space-y-1">
                            <div>
                              Lat:{" "}
                              {location.current_location.latitude.toFixed(6)}
                            </div>
                            <div>
                              Lng:{" "}
                              {location.current_location.longitude.toFixed(6)}
                            </div>
                            {location.last_updated && (
                              <div className="text-muted-foreground">
                                Updated: {formatDate(location.last_updated)}
                              </div>
                            )}
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
