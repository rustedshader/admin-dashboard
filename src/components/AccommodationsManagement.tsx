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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LocationSelector } from "@/components/LocationSelector";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, MapPin, Phone, Mail } from "lucide-react";

interface Accommodation {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number;
  longitude: number;
}

interface CreateAccommodationData {
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number;
  longitude: number;
}

interface AccommodationsResponse {
  accommodations: Accommodation[];
  total_count: number;
  page: number;
  page_size: number;
}

interface AccommodationDataResponse {
  success: boolean;
  data: AccommodationsResponse;
  message: string;
}

export function AccommodationsManagement() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] =
    useState<Accommodation | null>(null);
  const [createFormData, setCreateFormData] = useState<CreateAccommodationData>(
    {
      name: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      latitude: 0,
      longitude: 0,
    }
  );

  const { authenticatedFetch } = useAuthenticatedFetch();

  useEffect(() => {
    loadAccommodations();
  }, [currentPage, stateFilter, cityFilter]);

  const loadAccommodations = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("page_size", "20");
      if (stateFilter) params.append("state", stateFilter);
      if (cityFilter) params.append("city", cityFilter);

      const response = await authenticatedFetch(
        `/api/accommodations?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch accommodations");
      }
      const data: AccommodationDataResponse = await response.json();
      setAccommodations(data.data.accommodations || []);
      setTotalCount(data.data.total_count || 0);
    } catch (err) {
      console.error("Error loading accommodations:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load accommodations"
      );
      toast.error("Failed to load accommodations");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccommodation = async () => {
    try {
      // Validate required fields
      if (
        !createFormData.name ||
        !createFormData.address ||
        !createFormData.city ||
        !createFormData.state ||
        !createFormData.postal_code
      ) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (createFormData.latitude === 0 || createFormData.longitude === 0) {
        toast.error("Please provide valid coordinates");
        return;
      }

      const url =
        isEditing && selectedAccommodation
          ? `/api/accommodations/${selectedAccommodation.id}`
          : "/api/accommodations";

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
            `Failed to ${isEditing ? "update" : "create"} accommodation`
        );
      }

      toast.success(
        `Accommodation ${isEditing ? "updated" : "created"} successfully`
      );
      setCreateDialogOpen(false);
      resetCreateForm();
      loadAccommodations();
    } catch (err) {
      console.error(
        `Error ${isEditing ? "updating" : "creating"} accommodation:`,
        err
      );
      toast.error(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditing ? "update" : "create"} accommodation`
      );
    }
  };

  const handleDeleteAccommodation = async (accommodationId: number) => {
    if (!confirm("Are you sure you want to delete this accommodation?")) {
      return;
    }

    try {
      const response = await authenticatedFetch(
        `/api/accommodations/${accommodationId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete accommodation");
      }

      toast.success("Accommodation deleted successfully");
      loadAccommodations();
    } catch (err) {
      console.error("Error deleting accommodation:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete accommodation"
      );
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      latitude: 0,
      longitude: 0,
    });
    setIsEditing(false);
    setSelectedAccommodation(null);
  };

  const handleEditAccommodation = (accommodation: Accommodation) => {
    setCreateFormData({
      name: accommodation.name,
      address: accommodation.address,
      city: accommodation.city,
      state: accommodation.state,
      postal_code: accommodation.postal_code,
      latitude: accommodation.latitude,
      longitude: accommodation.longitude,
    });
    setSelectedAccommodation(accommodation);
    setIsEditing(true);
    setCreateDialogOpen(true);
  };

  const filteredAccommodations = accommodations.filter(
    (accommodation) =>
      accommodation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accommodation.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accommodation.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accommodation.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-muted-foreground">
              Loading accommodations...
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
          <CardTitle>Accommodations Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search accommodations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
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
            <Button onClick={loadAccommodations} variant="outline">
              Apply Filters
            </Button>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Accommodation
                </Button>
              </DialogTrigger>
              <DialogContent className="h-screen w-screen max-w-none overflow-y-auto left-0 top-0 translate-x-0 translate-y-0 sm:rounded-none sm:max-w-none">
                <DialogHeader>
                  <DialogTitle>
                    {isEditing ? "Edit Accommodation" : "Create Accommodation"}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditing
                      ? "Update the accommodation information"
                      : "Add a new accommodation to the system"}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-8 py-4 min-h-[600px] max-w-full">
                  {/* Left Panel - Form Fields */}
                  <div className="flex-[2] space-y-4 overflow-y-auto max-h-[700px] max-w-full pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="name">Accommodation Name *</Label>
                        <Input
                          id="name"
                          value={createFormData.name}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter accommodation name"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Address *</Label>
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
                        <Label htmlFor="postal_code">Postal Code *</Label>
                        <Input
                          id="postal_code"
                          value={createFormData.postal_code}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              postal_code: e.target.value,
                            })
                          }
                          placeholder="Enter postal code"
                        />
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-medium mb-2">
                        Location Coordinates
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
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
                                latitude: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0.000000"
                            readOnly
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
                                longitude: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0.000000"
                            readOnly
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Use the map on the right to select the exact location
                      </p>
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
                  <Button onClick={handleCreateAccommodation}>
                    {isEditing
                      ? "Update Accommodation"
                      : "Create Accommodation"}
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
                  <TableHead>Location</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Postal Code</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccommodations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No accommodations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccommodations.map((accommodation) => (
                    <TableRow key={accommodation.id}>
                      <TableCell>
                        <div className="font-medium">{accommodation.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">
                            {accommodation.city}, {accommodation.state}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="text-sm max-w-[200px] truncate"
                          title={accommodation.address}
                        >
                          {accommodation.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {accommodation.postal_code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          <div>{accommodation.latitude.toFixed(6)}</div>
                          <div>{accommodation.longitude.toFixed(6)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleEditAccommodation(accommodation)
                            }
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDeleteAccommodation(accommodation.id)
                            }
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
              Showing {filteredAccommodations.length} of {totalCount}{" "}
              accommodations
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
                disabled={filteredAccommodations.length < 20}
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
