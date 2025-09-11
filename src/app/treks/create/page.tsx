"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Mountain,
  ArrowLeft,
  Save,
  MapPin,
  Clock,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useAuthenticatedFetch } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TrekFormData {
  name: string;
  description: string;
  location: string;
  city: string;
  district: string;
  state: string;
  duration: number;
  altitude?: number;
  nearest_town: string;
  start_latitude?: number;
  start_longitude?: number;
  best_season: string;
  permits_required: string;
  equipment_needed: string;
  safety_tips: string;
  minimum_age?: number;
  maximum_age?: number;
  guide_required: boolean;
  minimum_people?: number;
  maximum_people?: number;
  cost_per_person?: number;
  difficulty_level: "easy" | "medium" | "hard";
}

const CreateTrekPage = () => {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<TrekFormData>({
    name: "",
    description: "",
    location: "",
    city: "",
    district: "",
    state: "",
    duration: 1,
    altitude: undefined,
    nearest_town: "",
    start_latitude: undefined,
    start_longitude: undefined,
    best_season: "",
    permits_required: "",
    equipment_needed: "",
    safety_tips: "",
    minimum_age: undefined,
    maximum_age: undefined,
    guide_required: false,
    minimum_people: undefined,
    maximum_people: undefined,
    cost_per_person: undefined,
    difficulty_level: "easy",
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Trek name is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.district.trim()) newErrors.district = "District is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (formData.duration < 1)
      newErrors.duration = "Duration must be at least 1 day";

    if (
      formData.start_latitude &&
      (formData.start_latitude < -90 || formData.start_latitude > 90)
    ) {
      newErrors.start_latitude = "Latitude must be between -90 and 90";
    }

    if (
      formData.start_longitude &&
      (formData.start_longitude < -180 || formData.start_longitude > 180)
    ) {
      newErrors.start_longitude = "Longitude must be between -180 and 180";
    }

    if (
      formData.minimum_age &&
      formData.maximum_age &&
      formData.minimum_age > formData.maximum_age
    ) {
      newErrors.maximum_age = "Maximum age must be greater than minimum age";
    }

    if (
      formData.minimum_people &&
      formData.maximum_people &&
      formData.minimum_people > formData.maximum_people
    ) {
      newErrors.maximum_people =
        "Maximum people must be greater than minimum people";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Clean the data - remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      );

      const response = await authenticatedFetch("/api/trek/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanData),
      });

      if (response.ok) {
        router.push("/treks");
      } else {
        const errorData = await response.json();
        console.error("Error creating trek:", errorData);
      }
    } catch (error) {
      console.error("Error creating trek:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? value === ""
            ? undefined
            : Number(value)
          : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const FormField = ({
    name,
    label,
    type = "text",
    required = false,
    placeholder,
    description,
  }: {
    name: keyof TrekFormData;
    label: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
    description?: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {type === "textarea" ? (
        <Textarea
          id={name}
          name={name}
          value={
            typeof formData[name] === "boolean" ? "" : formData[name] || ""
          }
          onChange={handleInputChange}
          placeholder={placeholder}
          className={errors[name] ? "border-red-500" : ""}
        />
      ) : type === "select" ? (
        <select
          id={name}
          name={name}
          value={
            typeof formData[name] === "boolean" ? "" : formData[name] || ""
          }
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md ${
            errors[name] ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">Select...</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      ) : type === "checkbox" ? (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={name}
            name={name}
            checked={formData[name] as boolean}
            onChange={handleInputChange}
            className="rounded"
          />
          <Label htmlFor={name} className="text-sm font-normal">
            {description}
          </Label>
        </div>
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          value={
            typeof formData[name] === "boolean" ? "" : formData[name] || ""
          }
          onChange={handleInputChange}
          placeholder={placeholder}
          className={errors[name] ? "border-red-500" : ""}
        />
      )}
      {description && type !== "checkbox" && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {errors[name] && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/treks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Treks
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mountain className="w-8 h-8" />
              Create New Trek
            </h1>
            <p className="text-muted-foreground">
              Add a new trek to the database
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    name="name"
                    label="Trek Name"
                    required
                    placeholder="Enter trek name"
                  />

                  <FormField
                    name="description"
                    label="Description"
                    type="textarea"
                    placeholder="Describe the trek..."
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      name="location"
                      label="Location"
                      required
                      placeholder="e.g., Kedarnath"
                    />

                    <FormField
                      name="city"
                      label="City"
                      required
                      placeholder="e.g., Rudraprayag"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      name="district"
                      label="District"
                      required
                      placeholder="e.g., Rudraprayag"
                    />

                    <FormField
                      name="state"
                      label="State"
                      required
                      placeholder="e.g., Uttarakhand"
                    />
                  </div>

                  <FormField
                    name="nearest_town"
                    label="Nearest Town"
                    placeholder="e.g., Gaurikund"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Trek Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      name="duration"
                      label="Duration (days)"
                      type="number"
                      required
                      placeholder="1"
                    />

                    <FormField
                      name="altitude"
                      label="Altitude (meters)"
                      type="number"
                      placeholder="3583"
                    />

                    <FormField
                      name="difficulty_level"
                      label="Difficulty Level"
                      type="select"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      name="start_latitude"
                      label="Start Latitude"
                      type="number"
                      placeholder="30.7346"
                      description="Decimal degrees (-90 to 90)"
                    />

                    <FormField
                      name="start_longitude"
                      label="Start Longitude"
                      type="number"
                      placeholder="79.0669"
                      description="Decimal degrees (-180 to 180)"
                    />
                  </div>

                  <FormField
                    name="best_season"
                    label="Best Season"
                    placeholder="e.g., May to June, September to October"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Group & Age Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      name="minimum_age"
                      label="Minimum Age"
                      type="number"
                      placeholder="18"
                    />

                    <FormField
                      name="maximum_age"
                      label="Maximum Age"
                      type="number"
                      placeholder="60"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      name="minimum_people"
                      label="Minimum People"
                      type="number"
                      placeholder="2"
                    />

                    <FormField
                      name="maximum_people"
                      label="Maximum People"
                      type="number"
                      placeholder="15"
                    />
                  </div>

                  <FormField
                    name="guide_required"
                    label="Guide Required"
                    type="checkbox"
                    description="Check if a guide is required for this trek"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    name="cost_per_person"
                    label="Cost per Person (₹)"
                    type="number"
                    placeholder="5000"
                    description="Enter amount in Indian Rupees"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Important Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    name="permits_required"
                    label="Permits Required"
                    type="textarea"
                    placeholder="List any required permits..."
                  />

                  <FormField
                    name="equipment_needed"
                    label="Equipment Needed"
                    type="textarea"
                    placeholder="List essential equipment..."
                  />

                  <FormField
                    name="safety_tips"
                    label="Safety Tips"
                    type="textarea"
                    placeholder="Important safety guidelines..."
                  />
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Card>
                <CardContent className="pt-6">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Creating Trek...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Trek
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTrekPage;
