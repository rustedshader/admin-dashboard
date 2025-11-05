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
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Clock,
  MapPin,
  DollarSign,
} from "lucide-react";

type OnlineActivityType =
  | "historical_site"
  | "temple"
  | "museum"
  | "park"
  | "adventure_sport"
  | "cultural_site"
  | "restaurant"
  | "shopping"
  | "nightlife";

interface OnlineActivity {
  id: number;
  name: string;
  description?: string;
  place_type: OnlineActivityType;
  city: string;
  state: string;
  address?: string;
  latitude: number;
  longitude: number;
  cost_per_person?: number;
  wheelchair_accessible: boolean;
  safety_rating?: number;
  contact_number?: string;
  email?: string;
  website?: string;
  opening_time?: string;
  closing_time?: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface CreateActivityData {
  name: string;
  description?: string;
  place_type: OnlineActivityType;
  city: string;
  state: string;
  address?: string;
  latitude: number;
  longitude: number;
  cost_per_person?: number;
  wheelchair_accessible: boolean;
  safety_rating?: number;
  contact_number?: string;
  email?: string;
  website?: string;
  opening_time?: string;
  closing_time?: string;
}

interface OnlineActivitiesResponse {
  online_activities: OnlineActivity[];
  total_count: number;
  page: number;
  page_size: number;
}

export function OnlineActivitiesManagement() {
  const [activities, setActivities] = useState<OnlineActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [placeTypeFilter, setPlaceTypeFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<OnlineActivity | null>(null);
  const [createFormData, setCreateFormData] = useState<CreateActivityData>({
    name: "",
    description: "",
    place_type: "historical_site",
    city: "",
    state: "",
    address: "",
    latitude: 0,
    longitude: 0,
    cost_per_person: undefined,
    wheelchair_accessible: false,
    safety_rating: undefined,
    contact_number: "",
    email: "",
    website: "",
    opening_time: "",
    closing_time: "",
  });

  const { authenticatedFetch } = useAuthenticatedFetch();

  useEffect(() => {
    loadActivities();
  }, [currentPage, placeTypeFilter, stateFilter, cityFilter]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("page_size", "20");
      if (placeTypeFilter && placeTypeFilter !== "all")
        params.append("place_type", placeTypeFilter);
      if (stateFilter) params.append("state", stateFilter);
      if (cityFilter) params.append("city", cityFilter);

      const response = await authenticatedFetch(
        `/api/activities/online?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch online activities");
      }
      const data: OnlineActivitiesResponse = await response.json();
      setActivities(data.online_activities || []);
      setTotalCount(data.total_count || 0);
    } catch (err) {
      console.error("Error loading activities:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load activities"
      );
      toast.error("Failed to load online activities");
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
        !createFormData.state
      ) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (createFormData.latitude === 0 || createFormData.longitude === 0) {
        toast.error("Please provide valid coordinates");
        return;
      }

      const url =
        isEditing && selectedActivity
          ? `/api/activities/online/${selectedActivity.id}`
          : "/api/activities/online";

      const method = isEditing ? "PUT" : "POST";

      const response = await authenticatedFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to ${isEditing ? "update" : "create"} activity`
        );
      }

      toast.success(
        `Online activity ${isEditing ? "updated" : "created"} successfully`
      );
      setCreateDialogOpen(false);
      resetCreateForm();
      loadActivities();
    } catch (err) {
      console.error(
        `Error ${isEditing ? "updating" : "creating"} activity:`,
        err
      );
      toast.error(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditing ? "update" : "create"} activity`
      );
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete activity");
      }

      toast.success("Online activity deleted successfully");
      loadActivities();
    } catch (err) {
      console.error("Error deleting activity:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete activity"
      );
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      name: "",
      description: "",
      place_type: "historical_site",
      city: "",
      state: "",
      address: "",
      latitude: 0,
      longitude: 0,
      cost_per_person: undefined,
      wheelchair_accessible: false,
      safety_rating: undefined,
      contact_number: "",
      email: "",
      website: "",
      opening_time: "",
      closing_time: "",
    });
    setIsEditing(false);
    setSelectedActivity(null);
  };

  const handleEditActivity = (activity: OnlineActivity) => {
    setCreateFormData({
      name: activity.name,
      description: activity.description || "",
      place_type: activity.place_type,
      city: activity.city,
      state: activity.state,
      address: activity.address || "",
      latitude: activity.latitude,
      longitude: activity.longitude,
      cost_per_person: activity.cost_per_person,
      wheelchair_accessible: activity.wheelchair_accessible,
      safety_rating: activity.safety_rating,
      contact_number: activity.contact_number || "",
      email: activity.email || "",
      website: activity.website || "",
      opening_time: activity.opening_time || "",
      closing_time: activity.closing_time || "",
    });
    setSelectedActivity(activity);
    setIsEditing(true);
    setCreateDialogOpen(true);
  };

  const filteredActivities = activities.filter(
    (activity) =>
      activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlaceTypeColor = (placeType: string) => {
    const colors: Record<string, string> = {
      historical_site: "bg-blue-100 text-blue-800",
      temple: "bg-purple-100 text-purple-800",
      museum: "bg-green-100 text-green-800",
      park: "bg-emerald-100 text-emerald-800",
      adventure_sport: "bg-red-100 text-red-800",
      cultural_site: "bg-orange-100 text-orange-800",
      restaurant: "bg-yellow-100 text-yellow-800",
      shopping: "bg-pink-100 text-pink-800",
      nightlife: "bg-indigo-100 text-indigo-800",
    };
    return colors[placeType] || "bg-gray-100 text-gray-800";
  };

  const formatPlaceType = (placeType: string) => {
    return placeType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-muted-foreground">
              Loading online activities...
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
          <CardTitle>Online Activities Management</CardTitle>
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
            <Select value={placeTypeFilter} onValueChange={setPlaceTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="historical_site">Historical Site</SelectItem>
                <SelectItem value="temple">Temple</SelectItem>
                <SelectItem value="museum">Museum</SelectItem>
                <SelectItem value="park">Park</SelectItem>
                <SelectItem value="adventure_sport">Adventure Sport</SelectItem>
                <SelectItem value="cultural_site">Cultural Site</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="shopping">Shopping</SelectItem>
                <SelectItem value="nightlife">Nightlife</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter by state..."
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full md:w-[180px]"
            />
            <Input
              placeholder="Filter by city..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
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
                      ? "Edit Online Activity"
                      : "Create Online Activity"}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditing
                      ? "Update the online activity information"
                      : "Add a new online activity to the system"}
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
                        <Label htmlFor="place_type">Place Type *</Label>
                        <Select
                          value={createFormData.place_type}
                          onValueChange={(value: OnlineActivityType) =>
                            setCreateFormData({
                              ...createFormData,
                              place_type: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="historical_site">
                              Historical Site
                            </SelectItem>
                            <SelectItem value="temple">Temple</SelectItem>
                            <SelectItem value="museum">Museum</SelectItem>
                            <SelectItem value="park">Park</SelectItem>
                            <SelectItem value="adventure_sport">
                              Adventure Sport
                            </SelectItem>
                            <SelectItem value="cultural_site">
                              Cultural Site
                            </SelectItem>
                            <SelectItem value="restaurant">
                              Restaurant
                            </SelectItem>
                            <SelectItem value="shopping">Shopping</SelectItem>
                            <SelectItem value="nightlife">Nightlife</SelectItem>
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
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={createFormData.address}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              address: e.target.value,
                            })
                          }
                          placeholder="Enter full address"
                        />
                      </div>
                    </div>

                    {/* Additional Information Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                        <Label htmlFor="safety_rating">
                          Safety Rating (1-5)
                        </Label>
                        <Select
                          value={createFormData.safety_rating?.toString() || ""}
                          onValueChange={(value) =>
                            setCreateFormData({
                              ...createFormData,
                              safety_rating: value
                                ? parseInt(value)
                                : undefined,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Very Low</SelectItem>
                            <SelectItem value="2">2 - Low</SelectItem>
                            <SelectItem value="3">3 - Medium</SelectItem>
                            <SelectItem value="4">4 - High</SelectItem>
                            <SelectItem value="5">5 - Very High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="opening_time">Opening Time</Label>
                        <Input
                          id="opening_time"
                          type="time"
                          value={createFormData.opening_time}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              opening_time: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="closing_time">Closing Time</Label>
                        <Input
                          id="closing_time"
                          type="time"
                          value={createFormData.closing_time}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              closing_time: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_number">Contact Number</Label>
                        <Input
                          id="contact_number"
                          value={createFormData.contact_number}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              contact_number: e.target.value,
                            })
                          }
                          placeholder="Enter contact number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={createFormData.email}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              email: e.target.value,
                            })
                          }
                          placeholder="Enter email address"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          value={createFormData.website}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              website: e.target.value,
                            })
                          }
                          placeholder="Enter website URL"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="wheelchair_accessible"
                            checked={createFormData.wheelchair_accessible}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                wheelchair_accessible: e.target.checked,
                              })
                            }
                          />
                          <Label htmlFor="wheelchair_accessible">
                            Wheelchair Accessible
                          </Label>
                        </div>
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
                      resetCreateForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateActivity}>
                    {isEditing ? "Update Activity" : "Create Activity"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {error && (
            <div className="text-red-600 bg-red-50 p-3 rounded-md mb-4">
              {error}
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
                  <TableHead>Hours</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No online activities found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{activity.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {activity.description?.slice(0, 50)}
                            {activity.description &&
                              activity.description.length > 50 &&
                              "..."}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getPlaceTypeColor(activity.place_type)}
                        >
                          {formatPlaceType(activity.place_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">
                            {activity.city}, {activity.state}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.cost_per_person ? (
                          <div className="flex items-center space-x-1">
                            <span className="text-sm">
                              ₹{activity.cost_per_person}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Free
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity.opening_time && activity.closing_time ? (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">
                              {activity.opening_time} - {activity.closing_time}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            24/7
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {activity.contact_number && (
                            <div>{activity.contact_number}</div>
                          )}
                          {activity.email && (
                            <div className="text-muted-foreground">
                              {activity.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={activity.is_active ? "default" : "secondary"}
                        >
                          {activity.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditActivity(activity)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteActivity(activity.id)}
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

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredActivities.length} of {totalCount} activities
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={filteredActivities.length < 20}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
