"use client";

import { useState, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapComponent } from "@/components/MapComponent";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Added for consistent styling
import { toast } from "sonner";

interface PlaceFormData {
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
  is_featured: boolean;
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

const SAFETY_RATINGS = [1, 2, 3, 4, 5];

const AddTouristPlace = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const initialFormData: PlaceFormData = {
    name: "",
    description: "",
    place_type: "",
    city: "",
    state: "",
    country: "India",
    address: "",
    latitude: 0,
    longitude: 0,
    duration_hours: 2,
    entry_fee: 0,
    best_season: "",
    wheelchair_accessible: false,
    safety_rating: 4,
    contact_number: "",
    email: "",
    website: "",
    opening_time: "09:00",
    closing_time: "18:00",
    is_featured: false,
  };

  const [formData, setFormData] = useState<PlaceFormData>(initialFormData);

  // Basic validation functions
  const validateForm = useCallback(() => {
    if (!formData.name.trim()) return "Place name is required";
    if (!formData.description.trim()) return "Description is required";
    if (!formData.place_type) return "Place type is required";
    if (!formData.city.trim()) return "City is required";
    if (!formData.state) return "State is required";
    if (!formData.address.trim()) return "Address is required";
    if (!selectedCoordinates) return "Please select coordinates on the map";
    if (formData.entry_fee < 0) return "Entry fee cannot be negative";
    if (formData.duration_hours <= 0) return "Duration must be greater than 0";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return "Invalid email format";
    if (
      formData.contact_number &&
      !/^\+?\d{10,15}$/.test(formData.contact_number)
    )
      return "Invalid contact number format";
    if (
      formData.website &&
      !/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/.test(
        formData.website
      )
    )
      return "Invalid website URL";
    if (
      formData.opening_time &&
      formData.closing_time &&
      formData.opening_time >= formData.closing_time
    )
      return "Closing time must be after opening time";
    return "";
  }, [formData, selectedCoordinates]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? value === ""
            ? 0
            : parseFloat(value)
          : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === "safety_rating" ? parseInt(value) : value,
    }));
  };

  const handleCoordinateSelect = useCallback((lat: number, lng: number) => {
    setSelectedCoordinates({ lat, lng });
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError, {
        description: "Validation Error",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!session?.accessToken) {
        throw new Error("You must be logged in to add a place");
      }

      const response = await fetch("/api/places/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(formData),
        credentials: "include", // Add for CSRF protection if needed
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create place");
      }

      setSuccess("Tourist place added successfully!");
      toast("Tourist place added successfully!");

      // Optional: Don't reset form immediately, allow user to add another
      setFormData(initialFormData);
      setSelectedCoordinates(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage, {
        description: "Error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Add Tourist Place
            </h1>
            <p className="text-gray-600">
              Add a new tourist destination to the Northeast India collection
            </p>
          </div>

          {(error || success) && (
            <div
              className={`border p-4 rounded-md mb-6 ${
                error
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "bg-green-50 border-green-300 text-green-700"
              }`}
            >
              {error || success}
            </div>
          )}

          {/* Map Section */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Select Location</h2>
              {selectedCoordinates && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Selected:</span>{" "}
                  {selectedCoordinates.lat.toFixed(6)},{" "}
                  {selectedCoordinates.lng.toFixed(6)}
                </div>
              )}
            </div>
            <p className="text-gray-600 mb-4">
              Click on the map to select the exact coordinates for this tourist
              place
            </p>
            <div className="h-[60vh] rounded-lg border border-gray-300 overflow-hidden">
              <MapComponent
                onCoordinateSelect={handleCoordinateSelect}
                selectedCoordinates={selectedCoordinates}
              />
            </div>
          </Card>

          {/* Form Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Place Information</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Label htmlFor="name">Place Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter place name"
                        aria-describedby="name-error"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        name="description"
                        required
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Enter place description"
                        className="min-h-[100px]"
                        aria-describedby="description-error"
                      />
                    </div>
                    <div>
                      <Label htmlFor="place_type">Place Type *</Label>
                      <Select
                        onValueChange={(value) =>
                          handleSelectChange("place_type", value)
                        }
                        value={formData.place_type}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select place type" />
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
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Select
                        onValueChange={(value) =>
                          handleSelectChange("state", value)
                        }
                        value={formData.state}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
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
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter complete address"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="duration_hours">Duration (Hours)</Label>
                      <Input
                        id="duration_hours"
                        name="duration_hours"
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={formData.duration_hours}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="entry_fee">Entry Fee (₹)</Label>
                      <Input
                        id="entry_fee"
                        name="entry_fee"
                        type="number"
                        min="0"
                        value={formData.entry_fee}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="safety_rating">Safety Rating</Label>
                      <Select
                        onValueChange={(value) =>
                          handleSelectChange("safety_rating", value)
                        }
                        value={formData.safety_rating.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select safety rating" />
                        </SelectTrigger>
                        <SelectContent>
                          {SAFETY_RATINGS.map((rating) => (
                            <SelectItem key={rating} value={rating.toString()}>
                              {rating} Star{rating > 1 ? "s" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="best_season">Best Season</Label>
                      <Input
                        id="best_season"
                        name="best_season"
                        value={formData.best_season}
                        onChange={handleInputChange}
                        placeholder="e.g., October to April"
                      />
                    </div>
                    <div>
                      <Label htmlFor="opening_time">Opening Time</Label>
                      <Input
                        id="opening_time"
                        name="opening_time"
                        type="time"
                        value={formData.opening_time}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="closing_time">Closing Time</Label>
                      <Input
                        id="closing_time"
                        name="closing_time"
                        type="time"
                        value={formData.closing_time}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="wheelchair_accessible"
                        name="wheelchair_accessible"
                        checked={formData.wheelchair_accessible}
                        onChange={handleInputChange}
                        className="rounded"
                      />
                      <Label htmlFor="wheelchair_accessible">
                        Wheelchair Accessible
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_featured"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleInputChange}
                        className="rounded"
                      />
                      <Label htmlFor="is_featured">Featured Place</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="contact_number">Contact Number</Label>
                      <Input
                        id="contact_number"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleInputChange}
                        placeholder="+91-XXX-XXX-XXXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="contact@example.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        type="url"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h3 className="font-medium text-blue-800 mb-2">
                      Coordinates
                    </h3>
                    {selectedCoordinates ? (
                      <p className="text-sm text-blue-700">
                        Selected: {selectedCoordinates.lat.toFixed(6)},{" "}
                        {selectedCoordinates.lng.toFixed(6)}
                      </p>
                    ) : (
                      <p className="text-sm text-blue-700">
                        Please select coordinates on the map
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                type="submit"
                className="w-full bg-[#2A777C] hover:bg-[#236368]"
                disabled={isLoading || !!validateForm()}
              >
                {isLoading ? "Adding Place..." : "Add Tourist Place"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddTouristPlace;
