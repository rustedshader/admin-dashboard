import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINTS, buildApiUrl } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};

    // Extract supported query parameters for accommodations
    const supportedParams = [
      "page",
      "page_size",
      "city",
      "state",
      "latitude",
      "longitude",
      "radius_km",
    ];
    supportedParams.forEach((param) => {
      const value = searchParams.get(param);
      if (value !== null && value !== "") {
        params[param] = value;
      }
    });

    // Set default pagination if not provided
    if (!params.page) params.page = "1";
    if (!params.page_size) params.page_size = "20";

    const url = buildApiUrl(API_ENDPOINTS.accommodations.list, params);
    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}` };
      }
      return NextResponse.json(
        { error: "Failed to fetch accommodations", details: errorData },
        { status: response.status }
      );
    }

    const accommodationsData = await response.json();
    return NextResponse.json(accommodationsData);
  } catch (error) {
    console.error("Accommodations fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const accommodationData = await request.json();

    const url = buildApiUrl(API_ENDPOINTS.accommodations.create);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(accommodationData),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}` };
      }
      return NextResponse.json(
        { error: "Failed to create accommodation", details: errorData },
        { status: response.status }
      );
    }

    const createdAccommodation = await response.json();
    return NextResponse.json(createdAccommodation);
  } catch (error) {
    console.error("Accommodation creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
