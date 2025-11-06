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
  Route,
  Clock,
} from "lucide-react";
import { useAuthenticatedFetch } from "@/hooks/useAuth";
import dynamic from "next/dynamic";

const TripMapComponent = dynamic(
  () => import("@/components/TripMapComponent"),
  {
    ssr: false,
  }
);

interface ActiveTrip {
  trip_id: number;
  user_id: number;
  user_name: string;
  user_phone?: string;
  trip_type: string;
  status: string;
  current_phase?: string;
  destination?: string;
  started_at?: string;
  expected_end?: string;
  created_at?: string;
  updated_at?: string;
}

interface TripLocation {
  trip_id: number;
  user_id: number;
  user_name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  trip_status?: string;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

interface AlertData {
  total_alerts: number;
  new_alerts: number;
  acknowledged_alerts: number;
  resolved_alerts: number;
  emergency_alerts: number;
  high_priority_alerts: number;
  medium_priority_alerts: number;
  low_priority_alerts: number;
}

interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  pending_verification: number;
  verified_users: number;
  blockchain_ids_issued: number;
}

interface DashboardStats {
  totalUsers: number;
  totalActiveTrips: number;
  totalAlerts: number;
  emergencyAlerts: number;
  pendingVerifications: number;
  blockchainIdsIssued: number;
}

const Home = () => {
  const { authenticatedFetch, isAuthenticated, session } =
    useAuthenticatedFetch();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalActiveTrips: 0,
    totalAlerts: 0,
    emergencyAlerts: 0,
    pendingVerifications: 0,
    blockchainIdsIssued: 0,
  });
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([]);
  const [tripLocations, setTripLocations] = useState<TripLocation[]>([]);
  const [alertStats, setAlertStats] = useState<AlertData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchDashboardData = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);

      // Fetch multiple APIs in parallel - using the correct available endpoints
      const [activeTripsRes, tripLocationsRes, alertStatsRes, userStatsRes] =
        await Promise.allSettled([
          authenticatedFetch("/api/admin/active-trips"),
          authenticatedFetch("/api/admin/trip-locations"),
          authenticatedFetch("/api/alerts/admin/stats"),
          authenticatedFetch("/api/users/admin/stats"),
        ]);

      // Process active trips
      if (activeTripsRes.status === "fulfilled" && activeTripsRes.value.ok) {
        const data = await activeTripsRes.value.json();
        console.log("Active trips data:", data); // Debug log

        // Ensure we always set an array
        let tripsArray = [];
        if (Array.isArray(data)) {
          tripsArray = data;
        } else if (data.trips && Array.isArray(data.trips)) {
          tripsArray = data.trips;
        } else if (data.data && Array.isArray(data.data)) {
          tripsArray = data.data;
        }

        setActiveTrips(tripsArray);
        setDashboardStats((prev) => ({
          ...prev,
          totalActiveTrips: tripsArray.length,
        }));
      } else {
        console.error("Failed to fetch active trips:", activeTripsRes);
        setActiveTrips([]); // Ensure it's always an array
      }

      // Process trip locations
      if (
        tripLocationsRes.status === "fulfilled" &&
        tripLocationsRes.value.ok
      ) {
        const data = await tripLocationsRes.value.json();
        console.log("Trip locations data:", data); // Debug log

        // Transform the API response to match our expected format
        // API returns: { trip_locations: [{ trip_id, user_id, tourist_id, latest_location: { latitude, longitude, timestamp } }] }
        let locationsArray: TripLocation[] = [];

        if (data.trip_locations && Array.isArray(data.trip_locations)) {
          // Filter out trips without locations and transform the data
          locationsArray = data.trip_locations
            .filter((trip: any) => trip.latest_location !== null)
            .map((trip: any) => ({
              trip_id: trip.trip_id,
              user_id: trip.user_id,
              user_name: trip.tourist_id || `Tourist ${trip.tourist_id}`,
              latitude: trip.latest_location.latitude,
              longitude: trip.latest_location.longitude,
              timestamp: trip.latest_location.timestamp,
              trip_status: trip.trip_status,
            }));
        }

        console.log("Transformed locations:", locationsArray); // Debug log
        setTripLocations(locationsArray);
      } else {
        console.error("Failed to fetch trip locations:", tripLocationsRes);
        setTripLocations([]); // Ensure it's always an array
      }

      // Process alert statistics
      if (alertStatsRes.status === "fulfilled" && alertStatsRes.value.ok) {
        const data = await alertStatsRes.value.json();
        console.log("Alert stats data:", data); // Debug log
        setAlertStats(data);
        setDashboardStats((prev) => ({
          ...prev,
          totalAlerts: data.total_alerts || 0,
          emergencyAlerts: data.emergency_alerts || 0,
        }));
      } else {
        console.error("Failed to fetch alert stats:", alertStatsRes);
      }

      // Process user statistics
      if (userStatsRes.status === "fulfilled" && userStatsRes.value.ok) {
        const data = await userStatsRes.value.json();
        console.log("User stats data:", data); // Debug log
        setUserStats(data);
        setDashboardStats((prev) => ({
          ...prev,
          totalUsers: data.total_users || 0,
          blockchainIdsIssued: data.blockchain_ids_issued || 0,
          pendingVerifications: data.pending_verification || 0,
        }));
      } else {
        console.error("Failed to fetch user stats:", userStatsRes);
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
        <div className="bg-primary h-35 flex p-2 items-center justify-between">
          <div>
            <h1 className="text-3xl text-white font-bold">
              Tourism Admin Dashboard
            </h1>
            <p className="text-primary-foreground">
              Real-time monitoring and management system
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-primary-foreground">
              Last updated:{" "}
              {isClient ? lastUpdated.toLocaleTimeString() : "Loading..."}
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
            title="Total Alerts"
            value={dashboardStats.totalAlerts}
            icon={AlertTriangle}
            color="text-orange-600"
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
            color="text-yellow-600"
          />
          <StatCard
            title="Blockchain IDs"
            value={dashboardStats.blockchainIdsIssued}
            icon={Shield}
            color="text-purple-600"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="monitoring" className=" w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
            <TabsTrigger value="alerts">Alert Management</TabsTrigger>
            <TabsTrigger value="users">User Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Trips List */}
              <div className="lg:col-span-1">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Route className="w-5 h-5" />
                      Active Trips (
                      {Array.isArray(activeTrips) ? activeTrips.length : 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px] px-6">
                      <div className="space-y-3">
                        {Array.isArray(activeTrips) &&
                          activeTrips.map((trip) => (
                            <div
                              key={trip.trip_id}
                              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">
                                  {trip.user_name || `User ${trip.user_id}`}
                                </h4>
                                {getStatusBadge(trip.status)}
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p>Trip ID: {trip.trip_id}</p>
                                <p>Type: {trip.trip_type}</p>
                                {trip.destination && (
                                  <p>Destination: {trip.destination}</p>
                                )}
                                {trip.current_phase && (
                                  <p>Phase: {trip.current_phase}</p>
                                )}
                                {trip.started_at && (
                                  <p className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Started:{" "}
                                    {new Date(
                                      trip.started_at
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        {(!Array.isArray(activeTrips) ||
                          activeTrips.length === 0) && (
                          <div className="text-center py-8 text-muted-foreground">
                            No active trips found
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Real-time Locations Map */}
              <div className="lg:col-span-2">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Live Location Tracking (
                      {Array.isArray(tripLocations) ? tripLocations.length : 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[500px]">
                      <TripMapComponent
                        tripLocations={tripLocations}
                        height="500px"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Location Details List */}
            {Array.isArray(tripLocations) && tripLocations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.isArray(tripLocations) &&
                        tripLocations.map((location, index) => (
                          <div
                            key={`${location.trip_id}-${index}`}
                            className="p-3 rounded-lg border bg-card"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">
                                {location.user_name ||
                                  `User ${location.user_id}`}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                Trip {location.trip_id}
                              </Badge>
                            </div>
                            {location.trip_status && (
                              <div className="mb-2">
                                {getStatusBadge(location.trip_status)}
                              </div>
                            )}
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <p>Lat: {location.latitude.toFixed(6)}</p>
                              <p>Lng: {location.longitude.toFixed(6)}</p>
                              <p>
                                Updated:{" "}
                                {new Date(
                                  location.timestamp
                                ).toLocaleTimeString()}
                              </p>
                              {location.accuracy && (
                                <p>Accuracy: {location.accuracy}m</p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
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
                    <CardTitle>Alert Priority Breakdown</CardTitle>
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
                        <span>High Priority</span>
                        <Badge variant="secondary">
                          {alertStats.high_priority_alerts}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Medium Priority</span>
                        <Badge variant="outline">
                          {alertStats.medium_priority_alerts}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Low Priority</span>
                        <Badge variant="outline">
                          {alertStats.low_priority_alerts}
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
                          <span>{alertStats.acknowledged_alerts}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-600 h-2 rounded-full"
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
                          <span>{alertStats.resolved_alerts}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
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
                    value={userStats.verified_users || 0}
                    icon={UserCheck}
                    color="text-green-600"
                  />
                  <StatCard
                    title="Active Users"
                    value={userStats.active_users || 0}
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
                      <CardTitle>User Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Active Users</span>
                          <Badge variant="default">
                            {userStats.active_users}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Inactive Users</span>
                          <Badge variant="secondary">
                            {userStats.inactive_users}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Verification Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Verified</span>
                          <Badge variant="default">
                            {userStats.verified_users}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Pending Verification</span>
                          <Badge variant="secondary">
                            {userStats.pending_verification}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Blockchain IDs Issued</span>
                          <Badge variant="outline">
                            {userStats.blockchain_ids_issued}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Home;
