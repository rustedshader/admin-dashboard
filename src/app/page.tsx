"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  MapPin,
  AlertTriangle,
  Activity,
  TrendingUp,
  Eye,
  UserCheck,
  Shield,
  Navigation,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { useAuthenticatedFetch } from "@/hooks/useAuth";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
});

interface DashboardStats {
  totalUsers: number;
  totalActiveTrips: number;
  emergencyAlerts: number;
  pendingVerifications: number;
  todayRegistrations: number;
  blockchainIdsIssued: number;
}

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
  last_location?: any;
}

interface AlertData {
  total_alerts: number;
  new_alerts: number;
  acknowledged_alerts: number;
  resolved_alerts: number;
  emergency_alerts: number;
  deviation_alerts: number;
  weather_alerts: number;
  other_alerts: number;
}

interface UserStats {
  total_users: number;
  by_role: Record<string, number>;
  by_verification: Record<string, number>;
  by_status: Record<string, number>;
  blockchain_ids_issued: number;
}

interface PlaceData {
  id: number;
  name: string;
  city: string;
  state: string;
  place_type: string;
  is_featured: boolean;
  latitude: number;
  longitude: number;
}

const Home = () => {
  const { authenticatedFetch, isAuthenticated, session } =
    useAuthenticatedFetch();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalActiveTrips: 0,
    emergencyAlerts: 0,
    pendingVerifications: 0,
    todayRegistrations: 0,
    blockchainIdsIssued: 0,
  });
  const [activeTourists, setActiveTourists] = useState<ActiveTourist[]>([]);
  const [alertStats, setAlertStats] = useState<AlertData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [featuredPlaces, setFeaturedPlaces] = useState<PlaceData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);

      // Fetch multiple APIs in parallel
      const [
        activeTouristsRes,
        alertStatsRes,
        userStatsRes,
        featuredPlacesRes,
      ] = await Promise.allSettled([
        authenticatedFetch("/api/tracking/admin/active-tourists"),
        authenticatedFetch("/api/alerts/statistics"),
        authenticatedFetch("/api/users/admin/stats"),
        authenticatedFetch("/api/places/featured"),
      ]);

      // Process active tourists
      if (
        activeTouristsRes.status === "fulfilled" &&
        activeTouristsRes.value.ok
      ) {
        const data = await activeTouristsRes.value.json();
        setActiveTourists(data.tourists || []);
        setDashboardStats((prev) => ({
          ...prev,
          totalActiveTrips: data.total_active_tourists || 0,
        }));
      }

      // Process alert statistics
      if (alertStatsRes.status === "fulfilled" && alertStatsRes.value.ok) {
        const data = await alertStatsRes.value.json();
        setAlertStats(data);
        setDashboardStats((prev) => ({
          ...prev,
          emergencyAlerts: data.emergency_alerts || 0,
        }));
      }

      // Process user statistics
      if (userStatsRes.status === "fulfilled" && userStatsRes.value.ok) {
        const data = await userStatsRes.value.json();
        setUserStats(data);
        setDashboardStats((prev) => ({
          ...prev,
          totalUsers: data.total_users || 0,
          blockchainIdsIssued: data.blockchain_ids_issued || 0,
          pendingVerifications: data.by_verification?.unverified || 0,
        }));
      }

      // Process featured places
      if (
        featuredPlacesRes.status === "fulfilled" &&
        featuredPlacesRes.value.ok
      ) {
        const data = await featuredPlacesRes.value.json();
        setFeaturedPlaces(data || []);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, authenticatedFetch]);

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

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color = "text-blue-600",
  }: {
    title: string;
    value: number | string;
    icon: any;
    trend?: string;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                {trend}
              </p>
            )}
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tourism Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time monitoring and management system
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
            <Button onClick={fetchDashboardData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Users"
            value={dashboardStats.totalUsers.toLocaleString()}
            icon={Users}
            color="text-blue-600"
          />
          <StatCard
            title="Active Trips"
            value={dashboardStats.totalActiveTrips}
            icon={Navigation}
            color="text-green-600"
          />
          <StatCard
            title="Emergency Alerts"
            value={dashboardStats.emergencyAlerts}
            icon={AlertTriangle}
            color="text-red-600"
          />
          <StatCard
            title="Pending Verifications"
            value={dashboardStats.pendingVerifications}
            icon={UserCheck}
            color="text-orange-600"
          />
          <StatCard
            title="Blockchain IDs"
            value={dashboardStats.blockchainIdsIssued}
            icon={Shield}
            color="text-purple-600"
          />
          <StatCard
            title="Featured Places"
            value={featuredPlaces.length}
            icon={MapPin}
            color="text-indigo-600"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="monitoring" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
            <TabsTrigger value="alerts">Alert Management</TabsTrigger>
            <TabsTrigger value="users">User Analytics</TabsTrigger>
            <TabsTrigger value="places">Places Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Tourists List */}
              <div className="lg:col-span-1">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Active Tourists ({activeTourists.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px] px-6">
                      <div className="space-y-3">
                        {activeTourists.map((tourist) => (
                          <div
                            key={tourist.trip_id}
                            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">
                                {tourist.user_name}
                              </h4>
                              {getStatusBadge(tourist.status)}
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>Trip ID: {tourist.trip_id}</p>
                              <p>Type: {tourist.trip_type}</p>
                              {tourist.current_phase && (
                                <p>Phase: {tourist.current_phase}</p>
                              )}
                              {tourist.linked_device_id && (
                                <p>Device: {tourist.linked_device_id}</p>
                              )}
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    tourist.is_tracking_active
                                      ? "bg-green-500"
                                      : "bg-gray-400"
                                  }`}
                                />
                                <span>
                                  {tourist.is_tracking_active
                                    ? "Tracking Active"
                                    : "No Tracking"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {activeTourists.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No active tourists found
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Map */}
              <div className="lg:col-span-2">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Real-time Tourist Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[500px]">
                      <MapComponent />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            {alertStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  title="Acknowledged"
                  value={alertStats.acknowledged_alerts}
                  icon={Eye}
                  color="text-yellow-600"
                />
                <StatCard
                  title="Resolved"
                  value={alertStats.resolved_alerts}
                  icon={UserCheck}
                  color="text-green-600"
                />
              </div>
            )}

            {alertStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Alert Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Emergency Alerts</span>
                        <Badge variant="destructive">
                          {alertStats.emergency_alerts}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Route Deviations</span>
                        <Badge variant="secondary">
                          {alertStats.deviation_alerts}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Weather Alerts</span>
                        <Badge variant="outline">
                          {alertStats.weather_alerts}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Other Alerts</span>
                        <Badge variant="outline">
                          {alertStats.other_alerts}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Alert Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>New</span>
                          <span>{alertStats.new_alerts}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (alertStats.new_alerts /
                                  alertStats.total_alerts) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Acknowledged</span>
                          <span>{alertStats.acknowledged_alerts}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (alertStats.acknowledged_alerts /
                                  alertStats.total_alerts) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Resolved</span>
                          <span>{alertStats.resolved_alerts}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (alertStats.resolved_alerts /
                                  alertStats.total_alerts) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {userStats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Users"
                    value={userStats.total_users}
                    icon={Users}
                    color="text-blue-600"
                  />
                  <StatCard
                    title="Verified Users"
                    value={userStats.by_verification.verified || 0}
                    icon={UserCheck}
                    color="text-green-600"
                  />
                  <StatCard
                    title="Active Users"
                    value={userStats.by_status.active || 0}
                    icon={Activity}
                    color="text-purple-600"
                  />
                  <StatCard
                    title="Blockchain IDs"
                    value={userStats.blockchain_ids_issued}
                    icon={Shield}
                    color="text-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Users by Role</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(userStats.by_role).map(
                          ([role, count]) => (
                            <div
                              key={role}
                              className="flex justify-between items-center"
                            >
                              <span className="capitalize">{role}</span>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Verification Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(userStats.by_verification).map(
                          ([status, count]) => (
                            <div
                              key={status}
                              className="flex justify-between items-center"
                            >
                              <span className="capitalize">{status}</span>
                              <Badge
                                variant={
                                  status === "verified"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {count}
                              </Badge>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="places" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Featured Places ({featuredPlaces.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredPlaces.map((place) => (
                    <Card key={place.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{place.name}</h4>
                          <Badge variant="outline">{place.place_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {place.city}, {place.state}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          {place.latitude.toFixed(4)},{" "}
                          {place.longitude.toFixed(4)}
                        </div>
                      </div>
                    </Card>
                  ))}
                  {featuredPlaces.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No featured places found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Home;
