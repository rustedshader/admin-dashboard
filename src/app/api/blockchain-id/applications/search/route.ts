import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINTS, buildApiUrl } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    // Extract query parameters for pagination
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};

    const page = searchParams.get("page");
    const page_size = searchParams.get("page_size");

    if (page) params.page = page;
    if (page_size) params.page_size = page_size;

    // Get the search query from request body
    const searchQuery = await request.json();

    const url = buildApiUrl(API_ENDPOINTS.blockchainId.search, params);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(searchQuery),
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
          error: "Failed to search blockchain ID applications",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const results = await response.json();
    return NextResponse.json(results);
  } catch (error) {
    console.error("Blockchain ID search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
