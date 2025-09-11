"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw,
  Clock,
  MapPin,
  User,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { useAuthenticatedFetch } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";

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

const AlertsPage = () => {
  const { authenticatedFetch, isAuthenticated } = useAuthenticatedFetch();
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<AlertData[]>([]);
  const [alertStats, setAlertStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAlerts = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("alert_type", typeFilter);
      params.append("limit", "100");

      const queryString = params.toString();

      // Fetch alerts, emergency alerts, and statistics in parallel
      const [alertsResponse, emergencyResponse, statsResponse] =
        await Promise.allSettled([
          authenticatedFetch(
            `/api/alerts${queryString ? `?${queryString}` : ""}`
          ),
          authenticatedFetch("/api/alerts/emergency"),
          authenticatedFetch("/api/alerts/statistics"),
        ]);

      if (alertsResponse.status === "fulfilled" && alertsResponse.value.ok) {
        const alertsData = await alertsResponse.value.json();
        setAlerts(alertsData || []);
      }

      if (
        emergencyResponse.status === "fulfilled" &&
        emergencyResponse.value.ok
      ) {
        const emergencyData = await emergencyResponse.value.json();
        setEmergencyAlerts(emergencyData || []);
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

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
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
        color: "bg-red-100 text-red-800 border-red-200",
        label: "Emergency",
        icon: AlertTriangle,
      },
      deviation: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        label: "Route Deviation",
        icon: MapPin,
      },
      weather: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        label: "Weather Alert",
        icon: Clock,
      },
      other: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        label: "Other",
        icon: AlertTriangle,
      },
    };

    const config =
      typeConfig[type as keyof typeof typeConfig] || typeConfig.other;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1 border`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { color: "bg-red-100 text-red-800 border-red-200", label: "New" },
      acknowledged: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "Acknowledged",
      },
      resolved: {
        color: "bg-green-100 text-green-800 border-green-200",
        label: "Resolved",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return <Badge className={`${config.color} border`}>{config.label}</Badge>;
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

    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (
      searchTerm &&
      !alert.description?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !alert.trip_id.toString().includes(searchTerm)
    ) {
      return false;
    }
    return true;
  });

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = "text-blue-600",
  }: {
    title: string;
    value: number;
    icon: any;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Alert Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage system alerts in real-time
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
            <Button
              onClick={fetchAlerts}
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

        {/* Alert Statistics */}
        {alertStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Alerts"
              value={alertStats.total_alerts}
              icon={AlertTriangle}
              color="text-gray-600"
            />
            <StatCard
              title="New Alerts"
              value={alertStats.new_alerts}
              icon={AlertTriangle}
              color="text-red-600"
            />
            <StatCard
              title="Emergency Alerts"
              value={alertStats.emergency_alerts}
              icon={AlertTriangle}
              color="text-red-600"
            />
            <StatCard
              title="Resolved Alerts"
              value={alertStats.resolved_alerts}
              icon={CheckCircle}
              color="text-green-600"
            />
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="all-alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all-alerts">All Alerts</TabsTrigger>
            <TabsTrigger value="emergency">Emergency Alerts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="all-alerts" className="space-y-4">
            {/* Filters and Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    <Input
                      placeholder="Search alerts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="new">New</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="resolved">Resolved</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Types</option>
                    <option value="emergency">Emergency</option>
                    <option value="deviation">Route Deviation</option>
                    <option value="weather">Weather</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Alert List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Alerts ({filteredAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px] px-6">
                  <div className="space-y-4">
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
                            <p className="text-sm text-muted-foreground mt-2 p-2 bg-white rounded border">
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
                              onClick={() =>
                                handleAlertAction(alert.id, "resolve")
                              }
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
                              onClick={() =>
                                handleAlertAction(alert.id, "resolve")
                              }
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
                      <div className="text-center py-12 text-muted-foreground">
                        <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No alerts found</p>
                        <p className="text-sm">
                          {searchTerm ||
                          statusFilter !== "all" ||
                          typeFilter !== "all"
                            ? "Try adjusting your filters or search terms"
                            : "All quiet - no alerts to display"}
                        </p>
                      </div>
                    )}

                    {loading && (
                      <div className="text-center py-12 text-muted-foreground">
                        <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
                        <p>Loading alerts...</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Emergency Alerts ({emergencyAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px] px-6">
                  <div className="space-y-4">
                    {emergencyAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-4 rounded-lg border-2 border-red-200 bg-red-50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-100 text-red-800 border-red-200 border">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Emergency
                            </Badge>
                            {getStatusBadge(alert.status)}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(alert.timestamp)}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
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
                            <p className="text-sm mt-2 p-3 bg-white rounded border border-red-200">
                              <strong>Emergency Details:</strong>{" "}
                              {alert.description}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 mt-4">
                          {alert.status === "new" && (
                            <>
                              <Button
                                onClick={() =>
                                  handleAlertAction(alert.id, "acknowledge")
                                }
                                variant="outline"
                                size="sm"
                                className="flex-1 border-red-300 text-red-700 hover:bg-red-100"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Acknowledge Emergency
                              </Button>
                              <Button
                                onClick={() =>
                                  handleAlertAction(alert.id, "resolve")
                                }
                                variant="default"
                                size="sm"
                                className="flex-1 bg-red-600 hover:bg-red-700"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Resolve Emergency
                              </Button>
                            </>
                          )}
                          {alert.status === "acknowledged" && (
                            <Button
                              onClick={() =>
                                handleAlertAction(alert.id, "resolve")
                              }
                              variant="default"
                              size="sm"
                              className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Resolve Emergency
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    {emergencyAlerts.length === 0 && !loading && (
                      <div className="text-center py-12 text-muted-foreground">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                        <p className="text-lg font-medium">
                          No Emergency Alerts
                        </p>
                        <p className="text-sm">
                          All emergency situations have been resolved
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {alertStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Alert Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>New Alerts</span>
                          <span className="font-medium">
                            {alertStats.new_alerts}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                alertStats.total_alerts > 0
                                  ? (alertStats.new_alerts /
                                      alertStats.total_alerts) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Acknowledged</span>
                          <span className="font-medium">
                            {alertStats.acknowledged_alerts}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                alertStats.total_alerts > 0
                                  ? (alertStats.acknowledged_alerts /
                                      alertStats.total_alerts) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Resolved</span>
                          <span className="font-medium">
                            {alertStats.resolved_alerts}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                alertStats.total_alerts > 0
                                  ? (alertStats.resolved_alerts /
                                      alertStats.total_alerts) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Alert Type Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          Emergency
                        </span>
                        <Badge variant="destructive">
                          {alertStats.emergency_alerts}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-orange-500" />
                          Route Deviation
                        </span>
                        <Badge className="bg-orange-100 text-orange-800">
                          {alertStats.deviation_alerts}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          Weather
                        </span>
                        <Badge className="bg-blue-100 text-blue-800">
                          {alertStats.weather_alerts}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-gray-500" />
                          Other
                        </span>
                        <Badge variant="outline">
                          {alertStats.other_alerts}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AlertsPage;
