"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Radio, Save, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FormData {
  device_id: string;
  status: "active" | "inactive" | "maintenance";
  treck_id?: number;
}

interface FormErrors {
  device_id?: string;
  status?: string;
  treck_id?: string;
}

export default function AddTrackingDevicePage() {
  const [formData, setFormData] = useState<FormData>({
    device_id: "",
    status: "active",
    treck_id: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const { authenticatedFetch } = useAuthenticatedFetch();
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.device_id.trim()) {
      newErrors.device_id = "Device ID is required";
    } else if (formData.device_id.length < 3) {
      newErrors.device_id = "Device ID must be at least 3 characters";
    }

    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    try {
      setLoading(true);

      const payload: any = {
        device_id: formData.device_id.trim(),
        status: formData.status,
      };

      // Only include treck_id if it's provided and valid
      if (formData.treck_id && formData.treck_id > 0) {
        payload.treck_id = formData.treck_id;
      }

      const response = await authenticatedFetch(
        "/api/tracking-device/create-device",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success("Tracking device created successfully!");

        // Show API key in a toast for user to copy
        if (result.api_key) {
          toast.success(`API Key: ${result.api_key}`, {
            duration: 10000,
            description:
              "Make sure to copy this API key - you won't see it again!",
          });
        }

        router.push("/transport");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create tracking device");
      }
    } catch (error) {
      console.error("Error creating tracking device:", error);
      toast.error("Failed to create tracking device");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  if (sessionStatus === "loading") {
    return <div className="p-6">Loading...</div>;
  }

  if (sessionStatus === "unauthenticated") {
    return <div className="p-6">Please log in to create tracking devices.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/transport">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Devices
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Add New Tracking Device</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Radio className="w-6 h-6" />
            <CardTitle>Device Registration</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Device ID */}
            <div className="space-y-2">
              <Label htmlFor="device_id">
                Device ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="device_id"
                type="text"
                placeholder="Enter unique device ID (e.g., GPS001, TRACKER_123)"
                value={formData.device_id}
                onChange={(e) => handleInputChange("device_id", e.target.value)}
                className={errors.device_id ? "border-red-500" : ""}
              />
              {errors.device_id && (
                <div className="flex items-center space-x-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.device_id}</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Unique identifier for this tracking device. This will be used in
                API calls.
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">
                Initial Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive" | "maintenance") =>
                  handleInputChange("status", value)
                }
              >
                <SelectTrigger
                  className={errors.status ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select device status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Active</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Inactive</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="maintenance">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Maintenance</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <div className="flex items-center space-x-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.status}</span>
                </div>
              )}
            </div>

            {/* Trek ID (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="treck_id">Trek ID (Optional)</Label>
              <Input
                id="treck_id"
                type="number"
                min="1"
                placeholder="Enter trek ID if assigning to specific trek"
                value={formData.treck_id || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange(
                    "treck_id",
                    value ? parseInt(value) : undefined
                  );
                }}
              />
              <p className="text-sm text-muted-foreground">
                Optional: Associate this device with a specific trek for
                organization.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <h4 className="font-semibold mb-1">Important Information</h4>
                  <ul className="space-y-1 text-xs">
                    <li>
                      • An API key will be automatically generated for this
                      device
                    </li>
                    <li>
                      • The API key will be displayed only once after creation
                    </li>
                    <li>• Make sure to copy and store the API key securely</li>
                    <li>
                      • The device status can be updated later from the devices
                      list
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link href="/transport">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Device
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
