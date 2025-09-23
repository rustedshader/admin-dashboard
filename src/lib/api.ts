/**
 * Utility functions for API error handling and token management
 */

export interface ApiErrorResponse {
  error: string;
  details?: string;
  detail?: Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}

// Base API URL from environment
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

// API endpoints mapping based on OpenAPI spec
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: "/auth/login",
    refresh: "/auth/refresh",
    me: "/auth/me",
    logout: "/auth/logout",
    signup: "/auth/sign-up",
  },
  // Admin endpoints
  admin: {
    users: {
      list: "/admin/users/list",
      details: (userId: number) => `/admin/users/${userId}`,
      updateStatus: (userId: number) => `/admin/users/${userId}/status`,
      stats: "/admin/admin/stats",
      unverified: "/admin/unverified",
    },
    blockchain: {
      issue: "/admin/issue-blockchain-id",
    },
    trips: {
      active: "/admin/active-trips",
      locations: "/admin/latest-trip-locations",
    },
  },
  // Geofencing endpoints
  geofencing: {
    restrictedAreas: {
      list: "/geofencing/restricted-areas",
      create: "/geofencing/restricted-areas",
      details: (areaId: number) => `/geofencing/restricted-areas/${areaId}`,
      update: (areaId: number) => `/geofencing/restricted-areas/${areaId}`,
      delete: (areaId: number) => `/geofencing/restricted-areas/${areaId}`,
      checkLocation: "/geofencing/check-location",
      validatePolygon: "/geofencing/validate-polygon",
    },
  },
  // Activities endpoints
  activities: {
    offline: {
      list: "/offline_activities/",
      create: "/offline_activities/",
      details: (activityId: number) => `/offline_activities/${activityId}`,
      update: (activityId: number) => `/offline_activities/${activityId}`,
      delete: (activityId: number) => `/offline_activities/${activityId}`,
      route: (activityId: number) => `/offline_activities/${activityId}/route`,
      addRoute: "/offline_activities/route-data",
    },
    online: {
      list: "/online-activities/",
      create: "/online-activities/",
      details: (activityId: number) => `/online-activities/${activityId}`,
      update: (activityId: number) => `/online-activities/${activityId}`,
      delete: (activityId: number) => `/online-activities/${activityId}`,
      search: "/online-activities/search",
    },
  },
  // Accommodations endpoints
  accommodations: {
    list: "/accommodations/",
    create: "/accommodations/",
    details: (accommodationId: number) => `/accommodations/${accommodationId}`,
    update: (accommodationId: number) => `/accommodations/${accommodationId}`,
    delete: (accommodationId: number) => `/accommodations/${accommodationId}`,
    search: "/accommodations/search",
  },
  // Trips endpoints
  trips: {
    all: "/trips/all-trips",
    details: (tripId: number) => `/trips/${tripId}`,
    locationShares: "/trips/location-shares",
    liveLocation: (tripId: number) => `/trips/${tripId}/live-location`,
    shareLocation: (tripId: number) => `/trips/${tripId}/share-location`,
    sharedLocation: (shareCode: string) =>
      `/trips/shared-location/${shareCode}`,
    toggleSharing: (tripId: number) => `/trips/${tripId}/share-location/toggle`,
  },
  // Itineraries endpoints
  itineraries: {
    list: "/itineraries/",
    create: "/itineraries/",
    details: (itineraryId: number) => `/itineraries/${itineraryId}`,
    update: (itineraryId: number) => `/itineraries/${itineraryId}`,
    delete: (itineraryId: number) => `/itineraries/${itineraryId}`,
    days: (itineraryId: number) => `/itineraries/${itineraryId}/days`,
    updateDay: (itineraryId: number, dayId: number) =>
      `/itineraries/${itineraryId}/days/${dayId}`,
  },
  // Tourist ID endpoints
  touristId: {
    status: "/tourist-id/status",
    revoke: "/tourist-id/revoke",
  },
  // Routing endpoints
  routing: {
    testRoute: "/routing/test-route-with-geofencing",
  },
} as const;

export function isTokenExpiredError(error: any): boolean {
  if (typeof error === "string") {
    return (
      error.includes("Could not validate credentials") ||
      error.includes("token") ||
      error.includes("expired")
    );
  }

  if (error?.message) {
    return (
      error.message.includes("Could not validate credentials") ||
      error.message.includes("token") ||
      error.message.includes("expired")
    );
  }

  if (error?.details) {
    return (
      error.details.includes("Could not validate credentials") ||
      error.details.includes("token") ||
      error.details.includes("expired")
    );
  }

  return false;
}

export async function handleApiResponse(response: Response): Promise<any> {
  if (!response.ok) {
    let errorData: ApiErrorResponse;

    try {
      errorData = await response.json();
    } catch {
      errorData = {
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Check for token expiration
    if (response.status === 401 || isTokenExpiredError(errorData)) {
      throw new Error("TOKEN_EXPIRED");
    }

    throw new Error(
      errorData.error || `Request failed with status ${response.status}`
    );
  }

  return response.json();
}

export function formatApiError(error: any): string {
  if (error.message === "TOKEN_EXPIRED") {
    return "Your session has expired. Please login again.";
  }

  if (error.message?.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }

  // Handle validation errors from FastAPI
  if (error.detail && Array.isArray(error.detail)) {
    const validationErrors = error.detail
      .map((err: any) => `${err.loc.join(".")}: ${err.msg}`)
      .join("; ");
    return `Validation error: ${validationErrors}`;
  }

  return error.message || error.error || "An unexpected error occurred";
}

// Helper function to build API URLs
export function buildApiUrl(
  endpoint: string,
  params?: Record<string, any>
): string {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_API_URL is not configured");
  }

  const url = new URL(endpoint, API_BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });
  }

  return url.toString();
}

// Helper to create authenticated fetch options
export function createAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// Helper for form-encoded data (needed for login)
export function createFormHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}
