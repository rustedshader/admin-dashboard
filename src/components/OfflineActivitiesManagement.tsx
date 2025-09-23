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
import { LocationSelector } from "@/components/LocationSelector";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search } from "lucide-react";
interface OfflineActivity {
  id: number;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  city: string;
  district: string;
  state: string;
  duration?: number;
  altitude?: number;
  difficulty_level: "easy" | "moderate" | "hard";
  guide_required: boolean;
  cost_per_person?: number;
  created_at: string;
  updated_at: string;
}
interface CreateActivityData {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  city: string;
  district: string;
  state: string;
  duration?: number;
  altitude?: number;
  difficulty_level: "easy" | "moderate" | "hard";
  guide_required: boolean;
  cost_per_person?: number;
  nearest_town?: string;
  best_season?: string;
  permits_required?: string;
  equipment_needed?: string;
  safety_tips?: string;
  minimum_age?: number;
  maximum_age?: number;
  minimum_people?: number;
  maximum_people?: number;
}
export function OfflineActivitiesManagement() {
  const [activities, setActivities] = useState<OfflineActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<OfflineActivity | null>(null);
  const [createFormData, setCreateFormData] = useState<CreateActivityData>({
    name: "",
    description: "",
    latitude: 0,
    longitude: 0,
    city: "",
    district: "",
    state: "",
    duration: undefined,
    altitude: undefined,
    difficulty_level: "easy",
    guide_required: true,
    cost_per_person: undefined,
    nearest_town: "",
    best_season: "",
    permits_required: "",
    equipment_needed: "",
    safety_tips: "",
    minimum_age: undefined,
    maximum_age: undefined,
    minimum_people: undefined,
    maximum_people: undefined,
  });
  const { authenticatedFetch } = useAuthenticatedFetch();
  useEffect(() => {
    loadActivities();
  }, []);
  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (difficultyFilter && difficultyFilter !== "all")
        params.append("difficulty", difficultyFilter);
      if (stateFilter) params.append("state", stateFilter);
      params.append("limit", "100");
      const response = await authenticatedFetch(
        `/api/activities/offline?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch offline activities");
      }
      const data = await response.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading activities:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load activities"
      );
      toast.error("Failed to load offline activities");
    } finally {
      setLoading(false);
    }
  };
  const handleCreateActivity = async () => {
    try {
      // Validate required fields
      if (
        !createFormData.name ||
        !createFormData.city ||
        !createFormData.district ||
        !createFormData.state
      ) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (createFormData.latitude === 0 || createFormData.longitude === 0) {
        toast.error("Please provide valid coordinates");
        return;
      }
      const response = await authenticatedFetch("/api/activities/offline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createFormData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create activity");
      }
      toast.success("Offline activity created successfully");
      setCreateDialogOpen(false);
      resetCreateForm();
      loadActivities();
    } catch (err) {
      console.error("Error creating activity:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create activity"
      );
    }
  };
  const resetCreateForm = () => {
    setCreateFormData({
      name: "",
      description: "",
      latitude: 0,
      longitude: 0,
      city: "",
      district: "",
      state: "",
      duration: undefined,
      altitude: undefined,
      difficulty_level: "easy",
      guide_required: true,
      cost_per_person: undefined,
      nearest_town: "",
      best_season: "",
      permits_required: "",
      equipment_needed: "",
      safety_tips: "",
      minimum_age: undefined,
      maximum_age: undefined,
      minimum_people: undefined,
      maximum_people: undefined,
    });
  };

  const handleEditActivity = async () => {
    try {
      if (!selectedActivity) {
        toast.error("No activity selected");
        return;
      }

      // Validate required fields
      if (
        !createFormData.name ||
        !createFormData.city ||
        !createFormData.district ||
        !createFormData.state
      ) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (createFormData.latitude === 0 || createFormData.longitude === 0) {
        toast.error("Please provide valid coordinates");
        return;
      }

      const response = await authenticatedFetch(
        `/api/activities/offline/${selectedActivity.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(createFormData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update activity");
      }

      toast.success("Offline activity updated successfully");
      setCreateDialogOpen(false);
      setIsEditing(false);
      setSelectedActivity(null);
      resetCreateForm();
      loadActivities();
    } catch (err) {
      console.error("Error updating activity:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update activity"
      );
    }
  };

  const handleDeleteActivity = async (activity: OfflineActivity) => {
    try {
      if (!confirm(`Are you sure you want to delete "${activity.name}"?`)) {
        return;
      }

      const response = await authenticatedFetch(
        `/api/activities/offline/${activity.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete activity");
      }

      toast.success("Offline activity deleted successfully");
      loadActivities();
    } catch (err) {
      console.error("Error deleting activity:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete activity"
      );
    }
  };

  const openEditDialog = (activity: OfflineActivity) => {
    setSelectedActivity(activity);
    setCreateFormData({
      name: activity.name,
      description: activity.description || "",
      latitude: activity.latitude,
      longitude: activity.longitude,
      city: activity.city,
      district: activity.district,
      state: activity.state,
      duration: activity.duration,
      altitude: activity.altitude,
      difficulty_level: activity.difficulty_level,
      guide_required: activity.guide_required,
      cost_per_person: activity.cost_per_person,
      nearest_town: "",
      best_season: "",
      permits_required: "",
      equipment_needed: "",
      safety_tips: "",
      minimum_age: undefined,
      maximum_age: undefined,
      minimum_people: undefined,
      maximum_people: undefined,
    });
    setIsEditing(true);
    setCreateDialogOpen(true);
  };

  const filteredActivities = activities.filter(
    (activity) =>
      activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.state.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-muted-foreground">
              Loading offline activities...
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
          <CardTitle>Offline Activities Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <Select
              value={difficultyFilter}
              onValueChange={setDifficultyFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter by state..."
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full md:w-[180px]"
            />
            <Button onClick={loadActivities} variant="outline">
              Apply Filters
            </Button>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="h-screen w-screen max-w-none overflow-y-auto left-0 top-0 translate-x-0 translate-y-0 sm:rounded-none sm:max-w-none">
                <DialogHeader>
                  <DialogTitle>
                    {isEditing
                      ? "Edit Offline Activity"
                      : "Create Offline Activity"}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditing
                      ? "Update the offline activity information"
                      : "Add a new offline activity to the system"}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-8 py-4 min-h-[600px] max-w-full">
                  {/* Left Panel - Form Fields */}
                  <div className="flex-[2] space-y-4 overflow-y-auto max-h-[700px] max-w-full pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Activity Name *</Label>
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
                      <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty Level *</Label>
                        <Select
                          value={createFormData.difficulty_level}
                          onValueChange={(value: any) =>
                            setCreateFormData({
                              ...createFormData,
                              difficulty_level: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Label htmlFor="district">District *</Label>
                        <Input
                          id="district"
                          value={createFormData.district}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              district: e.target.value,
                            })
                          }
                          placeholder="Enter district"
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
                        <Label htmlFor="nearest_town">Nearest Town</Label>
                        <Input
                          id="nearest_town"
                          value={createFormData.nearest_town}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              nearest_town: e.target.value,
                            })
                          }
                          placeholder="Enter nearest town"
                        />
                      </div>
                    </div>
                    {/* Additional Information Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                      <div className="space-y-2">
                        <Label htmlFor="altitude">Altitude (meters)</Label>
                        <Input
                          id="altitude"
                          type="number"
                          value={createFormData.altitude || ""}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              altitude: parseInt(e.target.value) || undefined,
                            })
                          }
                          placeholder="Enter altitude"
                        />
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
                              cost_per_person:
                                parseFloat(e.target.value) || undefined,
                            })
                          }
                          placeholder="Enter cost per person"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="best_season">Best Season</Label>
                        <Input
                          id="best_season"
                          value={createFormData.best_season}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              best_season: e.target.value,
                            })
                          }
                          placeholder="Enter best season"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Right Panel - Location Selection */}
                  <div className="flex-[1] max-w-md border-l border-gray-200 pl-8">
                    <LocationSelector
                      latitude={createFormData.latitude}
                      longitude={createFormData.longitude}
                      onLocationChange={(lat, lng) =>
                        setCreateFormData({
                          ...createFormData,
                          latitude: lat,
                          longitude: lng,
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCreateDialogOpen(false);
                      setIsEditing(false);
                      setSelectedActivity(null);
                      resetCreateForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={
                      isEditing ? handleEditActivity : handleCreateActivity
                    }
                  >
                    {isEditing ? "Update Activity" : "Create Activity"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                  <TableHead>Location</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Guide Required</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No offline activities found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{activity.name}</div>
                          {activity.description && (
                            <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                              {activity.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {activity.city}, {activity.district}
                          </div>
                          <div className="text-muted-foreground">
                            {activity.state}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getDifficultyColor(
                            activity.difficulty_level
                          )}
                        >
                          {activity.difficulty_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {activity.duration ? `${activity.duration}h` : "N/A"}
                      </TableCell>
                      <TableCell>
                        {activity.cost_per_person
                          ? `₹${activity.cost_per_person}`
                          : "Free"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            activity.guide_required ? "default" : "secondary"
                          }
                        >
                          {activity.guide_required ? "Required" : "Optional"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(activity)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            onClick={() => handleDeleteActivity(activity)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
