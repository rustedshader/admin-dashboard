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

    // Extract supported query parameters
    const supportedParams = [
      "limit",
      "offset",
      "role_filter",
      "is_active_filter",
      "is_verified_filter",
    ];
    supportedParams.forEach((param) => {
      const value = searchParams.get(param);
      if (value !== null && value !== "") {
        params[param] = value;
      }
    });

    // Set defaults
    if (!params.limit) params.limit = "100";
    if (!params.offset) params.offset = "0";

    const url = buildApiUrl(API_ENDPOINTS.admin.users.list, params);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch users", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Users list API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
