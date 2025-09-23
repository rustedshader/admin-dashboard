"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw,
  Clock,
  MapPin,
  User,
  Filter,
  Search,
  Heart,
  HelpCircle,
  Shield,
  UserX,
  Activity,
  Car,
} from "lucide-react";
import { useAuthenticatedFetch } from "@/hooks/useAuth";

// Types based on OpenAPI schema
interface AlertResponse {
  id: number;
  message: string;
  alert_type:
    | "emergency"
    | "help_needed"
    | "safety_concern"
    | "lost"
    | "medical"
    | "accident";
  latitude: number;
  longitude: number;
  status: "active" | "resolved";
  created_by: number;
  created_at: string;
  resolved_by?: number;
  resolved_at?: string;
}

interface AlertListResponse {
  alerts: AlertResponse[];
  total_count: number;
  page: number;
  page_size: number;
}

interface AlertStatsResponse {
  total_alerts: number;
  active_alerts: number;
  alerts_by_type: Record<string, number>;
  alerts_by_status: Record<string, number>;
}

const AlertManagement = () => {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [stats, setStats] = useState<AlertStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertResponse | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filters
  const [alertType, setAlertType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Fetch alert statistics
  const fetchAlertStats = async () => {
    try {
      const response = await authenticatedFetch("/api/alerts/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching alert stats:", error);
    }
  };

  // Fetch alerts with filters
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      });

      if (alertType !== "all") {
        params.append("alert_type", alertType);
      }
      if (statusFilter !== "all") {
        params.append("status_filter", statusFilter);
      }

      const response = await authenticatedFetch(
        `/api/alerts/admin/all?${params}`
      );
      if (response.ok) {
        const data: AlertListResponse = await response.json();
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Resolve alert
  const resolveAlert = async (alertId: number) => {
    try {
      const response = await authenticatedFetch(
        `/api/alerts/${alertId}/resolve`,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        fetchAlerts();
        fetchAlertStats();
        setSelectedAlert(null);
        setIsDetailModalOpen(false);
      }
    } catch (error) {
      console.error("Error resolving alert:", error);
    }
  };

  // Get alert type icon and color
  const getAlertTypeInfo = (type: string) => {
    switch (type) {
      case "emergency":
        return {
          icon: AlertTriangle,
          color: "text-red-500",
          bgColor: "bg-red-50",
          label: "Emergency",
        };
      case "medical":
        return {
          icon: Heart,
          color: "text-red-600",
          bgColor: "bg-red-50",
          label: "Medical",
        };
      case "accident":
        return {
          icon: Car,
          color: "text-orange-500",
          bgColor: "bg-orange-50",
          label: "Accident",
        };
      case "help_needed":
        return {
          icon: HelpCircle,
          color: "text-blue-500",
          bgColor: "bg-blue-50",
          label: "Help Needed",
        };
      case "safety_concern":
        return {
          icon: Shield,
          color: "text-yellow-500",
          bgColor: "bg-yellow-50",
          label: "Safety Concern",
        };
      case "lost":
        return {
          icon: UserX,
          color: "text-purple-500",
          bgColor: "bg-purple-50",
          label: "Lost",
        };
      default:
        return {
          icon: AlertTriangle,
          color: "text-gray-500",
          bgColor: "bg-gray-50",
          label: "Other",
        };
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge variant="destructive">Active</Badge>
    ) : (
      <Badge variant="secondary">Resolved</Badge>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Open alert detail modal
  const openAlertDetail = (alert: AlertResponse) => {
    setSelectedAlert(alert);
    setIsDetailModalOpen(true);
  };

  useEffect(() => {
    fetchAlerts();
    fetchAlertStats();
  }, [currentPage, alertType, statusFilter]);

  // Filter alerts by search term
  const filteredAlerts = alerts.filter(
    (alert) =>
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.id.toString().includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Alert Management</h1>
        <Button
          onClick={() => {
            fetchAlerts();
            fetchAlertStats();
          }}
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Alerts
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_alerts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Alerts
              </CardTitle>
              <Activity className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {stats.active_alerts}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {stats.alerts_by_status.resolved || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emergency</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.alerts_by_type.emergency || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts by message or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={alertType} onValueChange={setAlertType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Alert Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="accident">Accident</SelectItem>
                <SelectItem value="help_needed">Help Needed</SelectItem>
                <SelectItem value="safety_concern">Safety Concern</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alerts ({filteredAlerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => {
                    const typeInfo = getAlertTypeInfo(alert.alert_type);
                    const TypeIcon = typeInfo.icon;

                    return (
                      <TableRow key={alert.id}>
                        <TableCell className="font-mono">{alert.id}</TableCell>
                        <TableCell>
                          <div
                            className={`flex items-center gap-2 p-2 rounded-lg ${typeInfo.bgColor}`}
                          >
                            <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                            <span className="text-sm font-medium">
                              {typeInfo.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={alert.message}>
                            {alert.message}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(alert.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(alert.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {alert.latitude.toFixed(4)},{" "}
                            {alert.longitude.toFixed(4)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAlertDetail(alert)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {alert.status === "active" && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => resolveAlert(alert.id)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Alert Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Alert ID
                  </label>
                  <p className="font-mono">{selectedAlert.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Type
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const typeInfo = getAlertTypeInfo(
                        selectedAlert.alert_type
                      );
                      const TypeIcon = typeInfo.icon;
                      return (
                        <>
                          <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                          <span>{typeInfo.label}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(selectedAlert.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created By
                  </label>
                  <p>User ID: {selectedAlert.created_by}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Message
                </label>
                <p className="mt-1 p-3 bg-muted rounded-md">
                  {selectedAlert.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Location
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {selectedAlert.latitude}, {selectedAlert.longitude}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created At
                  </label>
                  <p>{formatDate(selectedAlert.created_at)}</p>
                </div>
              </div>

              {selectedAlert.resolved_at && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Resolved By
                    </label>
                    <p>User ID: {selectedAlert.resolved_by}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Resolved At
                    </label>
                    <p>{formatDate(selectedAlert.resolved_at)}</p>
                  </div>
                </div>
              )}

              {selectedAlert.status === "active" && (
                <div className="flex justify-end pt-4">
                  <Button onClick={() => resolveAlert(selectedAlert.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve Alert
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlertManagement;
