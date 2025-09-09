"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthenticatedFetch } from "@/hooks/useAuth";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Plus,
  Radio,
  Eye,
  EyeOff,
  Copy,
  Settings,
  Activity,
  Battery,
  Wifi,
} from "lucide-react";
import Link from "next/link";

interface TrackingDevice {
  id: number;
  device_id: string;
  api_key: string;
  status: "active" | "inactive" | "maintenance";
  treck_id: number | null;
  created_at: number;
}

interface TrackingDeviceStats {
  total_devices: number;
  active_devices: number;
  inactive_devices: number;
  maintenance_devices: number;
}

export default function TrackingDevicesPage() {
  const [devices, setDevices] = useState<TrackingDevice[]>([]);
  const [stats, setStats] = useState<TrackingDeviceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<TrackingDevice | null>(
    null
  );
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [visibleApiKeys, setVisibleApiKeys] = useState<Set<string>>(new Set());

  const { authenticatedFetch } = useAuthenticatedFetch();
  const { status: sessionStatus } = useSession();

  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await authenticatedFetch("/api/tracking-device/list");

      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);

        // Calculate stats
        const totalDevices = data.devices?.length || 0;
        const activeDevices =
          data.devices?.filter(
            (device: TrackingDevice) => device.status === "active"
          ).length || 0;
        const inactiveDevices =
          data.devices?.filter(
            (device: TrackingDevice) => device.status === "inactive"
          ).length || 0;
        const maintenanceDevices =
          data.devices?.filter(
            (device: TrackingDevice) => device.status === "maintenance"
          ).length || 0;

        setStats({
          total_devices: totalDevices,
          active_devices: activeDevices,
          inactive_devices: inactiveDevices,
          maintenance_devices: maintenanceDevices,
        });
      }
    } catch (error) {
      console.error("Error fetching tracking devices:", error);
      toast.error("Failed to load tracking devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchData();
    }
  }, [sessionStatus]);

  const handleUpdateStatus = async () => {
    if (!selectedDevice || !newStatus) return;

    try {
      const response = await authenticatedFetch(
        `/api/tracking-device/${selectedDevice.device_id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        toast.success("Device status updated successfully");
        setIsStatusModalOpen(false);
        setSelectedDevice(null);
        setNewStatus("");
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update device status");
      }
    } catch (error) {
      console.error("Error updating device status:", error);
      toast.error("Failed to update device status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "inactive":
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      case "maintenance":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const toggleApiKeyVisibility = (deviceId: string) => {
    setVisibleApiKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(deviceId)) {
        newSet.delete(deviceId);
      } else {
        newSet.add(deviceId);
      }
      return newSet;
    });
  };

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast.success("API key copied to clipboard");
  };

  const formatApiKey = (apiKey: string, deviceId: string) => {
    if (visibleApiKeys.has(deviceId)) {
      return apiKey;
    }
    return `${apiKey.substring(0, 8)}${"*".repeat(
      Math.max(0, apiKey.length - 16)
    )}${apiKey.substring(apiKey.length - 8)}`;
  };

  if (loading || sessionStatus === "loading") {
    return <div className="p-6">Loading tracking devices...</div>;
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="p-6">
        Please log in to access tracking device management.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tracking Device Management</h1>
        <Link href="/transport/add">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add New Device
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Devices
              </CardTitle>
              <Radio className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_devices}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Devices
              </CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.active_devices}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Inactive Devices
              </CardTitle>
              <Battery className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.inactive_devices}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
              <Settings className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.maintenance_devices}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trek ID</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device, index) => (
                  <TableRow key={device.id || `device-${index}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Radio className="w-4 h-4" />
                        <span>{device.device_id}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(device.status)}</TableCell>
                    <TableCell>
                      {device.treck_id ? (
                        <Badge variant="outline">Trek #{device.treck_id}</Badge>
                      ) : (
                        <span className="text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 max-w-xs">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate">
                          {formatApiKey(device.api_key, device.device_id)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleApiKeyVisibility(device.device_id)
                          }
                        >
                          {visibleApiKeys.has(device.device_id) ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyApiKey(device.api_key)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(device.created_at * 1000).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDevice(device);
                          setNewStatus(device.status);
                          setIsStatusModalOpen(true);
                        }}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Update Status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Update Status Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Device Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="device">Device ID</Label>
              <Input
                id="device"
                value={selectedDevice?.device_id || ""}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsStatusModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus}>Update Status</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
