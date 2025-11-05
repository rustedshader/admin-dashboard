"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuthenticatedFetch } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MapPin, Save, RotateCcw, Shield, AlertCircle } from "lucide-react";
import GeofencingMapWrapper from "@/components/GeofencingMapWrapper";

interface Coordinate {
  lat: number;
  lng: number;
}

interface AreaType {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

// Define area types based on backend enum
const AREA_TYPES = [
  {
    id: "restricted_zone",
    name: "Restricted Zone",
    description: "General restricted access area",
    color: "#ff4444",
    icon: "🚫",
  },
  {
    id: "danger_zone",
    name: "Danger Zone",
    description: "Hazardous area with potential dangers",
    color: "#ff8800",
    icon: "⚠️",
  },
  {
    id: "private_property",
    name: "Private Property",
    description: "Private property with restricted access",
    color: "#8844ff",
    icon: "🏠",
  },
  {
    id: "protected_area",
    name: "Protected Area",
    description: "Environmentally protected zone",
    color: "#44ff44",
    icon: "🌿",
  },
  {
    id: "military_zone",
    name: "Military Zone",
    description: "Military restricted area",
    color: "#444444",
    icon: "🎖️",
  },
  {
    id: "seasonal_closure",
    name: "Seasonal Closure",
    description: "Area closed during specific seasons",
    color: "#4488ff",
    icon: "🗓️",
  },
];

interface GeofencingFormData {
  name: string;
  description: string;
  area_type_id: string;
  coordinates: Coordinate[];
  status: "active" | "inactive";
}

export default function AddGeofencingPage() {
  const router = useRouter();
  const { authenticatedFetch } = useAuthenticatedFetch();

  const [loading, setLoading] = useState(false);

  const initialFormData: GeofencingFormData = {
    name: "",
    description: "",
    area_type_id: "",
    coordinates: [],
    status: "active",
  };

  const [formData, setFormData] = useState<GeofencingFormData>(initialFormData);

  // Form validation
  const validateForm = useCallback(() => {
    if (!formData.name.trim()) return "Area name is required";
    if (!formData.description.trim()) return "Description is required";
    if (!formData.area_type_id) return "Area type is required";
    if (formData.coordinates.length < 3)
      return "Please draw a polygon with at least 3 points on the map";
    return "";
  }, [formData]);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle polygon creation from map
  const handlePolygonCreated = (coordinates: Coordinate[]) => {
    setFormData((prev) => ({
      ...prev,
      coordinates,
    }));
  };

  // Reset form
  const handleReset = () => {
    setFormData(initialFormData);
    toast.info("Form reset successfully");
  };

  // Submit form
  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      // Transform the data to match backend API expectations
      const apiPayload = {
        name: formData.name,
        description: formData.description,
        area_type: formData.area_type_id, // Backend expects 'area_type' not 'area_type_id'
        boundary_coordinates: formData.coordinates.map((coord) => ({
          latitude: Number(coord.lat), // Backend expects object with latitude/longitude
          longitude: Number(coord.lng),
        })),
        status: formData.status,
      };

      // Debug: Log the exact payload being sent
      console.log("API Payload:", JSON.stringify(apiPayload, null, 2));

      const response = await authenticatedFetch(
        "/api/geofencing/restricted-areas",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiPayload),
        }
      );

      if (response.ok) {
        toast.success("Restricted area created successfully!");
        router.push("/geofencing");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create restricted area");
      }
    } catch (error) {
      console.error("Error creating area:", error);
      toast.error("Failed to create restricted area");
    } finally {
      setLoading(false);
    }
  };

  const getAreaTypeName = (areaTypeId: string) => {
    const type = AREA_TYPES.find((t) => t.id === areaTypeId);
    return type?.name || "Unknown";
  };

  const getAreaTypeColor = (areaTypeId: string) => {
    const type = AREA_TYPES.find((t) => t.id === areaTypeId);
    return type?.color || "#3388ff";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Add Restricted Area
                </h1>
                <p className="text-gray-600 mt-1">
                  Create a new geofenced restricted area
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  loading || !formData.name || formData.coordinates.length < 3
                }
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Creating..." : "Create Area"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Map Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Draw Restricted Area</span>
                {formData.coordinates.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {formData.coordinates.length} points
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600">
                Use the drawing tools to create a polygon that defines your
                restricted area. Click the polygon tool in the top-right and
                draw your boundary.
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] border rounded-lg overflow-hidden">
                <GeofencingMapWrapper
                  mode="create"
                  onPolygonCreated={handlePolygonCreated}
                  existingAreas={[]}
                  center={[30.3165, 78.0322]} // Dehradun, Uttarakhand
                  zoom={12}
                />
              </div>
              {formData.coordinates.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700 font-medium">
                      Polygon drawn successfully with{" "}
                      {formData.coordinates.length} coordinate points
                    </span>
                  </div>
                </div>
              )}
              {formData.coordinates.length > 0 &&
                formData.coordinates.length < 3 && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-orange-700 font-medium">
                        Please add more points. A polygon needs at least 3
                        points.
                      </span>
                    </div>
                  </div>
                )}

              {/* Coordinates Display */}
              {formData.coordinates.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">
                    Polygon Coordinates
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                    {formData.coordinates.map((coord, index) => (
                      <div
                        key={index}
                        className="bg-white p-2 rounded border text-xs"
                      >
                        <div className="font-medium text-blue-800">
                          Point {index + 1}
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium">Lat:</span>{" "}
                          {coord.lat.toFixed(6)}
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium">Lng:</span>{" "}
                          {coord.lng.toFixed(6)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-blue-700">
                    Total coordinates: {formData.coordinates.length}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Basic Information */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Area Details</CardTitle>
                  <p className="text-sm text-gray-600">
                    Provide basic information about the restricted area
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="name">Area Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter restricted area name"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="area_type_id">Area Type *</Label>
                      <Select
                        value={formData.area_type_id}
                        onValueChange={(value) =>
                          handleSelectChange("area_type_id", value)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select area type" />
                        </SelectTrigger>
                        <SelectContent>
                          {AREA_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{type.icon}</span>
                                <div
                                  className="w-3 h-3 rounded-full border"
                                  style={{ backgroundColor: type.color }}
                                />
                                <span>{type.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          handleSelectChange(
                            "status",
                            value as "active" | "inactive"
                          )
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">
                            <div className="flex items-center space-x-2">
                              <Shield className="w-4 h-4 text-green-600" />
                              <span>Active</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="inactive">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                              <span>Inactive</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe the purpose and scope of this restricted area..."
                        rows={4}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Panel */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Area Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">Name</Label>
                    <p className="font-medium">
                      {formData.name || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Type</Label>
                    <div className="flex items-center space-x-2">
                      {formData.area_type_id && (
                        <>
                          <span className="text-sm">
                            {
                              AREA_TYPES.find(
                                (t) => t.id === formData.area_type_id
                              )?.icon
                            }
                          </span>
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{
                              backgroundColor: getAreaTypeColor(
                                formData.area_type_id
                              ),
                            }}
                          />
                        </>
                      )}
                      <span className="font-medium">
                        {formData.area_type_id
                          ? getAreaTypeName(formData.area_type_id)
                          : "Not selected"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Status</Label>
                    <div className="flex items-center space-x-2">
                      {formData.status === "active" ? (
                        <Shield className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                      )}
                      <span className="font-medium capitalize">
                        {formData.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">
                      Polygon Points
                    </Label>
                    <p className="font-medium">
                      {formData.coordinates.length > 0
                        ? `${formData.coordinates.length} coordinates`
                        : "No polygon drawn"}
                    </p>
                    {formData.coordinates.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 space-y-1 max-h-20 overflow-y-auto">
                        {formData.coordinates
                          .slice(0, 4)
                          .map((coord, index) => (
                            <div key={index}>
                              Point {index + 1}: {coord.lat.toFixed(4)},{" "}
                              {coord.lng.toFixed(4)}
                            </div>
                          ))}
                        {formData.coordinates.length > 4 && (
                          <div className="text-blue-600">
                            ... and {formData.coordinates.length - 4} more
                            points
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Description</Label>
                    <p className="text-sm">
                      {formData.description || "No description provided"}
                    </p>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-6 pt-4 border-t">
                    <Label className="text-sm text-gray-600 mb-2 block">
                      Completion Progress
                    </Label>
                    <div className="space-y-2">
                      <div
                        className={`flex items-center space-x-2 text-sm ${
                          formData.name ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            formData.name ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                        <span>Area name</span>
                      </div>
                      <div
                        className={`flex items-center space-x-2 text-sm ${
                          formData.area_type_id
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            formData.area_type_id
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        />
                        <span>Area type</span>
                      </div>
                      <div
                        className={`flex items-center space-x-2 text-sm ${
                          formData.description
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            formData.description
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        />
                        <span>Description</span>
                      </div>
                      <div
                        className={`flex items-center space-x-2 text-sm ${
                          formData.coordinates.length >= 3
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            formData.coordinates.length >= 3
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        />
                        <span>Map polygon</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
