"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw,
  Clock,
  MapPin,
  User,
  Filter,
} from "lucide-react";
import { useAuthenticatedFetch } from "@/hooks/useAuth";

interface AlertData {
  id: number;
  trip_id: number;
  timestamp: number;
  alert_type: "deviation" | "emergency" | "weather" | "other";
  description?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: "new" | "acknowledged" | "resolved";
}

interface AlertStats {
  total_alerts: number;
  new_alerts: number;
  acknowledged_alerts: number;
  resolved_alerts: number;
  emergency_alerts: number;
  deviation_alerts: number;
  weather_alerts: number;
  other_alerts: number;
}

const AlertManagement = () => {
  const { authenticatedFetch, isAuthenticated } = useAuthenticatedFetch();
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [alertStats, setAlertStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAlerts = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);

      // Fetch alerts and statistics in parallel
      const [alertsResponse, statsResponse] = await Promise.allSettled([
        authenticatedFetch(
          `/api/alerts?status=${statusFilter}&alert_type=${typeFilter}&limit=50`
        ),
        authenticatedFetch("/api/alerts/statistics"),
      ]);

      if (alertsResponse.status === "fulfilled" && alertsResponse.value.ok) {
        const alertsData = await alertsResponse.value.json();
        setAlerts(alertsData || []);
      }

      if (statsResponse.status === "fulfilled" && statsResponse.value.ok) {
        const statsData = await statsResponse.value.json();
        setAlertStats(statsData);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, statusFilter, typeFilter]);

  const handleAlertAction = async (
    alertId: number,
    action: "acknowledge" | "resolve"
  ) => {
    try {
      const response = await authenticatedFetch(
        `/api/alerts/${alertId}/${action}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        // Refresh alerts after action
        fetchAlerts();
      }
    } catch (error) {
      console.error(`Error ${action}ing alert:`, error);
    }
  };

  const getAlertTypeBadge = (type: string) => {
    const typeConfig = {
      emergency: {
        color: "bg-red-100 text-red-800",
        label: "Emergency",
        icon: AlertTriangle,
      },
      deviation: {
        color: "bg-orange-100 text-orange-800",
        label: "Deviation",
        icon: MapPin,
      },
      weather: {
        color: "bg-blue-100 text-blue-800",
        label: "Weather",
        icon: Clock,
      },
      other: {
        color: "bg-gray-100 text-gray-800",
        label: "Other",
        icon: AlertTriangle,
      },
    };

    const config =
      typeConfig[type as keyof typeof typeConfig] || typeConfig.other;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { color: "bg-red-100 text-red-800", label: "New" },
      acknowledged: {
        color: "bg-yellow-100 text-yellow-800",
        label: "Acknowledged",
      },
      resolved: { color: "bg-green-100 text-green-800", label: "Resolved" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (statusFilter !== "all" && alert.status !== statusFilter) return false;
    if (typeFilter !== "all" && alert.alert_type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Alert Statistics */}
      {alertStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Alerts
                  </p>
                  <p className="text-2xl font-bold">
                    {alertStats.total_alerts}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    New Alerts
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {alertStats.new_alerts}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Acknowledged
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {alertStats.acknowledged_alerts}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Resolved
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {alertStats.resolved_alerts}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alert List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Active Alerts ({filteredAlerts.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
              <Button
                onClick={fetchAlerts}
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

          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="emergency">Emergency</option>
              <option value="deviation">Deviation</option>
              <option value="weather">Weather</option>
              <option value="other">Other</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[600px] px-6">
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    alert.status === "new"
                      ? "bg-red-50 border-red-200"
                      : alert.status === "acknowledged"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getAlertTypeBadge(alert.alert_type)}
                      {getStatusBadge(alert.status)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(alert.timestamp)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4" />
                      <span>Trip ID: {alert.trip_id}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>
                        Location: {alert.location.latitude.toFixed(4)},{" "}
                        {alert.location.longitude.toFixed(4)}
                      </span>
                    </div>

                    {alert.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {alert.description}
                      </p>
                    )}
                  </div>

                  {alert.status === "new" && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() =>
                          handleAlertAction(alert.id, "acknowledge")
                        }
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Acknowledge
                      </Button>
                      <Button
                        onClick={() => handleAlertAction(alert.id, "resolve")}
                        variant="default"
                        size="sm"
                        className="flex-1"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  )}

                  {alert.status === "acknowledged" && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleAlertAction(alert.id, "resolve")}
                        variant="default"
                        size="sm"
                        className="flex-1"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {filteredAlerts.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No alerts found</p>
                  <p className="text-xs">
                    {statusFilter !== "all" || typeFilter !== "all"
                      ? "Try adjusting your filters"
                      : "All quiet on the monitoring front"}
                  </p>
                </div>
              )}

              {loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                  <p>Loading alerts...</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertManagement;
