"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCw,
  MapPin,
  Navigation,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { useAuthenticatedFetch } from "@/hooks/useAuth";

interface ActiveTourist {
  trip_id: number;
  user_id: number;
  user_name: string;
  user_phone?: string;
  trip_type: string;
  status: string;
  current_phase?: string;
  is_tracking_active: boolean;
  tracking_started_at?: string;
  hotel_info?: any;
  destination_info?: any;
  linked_device_id?: string;
  last_location?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
}

interface TouristTrackingProps {
  onTouristSelect?: (tourist: ActiveTourist) => void;
  selectedTouristId?: number;
}

const TouristTracking: React.FC<TouristTrackingProps> = ({
  onTouristSelect,
  selectedTouristId,
}) => {
  const { authenticatedFetch, isAuthenticated } = useAuthenticatedFetch();
  const [tourists, setTourists] = useState<ActiveTourist[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchActiveTourists = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await authenticatedFetch(
        "/api/tracking/admin/active-tourists"
      );

      if (response.ok) {
        const data = await response.json();
        setTourists(data.tourists || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching active tourists:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTourists();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchActiveTourists, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      safe: { color: "bg-green-100 text-green-800", label: "Safe" },
      visiting: { color: "bg-blue-100 text-blue-800", label: "Visiting" },
      returning: { color: "bg-yellow-100 text-yellow-800", label: "Returning" },
      started: { color: "bg-purple-100 text-purple-800", label: "Started" },
      completed: { color: "bg-gray-100 text-gray-800", label: "Completed" },
      emergency: { color: "bg-red-100 text-red-800", label: "Emergency" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.safe;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatLastSeen = (timestamp?: number) => {
    if (!timestamp) return "No data";

    const lastSeen = new Date(timestamp * 1000);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - lastSeen.getTime()) / (1000 * 60)
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleTouristClick = (tourist: ActiveTourist) => {
    if (onTouristSelect) {
      onTouristSelect(tourist);
    }
  };

  const viewTouristDetails = async (tripId: number) => {
    try {
      const response = await authenticatedFetch(
        `/api/tracking/admin/trip/${tripId}/live-location`
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Tourist details:", data);
        // You can implement a modal or navigate to a detail page here
      }
    } catch (error) {
      console.error("Error fetching tourist details:", error);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Active Tourists ({tourists.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {lastUpdated.toLocaleTimeString()}
            </span>
            <Button
              onClick={fetchActiveTourists}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] px-6">
          <div className="space-y-3">
            {tourists.map((tourist) => (
              <div
                key={tourist.trip_id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedTouristId === tourist.trip_id
                    ? "bg-primary/10 border-primary"
                    : "bg-card hover:bg-accent/50"
                }`}
                onClick={() => handleTouristClick(tourist)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{tourist.user_name}</h4>
                  {getStatusBadge(tourist.status)}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Trip ID:</span>
                    <span>{tourist.trip_id}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="capitalize">{tourist.trip_type}</span>
                  </div>

                  {tourist.current_phase && (
                    <div className="flex justify-between">
                      <span>Phase:</span>
                      <span className="capitalize">
                        {tourist.current_phase}
                      </span>
                    </div>
                  )}

                  {tourist.linked_device_id && (
                    <div className="flex justify-between">
                      <span>Device:</span>
                      <span>{tourist.linked_device_id}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          tourist.is_tracking_active
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      />
                      <span className="text-xs">
                        {tourist.is_tracking_active ? "Live" : "Offline"}
                      </span>
                    </div>

                    <span className="text-xs">
                      {formatLastSeen(tourist.last_location?.timestamp)}
                    </span>
                  </div>

                  {tourist.last_location && (
                    <div className="flex items-center gap-1 pt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs">
                        {tourist.last_location.latitude.toFixed(4)},
                        {tourist.last_location.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      viewTouristDetails(tourist.trip_id);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Details
                  </Button>

                  {!tourist.is_tracking_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-600"
                    >
                      <AlertTriangle className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {tourists.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <Navigation className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No active tourists found</p>
                <p className="text-xs">
                  Tourists will appear here when they start tracking
                </p>
              </div>
            )}

            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                <p>Loading active tourists...</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TouristTracking;
