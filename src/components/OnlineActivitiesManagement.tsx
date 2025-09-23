"use client";

import { useState, useEffect } from "react";
import { useAuthenticatedFetch } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search } from "lucide-react";

interface OnlineActivity {
  id: number;
  name: string;
  description?: string;
  city: string;
  state: string;
  place_type: string;
  latitude?: number;
  longitude?: number;
  cost_per_person?: number;
  duration?: number;
  created_at: string;
  updated_at: string;
}

interface CreateOnlineActivityData {
  name: string;
  description?: string;
  city: string;
  state: string;
  place_type: string;
  latitude?: number;
  longitude?: number;
  cost_per_person?: number;
  duration?: number;
  contact_info?: string;
  website?: string;
  rating?: number;
}

export function OnlineActivitiesManagement() {
  const [activities, setActivities] = useState<OnlineActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [placeTypeFilter, setPlaceTypeFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<OnlineActivity | null>(null);
  const [createFormData, setCreateFormData] =
    useState<CreateOnlineActivityData>({
      name: "",
      description: "",
      city: "",
      state: "",
      place_type: "",
      latitude: undefined,
      longitude: undefined,
      cost_per_person: undefined,
      duration: undefined,
    });

  const { authenticatedFetch } = useAuthenticatedFetch();

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (placeTypeFilter && placeTypeFilter !== "all")
        params.append("place_type", placeTypeFilter);
      if (stateFilter) params.append("state", stateFilter);
      params.append("page_size", "100");

      const response = await authenticatedFetch(
        `/api/activities/online?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch online activities");
      }

      const data = await response.json();
      setActivities(data.items || data || []);
    } catch (error) {
      console.error("Error loading online activities:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load activities"
      );
      toast.error("Failed to load online activities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [placeTypeFilter, stateFilter]);

  const handleCreateActivity = async () => {
    try {
      const response = await authenticatedFetch("/api/activities/online", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createFormData),
      });

      if (!response.ok) {
        throw new Error("Failed to create online activity");
      }

      toast.success("Online activity created successfully!");
      setCreateDialogOpen(false);
      setCreateFormData({
        name: "",
        description: "",
        city: "",
        state: "",
        place_type: "",
        latitude: undefined,
        longitude: undefined,
        cost_per_person: undefined,
        duration: undefined,
      });
      loadActivities();
    } catch (error) {
      console.error("Error creating online activity:", error);
      toast.error("Failed to create online activity");
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!confirm("Are you sure you want to delete this online activity?")) {
      return;
    }

    try {
      const response = await authenticatedFetch(
        `/api/activities/online/${activityId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete online activity");
      }

      toast.success("Online activity deleted successfully!");
      loadActivities();
    } catch (error) {
      console.error("Error deleting online activity:", error);
      toast.error("Failed to delete online activity");
    }
  };

  const filteredActivities = activities.filter(
    (activity) =>
      activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Online Activities Management</h1>
          <p className="text-muted-foreground">
            Manage tourist places, attractions, and online activities
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Online Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Online Activity</DialogTitle>
              <DialogDescription>
                Add a new tourist place or online activity to the system.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={createFormData.name}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter activity name"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createFormData.description}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter activity description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={createFormData.city}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      city: e.target.value,
                    })
                  }
                  placeholder="Enter city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={createFormData.state}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      state: e.target.value,
                    })
                  }
                  placeholder="Enter state"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="place_type">Place Type *</Label>
                <Select
                  value={createFormData.place_type}
                  onValueChange={(value) =>
                    setCreateFormData({
                      ...createFormData,
                      place_type: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select place type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="attraction">
                      Tourist Attraction
                    </SelectItem>
                    <SelectItem value="museum">Museum</SelectItem>
                    <SelectItem value="park">Park</SelectItem>
                    <SelectItem value="shopping">Shopping Center</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="historical">Historical Site</SelectItem>
                    <SelectItem value="religious">Religious Site</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost per Person</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={createFormData.cost_per_person || ""}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      cost_per_person: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="Enter cost per person"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={createFormData.latitude || ""}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      latitude: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="Enter latitude"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={createFormData.longitude || ""}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      longitude: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="Enter longitude"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={createFormData.duration || ""}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      duration: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="Enter duration in hours"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateActivity}>Create Activity</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={placeTypeFilter} onValueChange={setPlaceTypeFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="restaurant">Restaurant</SelectItem>
            <SelectItem value="hotel">Hotel</SelectItem>
            <SelectItem value="attraction">Tourist Attraction</SelectItem>
            <SelectItem value="museum">Museum</SelectItem>
            <SelectItem value="park">Park</SelectItem>
            <SelectItem value="shopping">Shopping Center</SelectItem>
            <SelectItem value="entertainment">Entertainment</SelectItem>
            <SelectItem value="historical">Historical Site</SelectItem>
            <SelectItem value="religious">Religious Site</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Filter by state..."
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="w-full md:w-[200px]"
        />
      </div>

      {error && (
        <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading online activities...
                </TableCell>
              </TableRow>
            ) : filteredActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No online activities found.
                </TableCell>
              </TableRow>
            ) : (
              filteredActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{activity.name}</div>
                      {activity.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {activity.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {activity.place_type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{activity.city}</div>
                      <div className="text-muted-foreground">
                        {activity.state}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {activity.cost_per_person ? (
                      <span className="text-sm">
                        ₹{activity.cost_per_person}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Free
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {activity.duration ? (
                      <span className="text-sm">{activity.duration}h</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedActivity(activity);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteActivity(activity.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {activities.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Activities
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {
                  activities.filter(
                    (a) => a.cost_per_person && a.cost_per_person > 0
                  ).length
                }
              </div>
              <div className="text-sm text-muted-foreground">
                Paid Activities
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {
                  activities.filter(
                    (a) => !a.cost_per_person || a.cost_per_person === 0
                  ).length
                }
              </div>
              <div className="text-sm text-muted-foreground">
                Free Activities
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {new Set(activities.map((a) => a.state)).size}
              </div>
              <div className="text-sm text-muted-foreground">
                States Covered
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
