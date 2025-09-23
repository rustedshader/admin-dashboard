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

    // Extract supported query parameters for offline activities
    const supportedParams = [
      "state",
      "difficulty",
      "city",
      "district",
      "limit",
    ];
    supportedParams.forEach((param) => {
      const value = searchParams.get(param);
      if (value !== null && value !== "") {
        params[param] = value;
      }
    });

    const url = buildApiUrl(API_ENDPOINTS.activities.offline.list, params);
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
        { error: "Failed to fetch offline activities", details: errorData },
        { status: response.status }
      );
    }

    const activitiesData = await response.json();
    return NextResponse.json(activitiesData);
  } catch (error) {
    console.error("Offline activities fetch error:", error);
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

    const activityData = await request.json();

    const url = buildApiUrl(API_ENDPOINTS.activities.offline.create);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(activityData),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}` };
      }
      return NextResponse.json(
        { error: "Failed to create offline activity", details: errorData },
        { status: response.status }
      );
    }

    const createdActivity = await response.json();
    return NextResponse.json(createdActivity);
  } catch (error) {
    console.error("Offline activity creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
