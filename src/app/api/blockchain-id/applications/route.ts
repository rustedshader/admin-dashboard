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

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};

    // Get pagination and filter parameters
    const page = searchParams.get("page");
    const page_size = searchParams.get("page_size");
    const status = searchParams.get("status");

    if (page) params.page = page;
    if (page_size) params.page_size = page_size;
    if (status) params.status = status;

    const url = buildApiUrl(API_ENDPOINTS.blockchainId.applications, params);
    const response = await fetch(url, {
      method: "GET",
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
        {
          error: "Failed to fetch blockchain ID applications",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const applications = await response.json();
    return NextResponse.json(applications);
  } catch (error) {
    console.error("Blockchain ID applications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
