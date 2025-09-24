"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuthenticatedFetch } from "@/hooks/useAuth";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { MapPin, Plus, Edit, Trash2, Shield, AlertCircle } from "lucide-react";
import GeofencingMapWrapper from "./GeofencingMapWrapper";
import Link from "next/link";

interface RestrictedArea {
  id: string;
  name: string;
  description: string;
  area_type_id: string;
  area_type_name?: string;
  coordinates: Array<{ lat: number; lng: number }>;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface AreaType {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface GeofencingStats {
  total_areas: number;
  active_areas: number;
  inactive_areas: number;
  total_types: number;
}

export default function GeofencingManagement() {
  const [areas, setAreas] = useState<RestrictedArea[]>([]);
  const [areaTypes, setAreaTypes] = useState<AreaType[]>([]);
  const [stats, setStats] = useState<GeofencingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<RestrictedArea | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { authenticatedFetch } = useAuthenticatedFetch();
  const { status: sessionStatus } = useSession();

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch restricted areas
      const areasParams = new URLSearchParams({
        limit: "100",
        offset: "0",
      });

      if (statusFilter !== "all") {
        areasParams.append("status_filter", statusFilter);
      }
      if (typeFilter !== "all") {
        areasParams.append("area_type_filter", typeFilter);
      }

      const [areasResponse, typesResponse] = await Promise.all([
        authenticatedFetch(`/api/geofencing/restricted-areas?${areasParams}`),
        authenticatedFetch("/api/geofencing/area-types?limit=50&offset=0"),
      ]);

      if (areasResponse.ok) {
        const areasData = await areasResponse.json();
        setAreas(areasData.restricted_areas || []);

        // Calculate stats
        const totalAreas = areasData.restricted_areas?.length || 0;
        const activeAreas =
          areasData.restricted_areas?.filter(
            (area: RestrictedArea) => area.status === "active"
          ).length || 0;
        const inactiveAreas = totalAreas - activeAreas;

        setStats({
          total_areas: totalAreas,
          active_areas: activeAreas,
          inactive_areas: inactiveAreas,
          total_types: 0, // Will be updated below
        });
      }

      if (typesResponse.ok) {
        const typesData = await typesResponse.json();
        setAreaTypes(typesData.area_types || []);

        // Update stats with types count
        if (stats) {
          setStats((prev) =>
            prev
              ? { ...prev, total_types: typesData.area_types?.length || 0 }
              : null
          );
        }
      }
    } catch (error) {
      console.error("Error fetching geofencing data:", error);
      toast.error("Failed to load geofencing data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data when session is authenticated
    if (sessionStatus === "authenticated") {
      fetchData();
    }
  }, [statusFilter, typeFilter, sessionStatus]);

  // Reset loading state when session status changes to non-loading but not authenticated
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [sessionStatus]);

  const handleUpdateArea = async () => {
    if (!selectedArea) return;

    try {
      // Transform the data to match backend API expectations
      const apiPayload = {
        name: selectedArea.name,
        description: selectedArea.description,
        area_type: selectedArea.area_type_id, // Backend expects 'area_type' not 'area_type_id'
        boundary_coordinates: selectedArea.coordinates.map((coord) => ({
          latitude: Number(coord.lat), // Backend expects object with latitude/longitude
          longitude: Number(coord.lng),
        })),
        status: selectedArea.status,
      };

      const response = await authenticatedFetch(
        `/api/geofencing/restricted-areas/${selectedArea.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiPayload),
        }
      );

      if (response.ok) {
        toast.success("Restricted area updated successfully");
        setIsEditModalOpen(false);
        setSelectedArea(null);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update restricted area");
      }
    } catch (error) {
      console.error("Error updating area:", error);
      toast.error("Failed to update restricted area");
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!confirm("Are you sure you want to delete this restricted area?"))
      return;

    try {
      const response = await authenticatedFetch(
        `/api/geofencing/restricted-areas/${areaId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Restricted area deleted successfully");
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete restricted area");
      }
    } catch (error) {
      console.error("Error deleting area:", error);
      toast.error("Failed to delete restricted area");
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === "active" ? "default" : "secondary"}>
        {status === "active" ? (
          <Shield className="w-3 h-3 mr-1" />
        ) : (
          <AlertCircle className="w-3 h-3 mr-1" />
        )}
        {status}
      </Badge>
    );
  };

  const getAreaTypeName = (areaTypeId: string) => {
    const type = areaTypes.find((t) => t.id === areaTypeId);
    return type?.name || "Unknown";
  };

  if (loading || sessionStatus === "loading") {
    return <div className="p-6">Loading geofencing data...</div>;
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="p-6">Please log in to access geofencing management.</div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-primary p-2 h-35 flex justify-between items-center">
        <h1 className="text-3xl text-white font-bold">Geofencing Management</h1>
        <div className="flex space-x-3">
          <Link href="/geofencing/add">
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add New Area
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Areas</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_areas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Areas
              </CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.active_areas}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Inactive Areas
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.inactive_areas}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Area Types</CardTitle>
              <div className="h-4 w-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_types}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="areas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="areas">Restricted Areas</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="types">Area Types</TabsTrigger>
        </TabsList>

        <TabsContent value="areas" className="space-y-4">
          {/* Filters */}
          <div className="flex space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {areaTypes.map((type, index) => (
                  <SelectItem
                    key={type.id || `area-type-${index}`}
                    value={type.id}
                  >
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Areas Table */}
          <Card>
            <CardHeader>
              <CardTitle>Restricted Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areas.map((area, index) => (
                    <TableRow key={area.id || `area-${index}`}>
                      <TableCell className="font-medium">{area.name}</TableCell>
                      <TableCell>
                        {getAreaTypeName(area.area_type_id)}
                      </TableCell>
                      <TableCell>{getStatusBadge(area.status)}</TableCell>
                      <TableCell>{area.coordinates.length}</TableCell>
                      <TableCell>
                        {new Date(area.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedArea(area);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteArea(area.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Geofencing Map View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 border rounded-lg overflow-hidden">
                <GeofencingMapWrapper
                  mode="view"
                  existingAreas={areas}
                  areaTypes={areaTypes}
                  center={[26.1445, 91.7362]} // Guwahati, North East India
                  zoom={11}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Area Types</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Icon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areaTypes.map((type, index) => (
                    <TableRow key={type.id || `area-type-table-${index}`}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.description}</TableCell>
                      <TableCell>
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: type.color }}
                        />
                      </TableCell>
                      <TableCell>{type.icon}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Restricted Area</DialogTitle>
          </DialogHeader>
          {selectedArea && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedArea.name}
                    onChange={(e) =>
                      setSelectedArea((prev) =>
                        prev ? { ...prev, name: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-type">Area Type</Label>
                  <Select
                    value={selectedArea.area_type_id}
                    onValueChange={(value) =>
                      setSelectedArea((prev) =>
                        prev ? { ...prev, area_type_id: value } : null
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {areaTypes.map((type, index) => (
                        <SelectItem
                          key={type.id || `edit-area-type-${index}`}
                          value={type.id}
                        >
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedArea.description}
                  onChange={(e) =>
                    setSelectedArea((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={selectedArea.status}
                  onValueChange={(value) =>
                    setSelectedArea((prev) =>
                      prev
                        ? { ...prev, status: value as "active" | "inactive" }
                        : null
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateArea}>Update Area</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
