"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlacesMap } from "@/components/PlacesMap";
import Navbar from "@/components/Navbar";
import { Label } from "@/components/ui/label";
import {
  Edit,
  MapPin,
  Clock,
  Star,
  Phone,
  Mail,
  Globe,
  Eye,
  EyeOff,
} from "lucide-react";

interface Place {
  id: number;
  name: string;
  description: string;
  place_type: string;
  city: string;
  state: string;
  country: string;
  address: string;
  latitude: number;
  longitude: number;
  duration_hours: number;
  entry_fee: number;
  best_season: string;
  wheelchair_accessible: boolean;
  safety_rating: number;
  contact_number: string;
  email: string;
  website: string;
  opening_time: string;
  closing_time: string;
  is_active: boolean;
  is_featured: boolean;
}

interface PlacesResponse {
  places: Place[];
  total_count: number;
  page: number;
  page_size: number;
}

const PLACE_TYPES = [
  "trek",
  "city_tour",
  "historical_site",
  "temple",
  "museum",
  "park",
  "beach",
  "hill_station",
  "adventure_sport",
  "cultural_site",
  "restaurant",
  "shopping",
  "nightlife",
  "other",
];

const NORTHEAST_STATES = [
  "Assam",
  "Arunachal Pradesh",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Sikkim",
  "Tripura",
];

const ManagePlaces = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form data for editing
  const [editForm, setEditForm] = useState<Partial<Place>>({});

  // Fetch places function
  const fetchPlaces = async (page = 1) => {
    try {
      setIsLoading(true);
      setError("");

      console.log("Fetching places for page:", page);
      console.log("Session token exists:", !!session?.accessToken);

      const response = await fetch(
        `/api/places/list?page=${page}&page_size=20`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      console.log("API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`Failed to fetch places: ${response.status}`);
      }

      const data: PlacesResponse = await response.json();
      console.log("API Response data:", data);

      setPlaces(data.places || []);
      setTotalPages(
        Math.ceil((data.total_count || 0) / (data.page_size || 20))
      );
      setCurrentPage(page);
    } catch (err) {
      console.error("Fetch places error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch places");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log(
      "useEffect triggered - session status:",
      status,
      "token exists:",
      !!session?.accessToken
    );
    if (session?.accessToken) {
      fetchPlaces();
    }
  }, [session?.accessToken]); // Only depend on the token, not the entire session object

  // Handle authentication redirects after hooks
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  // Show nothing while redirecting
  if (status === "unauthenticated") {
    return null;
  }

  // Handle place selection from map
  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
    setEditForm(place);

    // Scroll to the place in the list
    const placeElement = document.getElementById(`place-${place.id}`);
    if (placeElement) {
      placeElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  // Handle edit form changes
  const handleEditChange = (field: keyof Place, value: any) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save edited place
  const handleSaveEdit = async () => {
    if (!selectedPlace || !session?.accessToken) return;

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(`/api/places/${selectedPlace.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error("Failed to update place");
      }

      setSuccess("Place updated successfully!");
      setIsEditing(false);
      fetchPlaces(currentPage); // Refresh the list

      // Update selected place
      const updatedPlace = { ...selectedPlace, ...editForm } as Place;
      setSelectedPlace(updatedPlace);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update place");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle place active status
  const togglePlaceStatus = async (place: Place) => {
    try {
      const response = await fetch(`/api/places/${place.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ ...place, is_active: !place.is_active }),
      });

      if (!response.ok) {
        throw new Error("Failed to update place status");
      }

      fetchPlaces(currentPage);
      setSuccess(
        `Place ${!place.is_active ? "activated" : "deactivated"} successfully!`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update place status"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manage Tourist Places
          </h1>
          <p className="text-gray-600">
            View and manage all tourist destinations
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-md mb-6">
            {success}
          </div>
        )}

        {/* Map Section */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Places Map</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Regular</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span>Featured</span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="w-full h-[60vh] rounded-lg border border-gray-300 flex items-center justify-center bg-gray-50">
              <div className="text-gray-500">Loading places...</div>
            </div>
          ) : (
            <PlacesMap places={places} onPlaceClick={handlePlaceSelect} />
          )}
        </Card>

        {/* Places List and Edit Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Places List */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  All Places ({places.length})
                </h2>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => fetchPlaces(page)}
                        className="w-8 h-8"
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {places.map((place) => (
                  <div
                    key={place.id}
                    id={`place-${place.id}`}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedPlace?.id === place.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handlePlaceSelect(place)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {place.name}
                          </h3>
                          <div className="flex gap-1">
                            {place.is_featured && (
                              <Badge variant="destructive" className="text-xs">
                                Featured
                              </Badge>
                            )}
                            <Badge
                              variant={
                                place.is_active ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {place.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {place.city}, {place.state}
                            </span>
                          </div>
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {place.place_type}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {place.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{place.duration_hours}h</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            <span>{place.safety_rating}/5</span>
                          </div>
                          <span>₹{place.entry_fee}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlaceSelect(place);
                            setIsEditing(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={place.is_active ? "destructive" : "default"}
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlaceStatus(place);
                          }}
                        >
                          {place.is_active ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Edit Panel */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-4">
                {selectedPlace
                  ? `Edit: ${selectedPlace.name}`
                  : "Select a place to edit"}
              </h2>

              {selectedPlace ? (
                <div className="space-y-4">
                  {!isEditing ? (
                    // View Mode
                    <div className="space-y-3 text-sm">
                      <div>
                        <strong>Type:</strong> {selectedPlace.place_type}
                      </div>
                      <div>
                        <strong>Location:</strong> {selectedPlace.city},{" "}
                        {selectedPlace.state}
                      </div>
                      <div>
                        <strong>Coordinates:</strong>{" "}
                        {selectedPlace.latitude.toFixed(6)},{" "}
                        {selectedPlace.longitude.toFixed(6)}
                      </div>
                      <div>
                        <strong>Duration:</strong>{" "}
                        {selectedPlace.duration_hours} hours
                      </div>
                      <div>
                        <strong>Entry Fee:</strong> ₹{selectedPlace.entry_fee}
                      </div>
                      <div>
                        <strong>Safety Rating:</strong>{" "}
                        {selectedPlace.safety_rating}/5
                      </div>
                      <div>
                        <strong>Timings:</strong> {selectedPlace.opening_time} -{" "}
                        {selectedPlace.closing_time}
                      </div>
                      {selectedPlace.contact_number && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{selectedPlace.contact_number}</span>
                        </div>
                      )}
                      {selectedPlace.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{selectedPlace.email}</span>
                        </div>
                      )}
                      {selectedPlace.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <a
                            href={selectedPlace.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Website
                          </a>
                        </div>
                      )}

                      <Button
                        onClick={() => setIsEditing(true)}
                        className="w-full mt-4"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Place
                      </Button>
                    </div>
                  ) : (
                    // Edit Mode
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="basic">Basic</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="space-y-3">
                        <div>
                          <Label htmlFor="edit-name">Name</Label>
                          <Input
                            id="edit-name"
                            value={editForm.name || ""}
                            onChange={(e) =>
                              handleEditChange("name", e.target.value)
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="edit-type">Type</Label>
                          <Select
                            value={editForm.place_type || ""}
                            onValueChange={(value) =>
                              handleEditChange("place_type", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PLACE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type
                                    .replace("_", " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="edit-city">City</Label>
                            <Input
                              id="edit-city"
                              value={editForm.city || ""}
                              onChange={(e) =>
                                handleEditChange("city", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-state">State</Label>
                            <Select
                              value={editForm.state || ""}
                              onValueChange={(value) =>
                                handleEditChange("state", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {NORTHEAST_STATES.map((state) => (
                                  <SelectItem key={state} value={state}>
                                    {state}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="edit-description">Description</Label>
                          <textarea
                            id="edit-description"
                            value={editForm.description || ""}
                            onChange={(e) =>
                              handleEditChange("description", e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            rows={3}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="details" className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="edit-duration">
                              Duration (hrs)
                            </Label>
                            <Input
                              id="edit-duration"
                              type="number"
                              value={editForm.duration_hours || 0}
                              onChange={(e) =>
                                handleEditChange(
                                  "duration_hours",
                                  parseInt(e.target.value)
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-fee">Entry Fee</Label>
                            <Input
                              id="edit-fee"
                              type="number"
                              value={editForm.entry_fee || 0}
                              onChange={(e) =>
                                handleEditChange(
                                  "entry_fee",
                                  parseInt(e.target.value)
                                )
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="edit-rating">Safety Rating</Label>
                          <Select
                            value={editForm.safety_rating?.toString() || ""}
                            onValueChange={(value) =>
                              handleEditChange("safety_rating", parseInt(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <SelectItem
                                  key={rating}
                                  value={rating.toString()}
                                >
                                  {rating} Star{rating > 1 ? "s" : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="edit-open">Opening</Label>
                            <Input
                              id="edit-open"
                              type="time"
                              value={editForm.opening_time || ""}
                              onChange={(e) =>
                                handleEditChange("opening_time", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-close">Closing</Label>
                            <Input
                              id="edit-close"
                              type="time"
                              value={editForm.closing_time || ""}
                              onChange={(e) =>
                                handleEditChange("closing_time", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editForm.wheelchair_accessible || false}
                              onChange={(e) =>
                                handleEditChange(
                                  "wheelchair_accessible",
                                  e.target.checked
                                )
                              }
                            />
                            <span>Wheelchair Accessible</span>
                          </label>

                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editForm.is_featured || false}
                              onChange={(e) =>
                                handleEditChange(
                                  "is_featured",
                                  e.target.checked
                                )
                              }
                            />
                            <span>Featured</span>
                          </label>
                        </div>
                      </TabsContent>
                    </Tabs>
                  )}

                  {isEditing && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        className="flex-1"
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm(selectedPlace);
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p>
                    Click on a place marker or list item to view and edit
                    details
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagePlaces;
